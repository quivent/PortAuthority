/// Daemon supervisor for managing background processes
use crate::apps::{AppConfig, AppRegistry};
use crate::config::Config;
use crate::error::{PorterError, Result};
use crate::process::{ManagedProcess, ProcessState, ProcessStatus};
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{mpsc, RwLock, watch};

/// Daemon configuration
#[derive(Debug, Clone)]
pub struct DaemonConfig {
    pub pid_file: PathBuf,
    pub auto_restart: bool,
    pub health_check_enabled: bool,
}

impl Default for DaemonConfig {
    fn default() -> Self {
        let pid_file = Config::config_dir()
            .unwrap_or_else(|_| PathBuf::from("/tmp"))
            .join("daemon.pid");

        Self {
            pid_file,
            auto_restart: true,
            health_check_enabled: true,
        }
    }
}

/// Daemon control commands
#[derive(Debug)]
pub enum DaemonCommand {
    StartApp(String),
    StopApp(String),
    RestartApp(String),
    StartGroup(String),
    StopGroup(String),
    RestartGroup(String),
    GetStatus(tokio::sync::oneshot::Sender<DaemonStatus>),
    ReloadApps,  // Hot-reload apps from config
    Shutdown,
}

/// Daemon status information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DaemonStatus {
    pub pid: u32,
    pub uptime: Duration,
    pub apps: Vec<ProcessStatus>,
    pub total_restarts: u32,
}

/// Main daemon structure
pub struct Daemon {
    /// App registry
    registry: Arc<RwLock<AppRegistry>>,

    /// Managed processes
    processes: Arc<RwLock<HashMap<String, ManagedProcess>>>,

    /// Control channel
    control_tx: mpsc::Sender<DaemonCommand>,
    control_rx: mpsc::Receiver<DaemonCommand>,

    /// Daemon configuration
    config: DaemonConfig,

    /// Start time
    start_time: Instant,
}

impl Daemon {
    /// Create a new daemon instance
    pub async fn new(config: DaemonConfig, registry: AppRegistry) -> Result<Self> {
        let (control_tx, control_rx) = mpsc::channel(100);

        Ok(Self {
            registry: Arc::new(RwLock::new(registry)),
            processes: Arc::new(RwLock::new(HashMap::new())),
            control_tx,
            control_rx,
            config,
            start_time: Instant::now(),
        })
    }

    /// Start the daemon
    pub async fn run(mut self) -> Result<()> {
        info!("Starting daemon with PID {}", std::process::id());

        // Write PID file
        PidFile::new(self.config.pid_file.clone()).write()?;

        // Install signal handlers
        self.setup_signal_handlers()?;

        // Start all configured apps
        self.start_all_apps().await?;

        info!("Daemon started successfully, entering monitoring loop");

        // Setup config file watcher
        let (config_tx, mut config_rx) = watch::channel(());
        let config_path = Config::config_path()?;
        tokio::spawn(async move {
            if let Err(e) = Self::watch_config_file(config_path, config_tx).await {
                error!("Config file watcher error: {}", e);
            }
        });

        // Main event loop
        let mut health_check_interval = tokio::time::interval(Duration::from_secs(10));

        loop {
            tokio::select! {
                Some(cmd) = self.control_rx.recv() => {
                    if self.handle_command(cmd).await? {
                        info!("Shutdown signal received, exiting main loop");
                        break; // Shutdown requested
                    }
                }
                _ = health_check_interval.tick() => {
                    if self.config.health_check_enabled {
                        self.check_all_health().await?;
                    }
                }
                Ok(_) = config_rx.changed() => {
                    info!("Config file changed, reloading apps");
                    if let Err(e) = self.reload_apps_from_config().await {
                        error!("Failed to reload apps from config: {}", e);
                    }
                }
            }
        }

        // Cleanup
        info!("Shutting down daemon gracefully");
        self.stop_all_apps().await?;
        PidFile::new(self.config.pid_file.clone()).remove()?;

        info!("Daemon stopped");
        Ok(())
    }

    /// Start all configured apps
    async fn start_all_apps(&self) -> Result<()> {
        let registry = self.registry.read().await;
        let mut processes = self.processes.write().await;

        info!("Starting {} configured apps", registry.len());

        for app_config in registry.list() {
            match ManagedProcess::new(app_config.clone()) {
                Ok(mut process) => {
                    if let Err(e) = process.start() {
                        error!("Failed to start app {}: {}", app_config.name, e);
                    } else {
                        info!("Started app: {}", app_config.name);
                        processes.insert(app_config.name.clone(), process);
                    }
                }
                Err(e) => {
                    error!("Failed to create managed process for {}: {}", app_config.name, e);
                }
            }
        }

        Ok(())
    }

