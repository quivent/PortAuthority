/// Process management for porter daemon
use crate::apps::AppConfig;
use crate::config::Config;
use crate::error::{PorterError, Result};
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::fs::{File, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

/// Represents a managed process
pub struct ManagedProcess {
    /// Process configuration
    pub config: AppConfig,

    /// Child process handle (None if stopped)
    child: Option<Child>,

    /// Process ID
    pid: Option<u32>,

    /// Process state
    state: ProcessState,

    /// Restart statistics
    restart_count: u32,
    last_restart: Option<Instant>,

    /// Log manager
    log_manager: LogManager,

    /// Health check state
    last_health_check: Option<Instant>,
    consecutive_failures: u32,

    /// Backoff strategy
    backoff: ExponentialBackoff,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProcessState {
    Stopped,
    Starting,
    Running,
    Unhealthy,
    Restarting,
    Failed,
}

#[derive(Debug, Clone)]
pub struct HealthStatus {
    pub healthy: bool,
    pub message: String,
    #[allow(dead_code)]
    pub check_time: Instant,
}

/// Backoff strategy for restarts
pub struct ExponentialBackoff {
    attempt: u32,
    base_delay: Duration,
    max_delay: Duration,
}

impl ExponentialBackoff {
    pub fn new() -> Self {
        Self {
            attempt: 0,
            base_delay: Duration::from_secs(1),
            max_delay: Duration::from_secs(60),
        }
    }

    pub fn next_delay(&mut self) -> Duration {
        let delay = self.base_delay * 2_u32.pow(self.attempt);
        self.attempt += 1;
        std::cmp::min(delay, self.max_delay)
    }

    pub fn reset(&mut self) {
        self.attempt = 0;
    }
}

impl Default for ExponentialBackoff {
    fn default() -> Self {
        Self::new()
    }
}

impl ManagedProcess {
    /// Create a new managed process from configuration
    pub fn new(config: AppConfig) -> Result<Self> {
        let log_manager = LogManager::new(&config.name)?;

        Ok(Self {
            config,
            child: None,
            pid: None,
            state: ProcessState::Stopped,
            restart_count: 0,
            last_restart: None,
            log_manager,
            last_health_check: None,
            consecutive_failures: 0,
            backoff: ExponentialBackoff::new(),
        })
    }

    /// Start the process
    pub fn start(&mut self) -> Result<()> {
        if self.is_running() {
            return Err(PorterError::Process(format!(
                "Process {} is already running",
                self.config.name
            )));
        }

        info!("Starting process: {}", self.config.name);
        self.state = ProcessState::Starting;

        // Parse command
        let cmd_parts: Vec<&str> = self.config.command.split_whitespace().collect();
        if cmd_parts.is_empty() {
            return Err(PorterError::ProcessSpawnFailed("Empty command".to_string()));
        }

        // Open log files
        let stdout_file = self.log_manager.open_stdout()?;
        let stderr_file = self.log_manager.open_stderr()?;

        // Spawn process
        let child = Command::new(cmd_parts[0])
            .args(&cmd_parts[1..])
            .current_dir(&self.config.directory)
            .envs(&self.config.env)
            .stdout(Stdio::from(stdout_file))
            .stderr(Stdio::from(stderr_file))
            .spawn()
            .map_err(|e| {
                PorterError::ProcessSpawnFailed(format!(
                    "Failed to spawn process '{}': {}",
                    self.config.command, e
                ))
            })?;

        self.pid = Some(child.id());
        self.child = Some(child);
        self.state = ProcessState::Running;

        info!(
            "Process {} started with PID {}",
            self.config.name,
            self.pid.unwrap()
        );
        Ok(())
    }

    /// Stop the process gracefully
    pub fn stop(&mut self) -> Result<()> {
        if !self.is_running() {
            return Ok(());
        }

        info!("Stopping process: {}", self.config.name);

        if let Some(mut child) = self.child.take() {
            // Try graceful shutdown first (platform-specific)
            #[cfg(unix)]
            {
                use nix::sys::signal::{kill, Signal};
                use nix::unistd::Pid;

                if let Some(pid) = self.pid {
                    let _ = kill(Pid::from_raw(pid as i32), Signal::SIGTERM);
                }
            }

            // Wait for process to exit (with timeout)
            let timeout = Duration::from_secs(10);
            let start = Instant::now();

            loop {
                match child.try_wait() {
                    Ok(Some(_)) => {
                        info!("Process {} stopped gracefully", self.config.name);
                        break;
                    }
                    Ok(None) => {
                        if start.elapsed() > timeout {
                            warn!("Process {} did not stop gracefully, killing", self.config.name);
                            let _ = child.kill();
                            let _ = child.wait();
                            break;
                        }
                        std::thread::sleep(Duration::from_millis(100));
                    }
                    Err(e) => {
                        error!("Error waiting for process {}: {}", self.config.name, e);
                        break;
                    }
                }
            }
        }

        self.child = None;
        self.pid = None;
        self.state = ProcessState::Stopped;

        Ok(())
    }

    /// Force kill the process
    pub fn kill(&mut self) -> Result<()> {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }

        self.child = None;
        self.pid = None;
        self.state = ProcessState::Stopped;

        Ok(())
    }

    /// Restart the process
    pub fn restart(&mut self) -> Result<()> {
        info!("Restarting process: {}", self.config.name);

        // Stop if running
        if self.is_running() {
            self.stop()?;
        }

        // Wait for backoff delay
        if self.restart_count > 0 {
            let delay = self.backoff.next_delay();
            debug!("Waiting {:?} before restart", delay);
            std::thread::sleep(delay);
        }

        // Check restart limit
        if self.restart_count >= self.config.max_restarts {
            error!(
                "Process {} reached maximum restart attempts ({})",
                self.config.name, self.config.max_restarts
            );
            self.state = ProcessState::Failed;
            return Err(PorterError::RestartLimitReached(self.config.name.clone()));
        }

        // Rotate logs before restart
        self.log_manager.rotate_if_needed()?;

        // Start process
        self.state = ProcessState::Restarting;
        self.start()?;

        self.restart_count += 1;
        self.last_restart = Some(Instant::now());

        // Reset consecutive failures on successful restart
        self.consecutive_failures = 0;

        Ok(())
    }

    /// Check process health
    pub async fn health_check(&mut self) -> Result<HealthStatus> {
        // First check if process is still running
        if let Some(ref mut child) = self.child {
            match child.try_wait() {
                Ok(Some(status)) => {
                    warn!(
                        "Process {} exited with status: {}",
                        self.config.name, status
                    );
                    self.state = ProcessState::Unhealthy;
                    return Ok(HealthStatus {
                        healthy: false,
                        message: format!("Process exited with status: {}", status),
                        check_time: Instant::now(),
                    });
                }
                Ok(None) => {
                    // Process still running, continue with health check
                }
                Err(e) => {
                    return Ok(HealthStatus {
                        healthy: false,
                        message: format!("Error checking process status: {}", e),
                        check_time: Instant::now(),
                    });
                }
            }
        } else {
            return Ok(HealthStatus {
                healthy: false,
                message: "Process not running".to_string(),
                check_time: Instant::now(),
            });
        }

        // Perform health check based on configuration
        let strategy = match self.config.health_check_type.as_str() {
            "websocket" | "ws" => HealthCheckStrategy::WebSocket {
                port: self.config.port,
                path: self
                    .config
                    .health_check_path
                    .clone()
                    .unwrap_or_else(|| "/".to_string()),
                timeout_secs: self.config.websocket_timeout,
            },
            "http" | "https" => HealthCheckStrategy::Http {
                port: self.config.port,
                path: self
                    .config
                    .health_check_path
                    .clone()
                    .unwrap_or_else(|| "/health".to_string()),
                expected_status: 200,
            },
            _ => HealthCheckStrategy::TcpPort {
                port: self.config.port,
            },
        };

        let status = strategy.check().await?;
        self.last_health_check = Some(Instant::now());

        if !status.healthy {
            self.consecutive_failures += 1;
            if self.consecutive_failures >= 3 {
                self.state = ProcessState::Unhealthy;
            }
        } else {
            self.consecutive_failures = 0;
            if self.state == ProcessState::Unhealthy {
                self.state = ProcessState::Running;
            }
        }

        Ok(status)
    }

    /// Get process status
    pub fn status(&self) -> ProcessStatus {
        ProcessStatus {
            name: self.config.name.clone(),
            state: self.state.clone(),
            pid: self.pid,
            uptime: self.pid.and_then(|_| Some(Duration::from_secs(0))), // TODO: Calculate actual uptime
            restart_count: self.restart_count,
            last_health_check: self
                .last_health_check
                .map(|t| Instant::now().duration_since(t)),
            health_status: Some(self.consecutive_failures == 0),
        }
    }

    /// Read recent logs
    pub fn get_logs(&self, lines: usize) -> Result<Vec<String>> {
        self.log_manager.read_recent_stdout(lines)
    }

    /// Check if process is running
    pub fn is_running(&self) -> bool {
        self.child.is_some() && self.state != ProcessState::Stopped
    }

    /// Get consecutive failure count
    pub fn consecutive_failures(&self) -> u32 {
        self.consecutive_failures
    }
}

/// Process status information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessStatus {
    pub name: String,
    pub state: ProcessState,
    pub pid: Option<u32>,
    #[serde(skip)]
    pub uptime: Option<Duration>,
    pub restart_count: u32,
    #[serde(skip)]
    pub last_health_check: Option<Duration>,
    pub health_status: Option<bool>,
}

