/// nginx configuration management for porter
use crate::error::{PorterError, Result};
use log::{debug, info};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Get nginx config directory based on OS
pub fn get_nginx_config_dir() -> Result<PathBuf> {
    // Try to detect nginx installation
    if cfg!(target_os = "macos") {
        // Homebrew nginx on macOS
        let homebrew_path = PathBuf::from("/usr/local/etc/nginx/servers");
        if homebrew_path.exists() {
            return Ok(homebrew_path);
        }

        let homebrew_m1_path = PathBuf::from("/opt/homebrew/etc/nginx/servers");
        if homebrew_m1_path.exists() {
            return Ok(homebrew_m1_path);
        }
    }

    // Linux
    let linux_path = PathBuf::from("/etc/nginx/conf.d");
    if linux_path.exists() {
        return Ok(linux_path);
    }

    Err(PorterError::Config(
        "nginx not found. Install with: brew install nginx (macOS) or apt install nginx (Linux)".into()
    ))
}

/// Generate nginx server block for a subdomain
fn generate_server_block(hostname: &str, port: u16) -> String {
    format!(
        r#"# Porter managed - DO NOT EDIT MANUALLY
server {{
    listen 80;
    server_name {};

    location / {{
        proxy_pass http://127.0.0.1:{};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }}
}}
"#,
        hostname, port
    )
}

/// Add nginx config for a hostname
pub fn add_nginx_config(hostname: &str, port: u16) -> Result<()> {
    let config_dir = get_nginx_config_dir()?;

    // Create config file
    let config_file = config_dir.join(format!("porter-{}.conf", hostname));
    let config_content = generate_server_block(hostname, port);

    fs::write(&config_file, config_content)
        .map_err(|e| PorterError::Config(format!("Failed to write nginx config: {}", e)))?;

    info!("Created nginx config: {:?}", config_file);

    // Reload nginx
    reload_nginx()?;

    Ok(())
}

/// Remove nginx config for a hostname
pub fn remove_nginx_config(hostname: &str) -> Result<()> {
    let config_dir = get_nginx_config_dir()?;
    let config_file = config_dir.join(format!("porter-{}.conf", hostname));

    if config_file.exists() {
        fs::remove_file(&config_file)
            .map_err(|e| PorterError::Config(format!("Failed to remove nginx config: {}", e)))?;

        info!("Removed nginx config: {:?}", config_file);

        // Reload nginx
        reload_nginx()?;
    }

    Ok(())
}

/// Reload nginx configuration
fn reload_nginx() -> Result<()> {
    debug!("Reloading nginx...");

    // Try different reload commands based on OS
    let commands = if cfg!(target_os = "macos") {
        vec![
            vec!["brew", "services", "restart", "nginx"],
            vec!["nginx", "-s", "reload"],
        ]
    } else {
        vec![
            vec!["systemctl", "reload", "nginx"],
            vec!["nginx", "-s", "reload"],
        ]
    };

    for cmd_args in commands {
        let output = Command::new(&cmd_args[0])
            .args(&cmd_args[1..])
            .output();

        if let Ok(result) = output {
            if result.status.success() {
                info!("nginx reloaded successfully");
                return Ok(());
            }
        }
    }

    Err(PorterError::Config(
        "Failed to reload nginx. Run manually: sudo nginx -s reload".into()
    ))
}

/// Check if nginx is installed and running
pub fn check_nginx() -> Result<()> {
    // Check if nginx binary exists
    let nginx_check = Command::new("which")
        .arg("nginx")
        .output();

    if let Ok(result) = nginx_check {
        if !result.status.success() {
            return Err(PorterError::Config(
                "nginx not installed. Install with: brew install nginx".into()
            ));
        }
    }

    // Check if config directory exists
    get_nginx_config_dir()?;

    Ok(())
}

/// Clear all porter-managed nginx configs
pub fn clear_all_configs() -> Result<()> {
    let config_dir = get_nginx_config_dir()?;

    // Find all porter-* files
    if let Ok(entries) = fs::read_dir(&config_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                if filename.starts_with("porter-") && filename.ends_with(".conf") {
                    fs::remove_file(&path)
                        .map_err(|e| PorterError::Config(format!("Failed to remove config: {}", e)))?;
                    info!("Removed config: {:?}", path);
                }
            }
        }
    }

    reload_nginx()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_server_block() {
        let config = generate_server_block("api.example.com", 3000);
        assert!(config.contains("listen 80"));
        assert!(config.contains("server_name api.example.com"));
        assert!(config.contains("proxy_pass http://127.0.0.1:3000"));
    }
}