    /// Stop all running apps
    async fn stop_all_apps(&self) -> Result<()> {
        let mut processes = self.processes.write().await;

        info!("Stopping {} running apps", processes.len());

        for (name, process) in processes.iter_mut() {
            if let Err(e) = process.stop() {
                error!("Failed to stop app {}: {}", name, e);
            } else {
                info!("Stopped app: {}", name);
            }
        }

        Ok(())
    }

    /// Check health of all processes
    async fn check_all_health(&self) -> Result<()> {
        let mut processes = self.processes.write().await;

        for (name, process) in processes.iter_mut() {
            if !process.is_running() {
                continue;
            }

            match process.health_check().await {
                Ok(health) => {
                    if !health.healthy {
                        warn!("App {} is unhealthy: {}", name, health.message);

                        // Auto-restart if enabled and configured
                        if self.config.auto_restart && process.config.auto_restart {
                            if process.consecutive_failures() >= 3 {
                                warn!("App {} failed 3 consecutive health checks, attempting restart", name);

                                if let Err(e) = process.restart() {
                                    error!("Failed to restart app {}: {}", name, e);
                                } else {
                                    info!("Successfully restarted app {}", name);
                                }
                            }
                        }
                    } else {
                        debug!("App {} is healthy", name);
                    }
                }
                Err(e) => {
                    error!("Health check error for app {}: {}", name, e);
                }
            }
        }

        Ok(())
    }

    /// Handle control command
    async fn handle_command(&mut self, cmd: DaemonCommand) -> Result<bool> {
        match cmd {
            DaemonCommand::StartApp(name) => {
                info!("Received command to start app: {}", name);
                self.start_app(&name).await?;
                Ok(false)
            }
            DaemonCommand::StopApp(name) => {
                info!("Received command to stop app: {}", name);
                self.stop_app(&name).await?;
                Ok(false)
            }
            DaemonCommand::RestartApp(name) => {
                info!("Received command to restart app: {}", name);
                self.restart_app(&name).await?;
                Ok(false)
            }
            DaemonCommand::StartGroup(group) => {
                info!("Received command to start group: {}", group);
                self.start_group(&group).await?;
                Ok(false)
            }
            DaemonCommand::StopGroup(group) => {
                info!("Received command to stop group: {}", group);
                self.stop_group(&group).await?;
                Ok(false)
            }
            DaemonCommand::RestartGroup(group) => {
                info!("Received command to restart group: {}", group);
                self.restart_group(&group).await?;
                Ok(false)
            }
            DaemonCommand::GetStatus(tx) => {
                debug!("Received status request");
                let status = self.get_status().await;
                let _ = tx.send(status);
                Ok(false)
            }
            DaemonCommand::ReloadApps => {
                info!("Received command to reload apps");
                self.reload_apps_from_config().await?;
                Ok(false)
            }
            DaemonCommand::Shutdown => {
                info!("Shutdown command received");
                Ok(true)
            }
        }
    }

    /// Start a specific app
    async fn start_app(&mut self, name: &str) -> Result<()> {
        let registry = self.registry.read().await;
        let mut processes = self.processes.write().await;

        // Check if already running
        if let Some(process) = processes.get(name) {
            if process.is_running() {
                return Err(PorterError::Process(format!(
                    "App {} is already running",
                    name
                )));
            }
        }

        // Get app config
        let app_config = registry
            .get(name)
            .ok_or_else(|| PorterError::AppNotFound(name.to_string()))?
            .clone();

        // Create and start process
        let mut process = ManagedProcess::new(app_config)?;
        process.start()?;

        processes.insert(name.to_string(), process);
        info!("Started app: {}", name);

        Ok(())
    }

    /// Stop a specific app
    async fn stop_app(&mut self, name: &str) -> Result<()> {
        let mut processes = self.processes.write().await;

        let process = processes
            .get_mut(name)
            .ok_or_else(|| PorterError::AppNotFound(name.to_string()))?;

        process.stop()?;
        info!("Stopped app: {}", name);

        Ok(())
    }

    /// Restart a specific app
    async fn restart_app(&mut self, name: &str) -> Result<()> {
        let mut processes = self.processes.write().await;

        let process = processes
            .get_mut(name)
            .ok_or_else(|| PorterError::AppNotFound(name.to_string()))?;

        process.restart()?;
        info!("Restarted app: {}", name);

        Ok(())
    }