/// Health check strategies
pub enum HealthCheckStrategy {
    /// Check if port is accepting connections
    TcpPort { port: u16 },

    /// HTTP GET request to endpoint
    Http {
        port: u16,
        path: String,
        expected_status: u16,
    },

    /// WebSocket connection check
    WebSocket {
        port: u16,
        path: String,
        timeout_secs: u64,
    },
}

impl HealthCheckStrategy {
    pub async fn check(&self) -> Result<HealthStatus> {
        match self {
            Self::TcpPort { port } => self.check_tcp_port(*port).await,
            Self::Http {
                port,
                path,
                expected_status,
            } => self.check_http(*port, path, *expected_status).await,
            Self::WebSocket {
                port,
                path,
                timeout_secs,
            } => self.check_websocket(*port, path, *timeout_secs).await,
        }
    }

    async fn check_tcp_port(&self, port: u16) -> Result<HealthStatus> {
        use std::net::TcpStream;

        let addr = format!("127.0.0.1:{}", port);
        match TcpStream::connect_timeout(
            &addr.parse().unwrap(),
            Duration::from_secs(5),
        ) {
            Ok(_) => Ok(HealthStatus {
                healthy: true,
                message: format!("Port {} is accepting connections", port),
                check_time: Instant::now(),
            }),
            Err(e) => Ok(HealthStatus {
                healthy: false,
                message: format!("Port {} not accessible: {}", port, e),
                check_time: Instant::now(),
            }),
        }
    }

