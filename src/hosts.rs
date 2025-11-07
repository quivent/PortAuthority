/// Hosts file management for porter CLI
use crate::error::{PorterError, Result};
use log::{debug, info};
use std::fs;
use std::path::PathBuf;

const PORTER_START_MARKER: &str = "# BEGIN PORTER MANAGED";
const PORTER_END_MARKER: &str = "# END PORTER MANAGED";

/// Detect the hosts file path based on the operating system
pub fn get_hosts_path() -> PathBuf {
    if cfg!(target_os = "windows") {
        PathBuf::from(r"C:\Windows\System32\drivers\etc\hosts")
    } else {
        PathBuf::from("/etc/hosts")
    }
}

/// Check if we have write permissions to the hosts file
pub fn check_permissions() -> Result<()> {
    let hosts_path = get_hosts_path();

    // Try to open the file for reading first
    if !hosts_path.exists() {
        return Err(PorterError::HostsFile(format!(
            "Hosts file not found at {:?}",
            hosts_path
        )));
    }

    // Test write permissions by checking file metadata
    let metadata = fs::metadata(&hosts_path)
        .map_err(|e| PorterError::HostsFile(format!("Cannot read hosts file: {}", e)))?;

    if metadata.permissions().readonly() {
        return Err(PorterError::Permission(
            "Hosts file is read-only. Run with sudo/admin privileges".into()
        ));
    }

    Ok(())
}

/// Read the current hosts file content
fn read_hosts_file() -> Result<String> {
    let hosts_path = get_hosts_path();
    fs::read_to_string(&hosts_path)
        .map_err(|e| PorterError::HostsFile(format!("Failed to read hosts file: {}", e)))
}

/// Write content to hosts file with backup
fn write_hosts_file(content: &str) -> Result<()> {
    let hosts_path = get_hosts_path();

    // Create backup
    let backup_path = hosts_path.with_extension("porter.backup");
    if let Ok(original) = fs::read_to_string(&hosts_path) {
        fs::write(&backup_path, original)
            .map_err(|e| PorterError::HostsFile(format!("Failed to create backup: {}", e)))?;
        debug!("Created backup at {:?}", backup_path);
    }

    // Write new content
    fs::write(&hosts_path, content)
        .map_err(|e| PorterError::HostsFile(format!("Failed to write hosts file: {}", e)))?;

    info!("Updated hosts file at {:?}", hosts_path);
    Ok(())
}

/// Add an entry to the hosts file with automatic sudo escalation
pub fn add_entry(hostname: &str, port: u16) -> Result<()> {
    match add_entry_internal(hostname, port) {
        Ok(_) => Ok(()),
        Err(PorterError::Permission(_)) => {
            // Permission denied - try with sudo
            escalate_and_modify(hostname, Some(port), HostsOperation::Add)
        }
        Err(e) => Err(e),
    }
}

fn add_entry_internal(hostname: &str, port: u16) -> Result<()> {
    check_permissions()?;

    let content = read_hosts_file()?;
    let new_content = add_porter_entry(&content, hostname, port)?;

    write_hosts_file(&new_content)?;
    info!("Added hosts entry: {} -> 127.0.0.1:{}", hostname, port);
    Ok(())
}

/// Remove an entry from the hosts file with automatic sudo escalation
pub fn remove_entry(hostname: &str) -> Result<()> {
    match remove_entry_internal(hostname) {
        Ok(_) => Ok(()),
        Err(PorterError::Permission(_)) => {
            // Permission denied - try with sudo
            escalate_and_modify(hostname, None, HostsOperation::Remove)
        }
        Err(e) => Err(e),
    }
}

fn remove_entry_internal(hostname: &str) -> Result<()> {
    check_permissions()?;

    let content = read_hosts_file()?;
    let new_content = remove_porter_entry(&content, hostname)?;

    write_hosts_file(&new_content)?;
    info!("Removed hosts entry: {}", hostname);
    Ok(())
}

#[derive(Debug)]
enum HostsOperation {
    Add,
    Remove,
}