    /// Get daemon status
    async fn get_status(&self) -> DaemonStatus {
        let processes = self.processes.read().await;

        let mut app_statuses = Vec::new();
        let mut total_restarts = 0;

        for process in processes.values() {
            let status = process.status();
            total_restarts += status.restart_count;
            app_statuses.push(status);
        }

        // Sort by name
        app_statuses.sort_by(|a, b| a.name.cmp(&b.name));

        DaemonStatus {
            pid: std::process::id(),
            uptime: self.start_time.elapsed(),
            apps: app_statuses,
            total_restarts,
        }
    }

    /// Watch config file for changes
    async fn watch_config_file(
        config_path: PathBuf,
        tx: watch::Sender<()>,
    ) -> Result<()> {
        use notify::{Config as NotifyConfig, Event, RecommendedWatcher, RecursiveMode, Watcher};
        use tokio::sync::mpsc;

        let (event_tx, mut event_rx) = mpsc::channel(100);

        // Create watcher
        let mut watcher = RecommendedWatcher::new(
            move |res: notify::Result<Event>| {
                if let Ok(event) = res {
                    let _ = event_tx.blocking_send(event);
                }
            },
            NotifyConfig::default(),
        )
        .map_err(|e| PorterError::Daemon(format!("Failed to create file watcher: {}", e)))?;

        // Watch config file
        watcher
            .watch(&config_path, RecursiveMode::NonRecursive)
            .map_err(|e| PorterError::Daemon(format!("Failed to watch config file: {}", e)))?;

        info!("Watching config file for changes: {:?}", config_path);

        // Process events
        while let Some(event) = event_rx.recv().await {
            use notify::EventKind;

            match event.kind {
                EventKind::Modify(_) | EventKind::Create(_) => {
                    debug!("Config file modified, notifying daemon");
                    let _ = tx.send(());
                }
                _ => {}
            }
        }

        Ok(())
    }

    /// Reload apps from configuration file
    async fn reload_apps_from_config(&mut self) -> Result<()> {
        info!("Reloading apps from config file");

        let config = Config::load()?;
        let new_registry = AppRegistry::from_configs(config.apps)?;

        // Atomically update registry
        {
            let mut registry = self.registry.write().await;
            *registry = new_registry;
        } // Drop the write lock here

        // Sync running processes with new registry
        self.sync_processes_with_registry().await?;

        info!("Apps reloaded successfully");
        Ok(())
    }

    /// Sync running processes with updated registry
    async fn sync_processes_with_registry(&mut self) -> Result<()> {
        let registry = self.registry.read().await;
        let mut processes = self.processes.write().await;

        // Stop removed apps
        let current_apps: Vec<String> = processes.keys().cloned().collect();
        for app_name in current_apps {
            if !registry.contains(&app_name) {
                info!("App {} removed from config, stopping", app_name);
                if let Some(mut process) = processes.remove(&app_name) {
                    let _ = process.stop();
                }
            }
        }

        // Start new apps
        for app_config in registry.list() {
            if !processes.contains_key(&app_config.name) {
                info!("New app {} found in config, starting", app_config.name);
                match ManagedProcess::new(app_config.clone()) {
                    Ok(mut process) => {
                        if let Err(e) = process.start() {
                            error!("Failed to start new app {}: {}", app_config.name, e);
                        } else {
                            info!("Started app: {}", app_config.name);
                            processes.insert(app_config.name.clone(), process);
                        }
                    }
                    Err(e) => {
                        error!(
                            "Failed to create managed process for {}: {}",
                            app_config.name, e
                        );
                    }
                }
            }
        }

        Ok(())
    }

    /// Start all apps in a group
    async fn start_group(&mut self, group: &str) -> Result<()> {
        info!("Starting apps in group: {}", group);

        // Collect app names first, then drop the lock
        let app_names: Vec<String> = {
            let registry = self.registry.read().await;
            let apps_in_group = registry.apps_in_group(group);

            if apps_in_group.is_empty() {
                return Err(PorterError::InvalidInput(format!(
                    "No apps in group: {}",
                    group
                )));
            }

            apps_in_group.iter().map(|app| app.name.clone()).collect()
        }; // Drop the read lock here

        let mut errors = Vec::new();
        for app_name in app_names {
            if let Err(e) = self.start_app(&app_name).await {
                errors.push(format!("{}: {}", app_name, e));
            }
        }

        if !errors.is_empty() {
            warn!("Some apps failed to start: {:?}", errors);
        }

        Ok(())
    }

    /// Stop all apps in a group
    async fn stop_group(&mut self, group: &str) -> Result<()> {
        info!("Stopping apps in group: {}", group);

        // Collect app names first, then drop the lock
        let app_names: Vec<String> = {
            let registry = self.registry.read().await;
            let apps_in_group = registry.apps_in_group(group);
            apps_in_group.iter().map(|app| app.name.clone()).collect()
        }; // Drop the read lock here

        for app_name in app_names {
            let _ = self.stop_app(&app_name).await;
        }

        Ok(())
    }