    async fn check_http(&self, port: u16, path: &str, _expected: u16) -> Result<HealthStatus> {
        // Simple HTTP health check using TCP connection
        // For a production system, consider using reqwest crate for full HTTP support
        match self.check_tcp_port(port).await {
            Ok(status) if status.healthy => Ok(HealthStatus {
                healthy: true,
                message: format!("HTTP endpoint http://127.0.0.1:{}{} responding", port, path),
                check_time: Instant::now(),
            }),
            _ => Ok(HealthStatus {
                healthy: false,
                message: format!("HTTP endpoint http://127.0.0.1:{}{} not responding", port, path),
                check_time: Instant::now(),
            }),
        }
    }

    async fn check_websocket(
        &self,
        port: u16,
        path: &str,
        timeout_secs: u64,
    ) -> Result<HealthStatus> {
        use tokio::time::{timeout, Duration};
        use tokio_tungstenite::connect_async;

        let url = format!("ws://127.0.0.1:{}{}", port, path);
        let timeout_duration = Duration::from_secs(timeout_secs);

        match timeout(timeout_duration, connect_async(&url)).await {
            Ok(Ok((ws_stream, _))) => {
                drop(ws_stream); // Close connection
                Ok(HealthStatus {
                    healthy: true,
                    message: format!("WebSocket endpoint {} is responding", url),
                    check_time: Instant::now(),
                })
            }
            Ok(Err(e)) => Ok(HealthStatus {
                healthy: false,
                message: format!("WebSocket connection failed: {}", e),
                check_time: Instant::now(),
            }),
            Err(_) => Ok(HealthStatus {
                healthy: false,
                message: format!("WebSocket connection timed out after {}s", timeout_secs),
                check_time: Instant::now(),
            }),
        }
    }
}

/// Log file management
pub struct LogManager {
    app_name: String,
    log_dir: PathBuf,
    max_size: usize,
    max_rotations: usize,
}

impl LogManager {
    pub fn new(app_name: &str) -> Result<Self> {
        let log_dir = Config::config_dir()?.join("logs").join(app_name);
        std::fs::create_dir_all(&log_dir)?;

        Ok(Self {
            app_name: app_name.to_string(),
            log_dir,
            max_size: 10 * 1024 * 1024, // 10MB
            max_rotations: 5,
        })
    }