/// Escalate privileges and modify hosts file
fn escalate_and_modify(hostname: &str, port: Option<u16>, operation: HostsOperation) -> Result<()> {
    use colored::Colorize;

    println!("\n{} {}",
        "🔐".yellow(),
        "Administrator access required to modify hosts file".yellow().bold()
    );

    // On macOS/Linux, we can use sudo directly
    if cfg!(target_os = "macos") || cfg!(target_os = "linux") {
        use std::process::Command;

        let hosts_path = get_hosts_path();
        let content = read_hosts_file()?;

        let new_content = match operation {
            HostsOperation::Add => {
                let port_num = port.ok_or_else(|| PorterError::HostsFile("Port required for add operation".into()))?;
                add_porter_entry(&content, hostname, port_num)?
            }
            HostsOperation::Remove => {
                remove_porter_entry(&content, hostname)?
            }
        };

        // Create a temporary file with the new content
        let temp_path = std::env::temp_dir().join("porter_hosts_temp");
        fs::write(&temp_path, &new_content)
            .map_err(|e| PorterError::HostsFile(format!("Failed to write temp file: {}", e)))?;

        println!("{} Requesting sudo access...", "→".cyan());

        // Use sudo to copy the temp file to the hosts file
        let status = Command::new("sudo")
            .arg("cp")
            .arg(&temp_path)
            .arg(&hosts_path)
            .status()
            .map_err(|e| PorterError::HostsFile(format!("Failed to execute sudo: {}", e)))?;

        // Clean up temp file
        let _ = fs::remove_file(&temp_path);

        if status.success() {
            println!("{} {}", "✓".green(), "Hosts file updated successfully".green());
            Ok(())
        } else {
            Err(PorterError::Permission("Sudo access denied or failed".into()))
        }
    } else {
        // Windows - needs different approach
        Err(PorterError::Permission(
            "Administrator access required. Please run as administrator.".into()
        ))
    }
}

/// Update all entries in the hosts file based on current mappings
pub fn sync_entries(entries: &[(String, u16)]) -> Result<()> {
    check_permissions()?;

    let content = read_hosts_file()?;
    let new_content = sync_porter_entries(&content, entries)?;

    write_hosts_file(&new_content)?;
    info!("Synced {} hosts entries", entries.len());
    Ok(())
}

/// Clear all porter-managed entries from hosts file
pub fn clear_entries() -> Result<()> {
    check_permissions()?;

    let content = read_hosts_file()?;
    let new_content = remove_porter_section(&content);

    write_hosts_file(&new_content)?;
    info!("Cleared all porter entries from hosts file");
    Ok(())
}

/// Add a porter entry to the hosts file content
fn add_porter_entry(content: &str, hostname: &str, port: u16) -> Result<String> {
    let entry_line = format!("127.0.0.1    {}    # porter:port={}", hostname, port);

    // Check if porter section exists
    if content.contains(PORTER_START_MARKER) {
        // Replace or add within existing section
        let lines: Vec<&str> = content.lines().collect();
        let mut new_lines = Vec::new();
        let mut in_porter_section = false;
        let mut entry_exists = false;

        for line in lines {
            if line.contains(PORTER_START_MARKER) {
                in_porter_section = true;
                new_lines.push(line.to_string());
            } else if line.contains(PORTER_END_MARKER) {
                if !entry_exists {
                    new_lines.push(entry_line.clone());
                }
                new_lines.push(line.to_string());
                in_porter_section = false;
            } else if in_porter_section && line.contains(&format!("{}    #", hostname)) {
                // Replace existing entry
                new_lines.push(entry_line.clone());
                entry_exists = true;
            } else {
                new_lines.push(line.to_string());
            }
        }

        Ok(new_lines.join("\n"))
    } else {
        // Create new porter section
        Ok(format!(
            "{}\n\n{}\n{}\n{}\n",
            content.trim_end(),
            PORTER_START_MARKER,
            entry_line,
            PORTER_END_MARKER
        ))
    }
}

/// Remove a porter entry from the hosts file content
fn remove_porter_entry(content: &str, hostname: &str) -> Result<String> {
    let lines: Vec<&str> = content.lines().collect();
    let mut new_lines = Vec::new();
    let mut in_porter_section = false;

    for line in lines {
        if line.contains(PORTER_START_MARKER) {
            in_porter_section = true;
            new_lines.push(line.to_string());
        } else if line.contains(PORTER_END_MARKER) {
            new_lines.push(line.to_string());
            in_porter_section = false;
        } else if in_porter_section && line.contains(&format!("{}    #", hostname)) {
            // Skip this line (remove it)
            continue;
        } else {
            new_lines.push(line.to_string());
        }
    }

    Ok(new_lines.join("\n"))
}