    /// Restart all apps in a group
    async fn restart_group(&mut self, group: &str) -> Result<()> {
        info!("Restarting apps in group: {}", group);

        self.stop_group(group).await?;
        tokio::time::sleep(Duration::from_secs(1)).await;
        self.start_group(group).await?;

        Ok(())
    }

    /// Setup signal handlers
    fn setup_signal_handlers(&self) -> Result<()> {
        #[cfg(unix)]
        {
            use tokio::signal::unix::{signal, SignalKind};

            let mut sigterm = signal(SignalKind::terminate())
                .map_err(|e| PorterError::Daemon(format!("Failed to setup SIGTERM handler: {}", e)))?;
            let mut sigint = signal(SignalKind::interrupt())
                .map_err(|e| PorterError::Daemon(format!("Failed to setup SIGINT handler: {}", e)))?;

            let tx = self.control_tx.clone();
            tokio::spawn(async move {
                tokio::select! {
                    _ = sigterm.recv() => {
                        info!("Received SIGTERM, initiating shutdown");
                        let _ = tx.send(DaemonCommand::Shutdown).await;
                    }
                    _ = sigint.recv() => {
                        info!("Received SIGINT, initiating shutdown");
                        let _ = tx.send(DaemonCommand::Shutdown).await;
                    }
                }
            });
        }

        Ok(())
    }

    /// Get control channel sender (for external communication)
    pub fn control_sender(&self) -> mpsc::Sender<DaemonCommand> {
        self.control_tx.clone()
    }
}

/// PID file utilities
pub struct PidFile {
    path: PathBuf,
}

impl PidFile {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    /// Write current process PID to file
    pub fn write(&self) -> Result<()> {
        let pid = std::process::id();

        // Check if PID file already exists
        if self.path.exists() {
            if let Ok(existing_pid) = self.read() {
                if process_exists(existing_pid) {
                    return Err(PorterError::DaemonAlreadyRunning(existing_pid));
                } else {
                    warn!("Removing stale PID file with PID {}", existing_pid);
                }
            }
        }

        // Create parent directory
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        // Write PID atomically
        let temp_path = self.path.with_extension("tmp");
        std::fs::write(&temp_path, pid.to_string())?;
        std::fs::rename(&temp_path, &self.path)?;

        info!("Wrote PID file: {:?} (PID: {})", self.path, pid);
        Ok(())
    }

    /// Read PID from file
    pub fn read(&self) -> Result<u32> {
        let content = std::fs::read_to_string(&self.path)
            .map_err(|e| PorterError::PidFile(format!("Failed to read PID file: {}", e)))?;

        content
            .trim()
            .parse()
            .map_err(|e| PorterError::PidFile(format!("Invalid PID in file: {}", e)))
    }

    /// Remove PID file
    pub fn remove(&self) -> Result<()> {
        if self.path.exists() {
            std::fs::remove_file(&self.path)?;
            info!("Removed PID file: {:?}", self.path);
        }
        Ok(())
    }

    /// Check if daemon is running
    pub fn is_daemon_running(&self) -> bool {
        if let Ok(pid) = self.read() {
            process_exists(pid)
        } else {
            false
        }
    }
}

/// Check if process with given PID exists
#[cfg(unix)]
pub fn process_exists(pid: u32) -> bool {
    use nix::sys::signal::{kill, Signal};
    use nix::unistd::Pid;

    // Sending signal 0 checks if process exists without sending actual signal
    kill(Pid::from_raw(pid as i32), Signal::SIGTERM).is_ok()
}

#[cfg(windows)]
pub fn process_exists(_pid: u32) -> bool {
    // Windows implementation placeholder
    // Would use winapi to check process existence
    false
}

