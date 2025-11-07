/// Browser integration for porter CLI
use crate::error::{PorterError, Result};
use log::info;
use std::process::Command;

/// Open a URL in the default browser
pub fn open_url(url: &str) -> Result<()> {
    info!("Opening URL: {}", url);

    let command = get_open_command();

    Command::new(command)
        .arg(url)
        .spawn()
        .map_err(|e| PorterError::Browser(format!("Failed to open browser: {}", e)))?;

    Ok(())
}

/// Build a full URL from hostname and port
pub fn build_url(hostname: &str, port: u16) -> String {
    format!("http://{}:{}", hostname, port)
}

/// Get the platform-specific command to open URLs
fn get_open_command() -> &'static str {
    if cfg!(target_os = "macos") {
        "open"
    } else if cfg!(target_os = "windows") {
        "start"
    } else {
        // Linux and other Unix-like systems
        "xdg-open"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_url() {
        assert_eq!(
            build_url("api.localhost", 3000),
            "http://api.localhost:3000"
        );
        assert_eq!(
            build_url("web.example.com", 8080),
            "http://web.example.com:8080"
        );
    }

    #[test]
    fn test_get_open_command() {
        let cmd = get_open_command();
        assert!(!cmd.is_empty());
    }
}