/// Sync all porter entries in the hosts file
fn sync_porter_entries(content: &str, entries: &[(String, u16)]) -> Result<String> {
    // Remove existing porter section
    let without_porter = remove_porter_section(content);

    // Build new porter section
    let mut porter_section = vec![PORTER_START_MARKER.to_string()];
    for (hostname, port) in entries {
        porter_section.push(format!("127.0.0.1    {}    # porter:port={}", hostname, port));
    }
    porter_section.push(PORTER_END_MARKER.to_string());

    // Add porter section
    Ok(format!(
        "{}\n\n{}\n",
        without_porter.trim_end(),
        porter_section.join("\n")
    ))
}

/// Remove the entire porter section from hosts file content
fn remove_porter_section(content: &str) -> String {
    let lines: Vec<&str> = content.lines().collect();
    let mut new_lines = Vec::new();
    let mut in_porter_section = false;

    for line in lines {
        if line.contains(PORTER_START_MARKER) {
            in_porter_section = true;
        } else if line.contains(PORTER_END_MARKER) {
            in_porter_section = false;
        } else if !in_porter_section {
            new_lines.push(line);
        }
    }

    // Remove trailing empty lines left by section removal
    while new_lines.last() == Some(&"") {
        new_lines.pop();
    }

    new_lines.join("\n")
}

/// Get platform-specific permission guidance
pub fn get_permission_guidance() -> String {
    if cfg!(target_os = "windows") {
        "Run your terminal as Administrator to modify the hosts file.".into()
    } else {
        "Run with sudo to modify the hosts file:\n  sudo porter <command>".into()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_porter_entry_new_section() {
        let content = "127.0.0.1    localhost\n";
        let result = add_porter_entry(content, "api.localhost", 3000).unwrap();

        assert!(result.contains(PORTER_START_MARKER));
        assert!(result.contains(PORTER_END_MARKER));
        assert!(result.contains("api.localhost"));
        assert!(result.contains("porter:port=3000"));
    }

    #[test]
    fn test_add_porter_entry_existing_section() {
        let content = format!(
            "127.0.0.1    localhost\n\n{}\n127.0.0.1    old.localhost    # porter:port=8080\n{}\n",
            PORTER_START_MARKER, PORTER_END_MARKER
        );

        let result = add_porter_entry(&content, "api.localhost", 3000).unwrap();
        assert!(result.contains("api.localhost"));
        assert!(result.contains("old.localhost"));
    }

    #[test]
    fn test_remove_porter_entry() {
        let content = format!(
            "{}\n127.0.0.1    api.localhost    # porter:port=3000\n{}\n",
            PORTER_START_MARKER, PORTER_END_MARKER
        );

        let result = remove_porter_entry(&content, "api.localhost").unwrap();
        assert!(!result.contains("api.localhost"));
        assert!(result.contains(PORTER_START_MARKER));
    }

    #[test]
    fn test_remove_porter_section() {
        let content = format!(
            "127.0.0.1    localhost\n\n{}\n127.0.0.1    api.localhost    # porter:port=3000\n{}\n",
            PORTER_START_MARKER, PORTER_END_MARKER
        );

        let result = remove_porter_section(&content);
        assert!(!result.contains(PORTER_START_MARKER));
        assert!(!result.contains("api.localhost"));
        assert!(result.contains("localhost"));
    }

    #[test]
    fn test_sync_porter_entries() {
        let content = "127.0.0.1    localhost\n";
        let entries = vec![
            ("api.localhost".to_string(), 3000),
            ("web.localhost".to_string(), 8080),
        ];

        let result = sync_porter_entries(&content, &entries).unwrap();
        assert!(result.contains("api.localhost"));
        assert!(result.contains("web.localhost"));
        assert!(result.contains("porter:port=3000"));
        assert!(result.contains("porter:port=8080"));
    }
}