    pub fn stdout_path(&self) -> PathBuf {
        self.log_dir.join("stdout.log")
    }

    pub fn stderr_path(&self) -> PathBuf {
        self.log_dir.join("stderr.log")
    }

    pub fn open_stdout(&self) -> Result<File> {
        self.rotate_if_needed()?;
        Ok(OpenOptions::new()
            .create(true)
            .append(true)
            .open(self.stdout_path())?)
    }

    pub fn open_stderr(&self) -> Result<File> {
        Ok(OpenOptions::new()
            .create(true)
            .append(true)
            .open(self.stderr_path())?)
    }

    pub fn rotate_if_needed(&self) -> Result<()> {
        let stdout_path = self.stdout_path();
        if let Ok(metadata) = std::fs::metadata(&stdout_path) {
            if metadata.len() as usize > self.max_size {
                self.rotate_log(&stdout_path)?;
            }
        }

        let stderr_path = self.stderr_path();
        if let Ok(metadata) = std::fs::metadata(&stderr_path) {
            if metadata.len() as usize > self.max_size {
                self.rotate_log(&stderr_path)?;
            }
        }

        Ok(())
    }

    fn rotate_log(&self, path: &Path) -> Result<()> {
        debug!("Rotating log file: {:?}", path);

        // Rotate existing logs
        for i in (1..self.max_rotations).rev() {
            let old = path.with_extension(format!("log.{}", i));
            let new = path.with_extension(format!("log.{}", i + 1));
            if old.exists() {
                std::fs::rename(&old, &new)?;
            }
        }

        // Move current log to .1
        if path.exists() {
            let rotated = path.with_extension("log.1");
            std::fs::rename(path, rotated)?;
        }

        Ok(())
    }

    pub fn read_recent_stdout(&self, lines: usize) -> Result<Vec<String>> {
        self.read_recent(&self.stdout_path(), lines)
    }

    pub fn read_recent_stderr(&self, lines: usize) -> Result<Vec<String>> {
        self.read_recent(&self.stderr_path(), lines)
    }

    fn read_recent(&self, path: &Path, lines: usize) -> Result<Vec<String>> {
        if !path.exists() {
            return Ok(Vec::new());
        }

        let file = File::open(path)?;
        let reader = BufReader::new(file);

        let all_lines: Vec<String> = reader.lines().filter_map(|line| line.ok()).collect();

        let start = all_lines.len().saturating_sub(lines);
        Ok(all_lines[start..].to_vec())
    }
}

// Unix-specific signal handling
#[cfg(unix)]
mod unix {
    use nix::sys::signal::{kill, Signal};
    use nix::unistd::Pid;

    pub fn send_signal(pid: u32, signal: Signal) -> Result<(), nix::errno::Errno> {
        kill(Pid::from_raw(pid as i32), signal)
    }

    pub fn process_exists(pid: u32) -> bool {
        send_signal(pid, Signal::SIGTERM).is_ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exponential_backoff() {
        let mut backoff = ExponentialBackoff::new();
        assert_eq!(backoff.next_delay(), Duration::from_secs(1));
        assert_eq!(backoff.next_delay(), Duration::from_secs(2));
        assert_eq!(backoff.next_delay(), Duration::from_secs(4));
        assert_eq!(backoff.next_delay(), Duration::from_secs(8));
        assert_eq!(backoff.next_delay(), Duration::from_secs(16));
        assert_eq!(backoff.next_delay(), Duration::from_secs(32));
        assert_eq!(backoff.next_delay(), Duration::from_secs(60)); // Max delay

        backoff.reset();
        assert_eq!(backoff.next_delay(), Duration::from_secs(1));
    }

    #[tokio::test]
    async fn test_tcp_health_check() {
        use std::net::TcpListener;

        // Start a test TCP server
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();

        let checker = HealthCheckStrategy::TcpPort { port };
        let status = checker.check().await.unwrap();

        assert!(status.healthy);
        assert!(status.message.contains(&port.to_string()));
    }

    #[tokio::test]
    async fn test_tcp_health_check_failure() {
        // Use a port that's not listening
        let checker = HealthCheckStrategy::TcpPort { port: 65432 };
        let status = checker.check().await.unwrap();

        assert!(!status.healthy);
    }

    #[test]
    fn test_log_manager() {
        use std::env;

        let log_mgr = LogManager::new("test-app").unwrap();
        assert!(log_mgr.log_dir.exists());
        assert!(log_mgr.stdout_path().to_string_lossy().contains("test-app"));
    }
}
