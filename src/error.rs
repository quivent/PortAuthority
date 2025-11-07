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