/// Start daemon in background
pub async fn start_daemon(foreground: bool) -> Result<()> {
    let config = Config::load()?;
    let daemon_config = DaemonConfig::default();

    // Check if daemon is already running
    let pid_file = PidFile::new(daemon_config.pid_file.clone());
    if pid_file.is_daemon_running() {
        let pid = pid_file.read()?;
        return Err(PorterError::DaemonAlreadyRunning(pid));
    }

    // Create app registry from config
    let registry = AppRegistry::from_configs(config.apps)?;

    if foreground {
        // Run in foreground
        info!("Starting daemon in foreground mode");
        let daemon = Daemon::new(daemon_config, registry).await?;
        daemon.run().await?;
    } else {
        // Fork and run in background
        #[cfg(unix)]
        {
            use nix::unistd::{fork, setsid, ForkResult};

            match unsafe { fork() } {
                Ok(ForkResult::Parent { child }) => {
                    info!("Daemon started in background with PID: {}", child);
                    return Ok(());
                }
                Ok(ForkResult::Child) => {
                    // Child process - become session leader
                    setsid().map_err(|e| {
                        PorterError::Daemon(format!("Failed to become session leader: {}", e))
                    })?;

                    // Start daemon
                    let daemon = Daemon::new(daemon_config, registry).await?;
                    daemon.run().await?;
                }
                Err(e) => {
                    return Err(PorterError::Daemon(format!("Failed to fork daemon: {}", e)));
                }
            }
        }

        #[cfg(windows)]
        {
            // Windows doesn't have fork, run in current process
            warn!("Background mode not supported on Windows, running in foreground");
            let daemon = Daemon::new(daemon_config, registry).await?;
            daemon.run().await?;
        }
    }

    Ok(())
}

/// Stop running daemon
pub fn stop_daemon() -> Result<()> {
    let daemon_config = DaemonConfig::default();
    let pid_file = PidFile::new(daemon_config.pid_file);

    if !pid_file.is_daemon_running() {
        return Err(PorterError::DaemonNotRunning);
    }

    let pid = pid_file.read()?;
    info!("Stopping daemon with PID: {}", pid);

    #[cfg(unix)]
    {
        use nix::sys::signal::{kill, Signal};
        use nix::unistd::Pid;

        kill(Pid::from_raw(pid as i32), Signal::SIGTERM)
            .map_err(|e| PorterError::Daemon(format!("Failed to send SIGTERM: {}", e)))?;

        info!("Sent SIGTERM to daemon process {}", pid);
    }

    #[cfg(windows)]
    {
        // Windows implementation would use TerminateProcess
        return Err(PorterError::Daemon(
            "Stop daemon not yet implemented on Windows".into(),
        ));
    }

    Ok(())
}

/// Get daemon status
pub async fn daemon_status() -> Result<DaemonStatus> {
    let daemon_config = DaemonConfig::default();
    let pid_file = PidFile::new(daemon_config.pid_file);

    if !pid_file.is_daemon_running() {
        return Err(PorterError::DaemonNotRunning);
    }

    // For now, return basic status from PID file
    // In a full implementation, this would communicate with the daemon via IPC
    let pid = pid_file.read()?;

    Ok(DaemonStatus {
        pid,
        uptime: Duration::from_secs(0), // Would need IPC to get actual uptime
        apps: Vec::new(),                // Would need IPC to get app statuses
        total_restarts: 0,               // Would need IPC to get restart count
    })
}

/// Restart daemon
pub async fn restart_daemon() -> Result<()> {
    info!("Restarting daemon");

    // Stop if running
    if let Ok(()) = stop_daemon() {
        // Wait for daemon to stop
        tokio::time::sleep(Duration::from_secs(2)).await;
    }

    // Start daemon
    start_daemon(false).await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_pid_file_write_read() {
        let temp_dir = tempdir().unwrap();
        let pid_file_path = temp_dir.path().join("test.pid");
        let pid_file = PidFile::new(pid_file_path);

        assert!(pid_file.write().is_ok());
        let pid = pid_file.read().unwrap();
        assert_eq!(pid, std::process::id());

        assert!(pid_file.remove().is_ok());
    }

    #[test]
    fn test_pid_file_duplicate_detection() {
        let temp_dir = tempdir().unwrap();
        let pid_file_path = temp_dir.path().join("test2.pid");
        let pid_file = PidFile::new(pid_file_path);

        // First write should succeed
        assert!(pid_file.write().is_ok());

        // Second write should fail (daemon already running)
        assert!(matches!(
            pid_file.write(),
            Err(PorterError::DaemonAlreadyRunning(_))
        ));

        pid_file.remove().unwrap();
    }

    #[tokio::test]
    async fn test_daemon_creation() {
        let temp_dir = tempdir().unwrap();
        let config = DaemonConfig {
            pid_file: temp_dir.path().join("daemon.pid"),
            auto_restart: true,
            health_check_enabled: true,
        };

        let registry = AppRegistry::new();
        let daemon = Daemon::new(config, registry).await;

        assert!(daemon.is_ok());
    }

    #[test]
    fn test_process_exists() {
        // Test with current process PID
        let current_pid = std::process::id();

        #[cfg(unix)]
        assert!(process_exists(current_pid));

        // Test with invalid PID
        #[cfg(unix)]
        assert!(!process_exists(999999));
    }
}
