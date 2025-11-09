/// Systemd integration for port-authority daemon
use crate::config::Config;
use crate::error::{PorterError, Result};
use std::fs;
use std::path::PathBuf;
use std::process::Command;

/// Get systemd unit file path for user service
pub fn user_service_path() -> Result<PathBuf> {
    let home = dirs::home_dir()
        .ok_or_else(|| PorterError::Config("Could not determine home directory".into()))?;
    Ok(home.join(".config/systemd/user/port-authority.service"))
}

/// Get systemd unit file path for system service
pub fn system_service_path() -> PathBuf {
    PathBuf::from("/etc/systemd/system/port-authority.service")
}

/// Generate systemd service file content
pub fn generate_service_file(user_mode: bool) -> Result<String> {
    let exe_path = std::env::current_exe().map_err(|e| {
        PorterError::Config(format!("Failed to get executable path: {}", e))
    })?;

    let exe_path_str = exe_path
        .to_str()
        .ok_or_else(|| PorterError::Config("Invalid executable path".into()))?;

    let user = std::env::var("USER").unwrap_or_else(|_| "porter".to_string());

    let config_dir = Config::config_dir()?;
    let config_dir_str = config_dir
        .to_str()
        .ok_or_else(|| PorterError::Config("Invalid config directory path".into()))?;

    let content = if user_mode {
        format!(
            r#"[Unit]
Description=Port Authority Daemon (User Service)
After=network.target

[Service]
Type=forking
ExecStart={} daemon start
ExecStop={} daemon stop
ExecReload={} daemon restart
Restart=on-failure
RestartSec=10s
Environment="HOME={}"
WorkingDirectory={}

[Install]
WantedBy=default.target
"#,
            exe_path_str,
            exe_path_str,
            exe_path_str,
            std::env::var("HOME").unwrap_or_default(),
            config_dir_str
        )
    } else {
        format!(
            r#"[Unit]
Description=Port Authority Daemon (System Service)
After=network.target

[Service]
Type=forking
User={}
Group={}
ExecStart={} daemon start
ExecStop={} daemon stop
ExecReload={} daemon restart
Restart=on-failure
RestartSec=10s
WorkingDirectory={}

[Install]
WantedBy=multi-user.target
"#,
            user, user, exe_path_str, exe_path_str, exe_path_str, config_dir_str
        )
    };

    Ok(content)
}

/// Install systemd service
pub fn install_service(user_mode: bool) -> Result<()> {
    let service_content = generate_service_file(user_mode)?;
    let service_path = if user_mode {
        user_service_path()?
    } else {
        system_service_path()
    };

    // Create parent directory
    if let Some(parent) = service_path.parent() {
        fs::create_dir_all(parent)?;
    }

    // Write service file
    fs::write(&service_path, service_content)?;

    // Reload systemd
    let systemctl = if user_mode {
        "systemctl --user"
    } else {
        "systemctl"
    };
    let reload_cmd = format!("{} daemon-reload", systemctl);

    Command::new("sh")
        .arg("-c")
        .arg(&reload_cmd)
        .status()
        .map_err(|e| PorterError::Daemon(format!("Failed to reload systemd: {}", e)))?;

    println!("✅ Systemd service installed at: {}", service_path.display());
    println!("\nTo enable auto-start on boot:");
    println!("  {} enable port-authority", systemctl);
    println!("\nTo start now:");
    println!("  {} start port-authority", systemctl);
    println!("\nTo check status:");
    println!("  {} status port-authority", systemctl);

    Ok(())
}

/// Uninstall systemd service
pub fn uninstall_service(user_mode: bool) -> Result<()> {
    let service_path = if user_mode {
        user_service_path()?
    } else {
        system_service_path()
    };

    if !service_path.exists() {
        return Err(PorterError::Config("Service not installed".into()));
    }

    // Stop and disable service first
    let systemctl = if user_mode {
        "systemctl --user"
    } else {
        "systemctl"
    };
    let _ = Command::new("sh")
        .arg("-c")
        .arg(format!("{} stop port-authority", systemctl))
        .status();
    let _ = Command::new("sh")
        .arg("-c")
        .arg(format!("{} disable port-authority", systemctl))
        .status();

    // Remove service file
    fs::remove_file(&service_path)?;

    // Reload systemd
    Command::new("sh")
        .arg("-c")
        .arg(format!("{} daemon-reload", systemctl))
        .status()
        .map_err(|e| PorterError::Daemon(format!("Failed to reload systemd: {}", e)))?;

    println!("✅ Systemd service uninstalled");
    Ok(())
}

/// Check service status
pub fn service_status(user_mode: bool) -> Result<String> {
    let systemctl = if user_mode {
        "systemctl --user"
    } else {
        "systemctl"
    };
    let output = Command::new("sh")
        .arg("-c")
        .arg(format!("{} status port-authority", systemctl))
        .output()
        .map_err(|e| PorterError::Daemon(format!("Failed to check status: {}", e)))?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

/// Enable service to start on boot
pub fn enable_service(user_mode: bool) -> Result<()> {
    let systemctl = if user_mode {
        "systemctl --user"
    } else {
        "systemctl"
    };

    Command::new("sh")
        .arg("-c")
        .arg(format!("{} enable port-authority", systemctl))
        .status()
        .map_err(|e| PorterError::Daemon(format!("Failed to enable service: {}", e)))?;

    println!("✅ Service enabled to start on boot");
    Ok(())
}

/// Disable service from starting on boot
pub fn disable_service(user_mode: bool) -> Result<()> {
    let systemctl = if user_mode {
        "systemctl --user"
    } else {
        "systemctl"
    };

    Command::new("sh")
        .arg("-c")
        .arg(format!("{} disable port-authority", systemctl))
        .status()
        .map_err(|e| PorterError::Daemon(format!("Failed to disable service: {}", e)))?;

    println!("✅ Service disabled from starting on boot");
    Ok(())
}
