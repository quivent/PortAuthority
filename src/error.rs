/// Custom error types for porter CLI
use thiserror::Error;

#[derive(Error, Debug)]
pub enum PorterError {
    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Hosts file error: {0}")]
    HostsFile(String),

    #[error("Permission denied: {0}")]
    Permission(String),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Mapping not found: {0}")]
    MappingNotFound(String),

    #[error("Browser error: {0}")]
    Browser(String),

    #[error("Proxy error: {0}")]
    Proxy(String),

    // Daemon-related errors
    #[error("Daemon error: {0}")]
    Daemon(String),

    #[error("Daemon already running (PID: {0})")]
    DaemonAlreadyRunning(u32),

    #[error("Daemon not running")]
    DaemonNotRunning,

    #[error("PID file error: {0}")]
    PidFile(String),

    // Process-related errors
    #[error("Process error: {0}")]
    Process(String),

    #[error("Process spawn failed: {0}")]
    ProcessSpawnFailed(String),

    #[error("Health check failed: {0}")]
    HealthCheckFailed(String),

    #[error("Restart limit reached for app: {0}")]
    RestartLimitReached(String),

    // App registry errors
    #[error("App registry error: {0}")]
    AppRegistry(String),

    #[error("App not found: {0}")]
    AppNotFound(String),

    #[error("Duplicate app name: {0}")]
    DuplicateApp(String),

    #[error("Invalid app configuration: {0}")]
    InvalidAppConfig(String),

    #[error("Port already in use: {0}")]
    PortInUse(u16),

    // Standard error conversions
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("TOML serialization error: {0}")]
    TomlSer(#[from] toml::ser::Error),

    #[error("TOML deserialization error: {0}")]
    TomlDe(#[from] toml::de::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
}

pub type Result<T> = std::result::Result<T, PorterError>;
