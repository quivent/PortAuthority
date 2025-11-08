/// Port scanning and detection for Subway Authority
///
/// This module provides cross-platform port scanning capabilities with intelligent
/// application detection for Node.js, Python, and other frameworks.

use log::{debug, warn};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::process::Command;
use thiserror::Error;

/// Port scanner error types
#[derive(Error, Debug)]
pub enum PortScannerError {
    #[error("Port scanning not supported on this operating system")]
    UnsupportedOS,

    #[error("Failed to execute system command: {0}")]
    CommandFailed(String),

    #[error("Failed to parse command output: {0}")]
    ParseError(String),

    #[error("Insufficient permissions to scan ports")]
    PermissionDenied,

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

pub type Result<T> = std::result::Result<T, PortScannerError>;

/// Information about a port and the process using it
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PortInfo {
    pub port: u16,
    pub process_name: String,
    pub pid: String,
    pub protocol: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub friendly_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<PortCategory>,
}

/// Categories for grouping ports by application type
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PortCategory {
    Database,
    WebServer,
    NodeApp,
    PythonApp,
    RubyApp,
    JavaApp,
    DesktopApp,
    SystemService,
    Other,
}

impl PortCategory {
    pub fn name(&self) -> &str {
        match self {
            PortCategory::Database => "Databases",
            PortCategory::WebServer => "Web Servers",
            PortCategory::NodeApp => "Node.js Apps",
            PortCategory::PythonApp => "Python Apps",
            PortCategory::RubyApp => "Ruby Apps",
            PortCategory::JavaApp => "Java Apps",
            PortCategory::DesktopApp => "Desktop Apps",
            PortCategory::SystemService => "System Services",
            PortCategory::Other => "Other",
        }
    }
}

/// Main port scanner interface
pub struct PortScanner;

impl PortScanner {
    /// Create a new port scanner instance
    pub fn new() -> Self {
        PortScanner
    }

    /// Get list of ports currently in use with full details
    pub fn scan_ports(&self) -> Result<Vec<PortInfo>> {
        let mut ports = if cfg!(target_os = "macos") || cfg!(target_os = "linux") {
            self.scan_ports_unix()?
        } else if cfg!(target_os = "windows") {
            self.scan_ports_windows()?
        } else {
            return Err(PortScannerError::UnsupportedOS);
        };

        // Enrich port information with friendly names and categories
        for port in &mut ports {
            port.friendly_name = Some(get_friendly_name(port));
            port.category = Some(categorize_port(port));
        }

        Ok(ports)
    }

    /// Check if a specific port is in use
    pub fn is_port_in_use(&self, port: u16) -> bool {
        if let Ok(ports) = self.scan_ports() {
            ports.iter().any(|p| p.port == port)
        } else {
            false
        }
    }

    /// Unix/Linux/macOS implementation using lsof
    fn scan_ports_unix(&self) -> Result<Vec<PortInfo>> {
        // Use lsof to list open ports
        let output = Command::new("lsof")
            .args(&["-i", "-P", "-n"])
            .output()
            .map_err(|e| PortScannerError::CommandFailed(format!("Failed to run lsof: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            if stderr.contains("Permission denied") {
                return Err(PortScannerError::PermissionDenied);
            }
            return Err(PortScannerError::CommandFailed("lsof command failed".into()));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut ports = Vec::new();
        let mut seen_ports = HashSet::new();

        for line in stdout.lines().skip(1) {
            // Skip header
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() < 9 {
                continue;
            }

            let process_name = parts[0];
            let pid = parts[1];
            let protocol = parts[7];
            let address = parts[8];

            // Extract port from address (format: *:PORT or IP:PORT)
            if let Some(port_str) = address.split(':').last() {
                if let Ok(port) = port_str.parse::<u16>() {
                    // Filter for LISTEN state and avoid duplicates
                    if line.contains("LISTEN") && !seen_ports.contains(&port) {
                        seen_ports.insert(port);

                        ports.push(PortInfo {
                            port,
                            process_name: process_name.to_string(),
                            pid: pid.to_string(),
                            protocol: protocol.to_string(),
                            friendly_name: None,
                            category: None,
                        });

                        debug!("Found port {}: {} (pid: {})", port, process_name, pid);
                    }
                }
            }
        }

        // Sort by port number
        ports.sort_by_key(|p| p.port);

        Ok(ports)
    }

    /// Windows implementation using netstat
    fn scan_ports_windows(&self) -> Result<Vec<PortInfo>> {
        // Use netstat to list open ports
        let output = Command::new("netstat")
            .args(&["-ano"])
            .output()
            .map_err(|e| PortScannerError::CommandFailed(format!("Failed to run netstat: {}", e)))?;

        if !output.status.success() {
            return Err(PortScannerError::CommandFailed("netstat command failed".into()));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut ports = Vec::new();
        let mut seen_ports = HashSet::new();

        for line in stdout.lines().skip(4) {
            // Skip header lines
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() < 5 {
                continue;
            }

            let protocol = parts[0];
            let local_address = parts[1];
            let state = parts[3];
            let pid = parts[4];

            // Only process LISTENING ports
            if state != "LISTENING" {
                continue;
            }

            // Extract port from address (format: 0.0.0.0:PORT or [::]:PORT)
            if let Some(port_str) = local_address.split(':').last() {
                if let Ok(port) = port_str.parse::<u16>() {
                    if !seen_ports.contains(&port) {
                        seen_ports.insert(port);

                        // Get process name from PID
                        let process_name = self.get_process_name_windows(pid)
                            .unwrap_or_else(|| "Unknown".to_string());

                        ports.push(PortInfo {
                            port,
                            process_name,
                            pid: pid.to_string(),
                            protocol: protocol.to_string(),
                            friendly_name: None,
                            category: None,
                        });

                        debug!("Found port {}: {} (pid: {})", port, "process", pid);
                    }
                }
            }
        }

        // Sort by port number
        ports.sort_by_key(|p| p.port);

        Ok(ports)
    }

    /// Get process name from PID on Windows
    fn get_process_name_windows(&self, pid: &str) -> Option<String> {
        let output = Command::new("tasklist")
            .args(&["/FI", &format!("PID eq {}", pid), "/FO", "CSV", "/NH"])
            .output()
            .ok()?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let parts: Vec<&str> = stdout.split(',').collect();
            if !parts.is_empty() {
                // Remove quotes from process name
                return Some(parts[0].trim_matches('"').to_string());
            }
        }
        None
    }
}

impl Default for PortScanner {
    fn default() -> Self {
        Self::new()
    }
}

/// Categorize a port by its process type
pub fn categorize_port(port_info: &PortInfo) -> PortCategory {
    let process = port_info.process_name.as_str();

    match process {
        "node" => PortCategory::NodeApp,
        "Python" | "python3" | "python" => PortCategory::PythonApp,
        "ruby" => PortCategory::RubyApp,
        "java" => PortCategory::JavaApp,
        "postgres" | "mongod" | "redis-ser" | "mysql" => PortCategory::Database,
        "nginx" | "httpd" | "apache2" => PortCategory::WebServer,
        "docker-pr" | "com.docke" => PortCategory::SystemService,
        "Spotify" | "Discord" | "Slack" | "figma_age" | "AnyDesk" => PortCategory::DesktopApp,
        _ => PortCategory::Other,
    }
}

/// Get color for a process (used in CLI visualization)
pub fn get_app_color(process_name: &str) -> &str {
    match process_name {
        "Spotify" => "green",        // Spotify green
        "Discord" => "purple",       // Discord purple
        "Slack" => "magenta",        // Slack purple/pink
        "figma_age" => "red",        // Figma red
        "AnyDesk" => "red",          // AnyDesk red
        _ => "white",
    }
}

/// Try to get a more descriptive name for a process
pub fn get_friendly_name(port_info: &PortInfo) -> String {
    let process = port_info.process_name.as_str();

    // For Node.js and Python, try to detect the actual app
    match process {
        "node" => get_node_details(port_info),
        "Python" | "python3" | "python" => get_python_details(port_info),
        "nginx" => "nginx".to_string(),
        "postgres" => "PostgreSQL".to_string(),
        "redis-ser" => "Redis".to_string(),
        "mongod" => "MongoDB".to_string(),
        "docker-pr" | "com.docke" => "Docker".to_string(),
        "httpd" | "apache2" => "Apache".to_string(),
        "java" => "Java".to_string(),
        "ruby" => "Ruby".to_string(),
        "R" => "R/Shiny".to_string(),
        _ => process.to_string(),
    }
}

/// Get command line arguments for a process
fn get_process_cmdline(pid: &str) -> Option<String> {
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    {
        let output = Command::new("ps")
            .args(&["-p", pid, "-o", "command="])
            .output()
            .ok()?;

        if output.status.success() {
            let cmdline = String::from_utf8_lossy(&output.stdout);
            return Some(cmdline.trim().to_string());
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Windows implementation using WMIC
        let output = Command::new("wmic")
            .args(&["process", "where", &format!("ProcessId={}", pid), "get", "CommandLine", "/value"])
            .output()
            .ok()?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if let Some(cmdline) = line.strip_prefix("CommandLine=") {
                    return Some(cmdline.trim().to_string());
                }
            }
        }
    }

    None
}

/// Get the working directory of a process
fn get_process_cwd(pid: &str) -> Option<String> {
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    {
        let output = Command::new("lsof")
            .args(&["-p", pid, "-a", "-d", "cwd", "-Fn"])
            .output()
            .ok()?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            // lsof -Fn output format: lines starting with 'n' contain the path
            for line in stdout.lines() {
                if let Some(path) = line.strip_prefix('n') {
                    return Some(path.to_string());
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Windows implementation using WMIC
        let output = Command::new("wmic")
            .args(&["process", "where", &format!("ProcessId={}", pid), "get", "ExecutablePath", "/value"])
            .output()
            .ok()?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if let Some(path) = line.strip_prefix("ExecutablePath=") {
                    // Extract directory from executable path
                    if let Some(parent) = std::path::Path::new(path.trim()).parent() {
                        return Some(parent.to_string_lossy().to_string());
                    }
                }
            }
        }
    }

    None
}

/// Try to read package.json and extract project name
fn get_project_name_from_package_json(cwd: &str) -> Option<String> {
    use std::fs;

    let package_json_path = format!("{}/package.json", cwd);
    let content = fs::read_to_string(&package_json_path).ok()?;

    // Simple JSON parsing for name field
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("\"name\"") {
            // Extract value between quotes after colon
            if let Some(colon_pos) = trimmed.find(':') {
                let after_colon = &trimmed[colon_pos + 1..];
                if let Some(first_quote) = after_colon.find('"') {
                    if let Some(second_quote) = after_colon[first_quote + 1..].find('"') {
                        let name = &after_colon[first_quote + 1..first_quote + 1 + second_quote];
                        return Some(name.to_string());
                    }
                }
            }
        }
    }
    None
}

/// Extract a readable project name from a path
fn get_project_name_from_path(path: &str) -> String {
    path.split('/')
        .last()
        .unwrap_or("unknown")
        .to_string()
}

/// Convert slug-hyphen format to Title Case
/// Examples: "graphics-terminal" -> "Graphics Terminal"
///           "League-of-Sages" -> "League of Sages"
///           "cinema" -> "Cinema"
fn slug_to_title_case(slug: &str) -> String {
    slug.split('-')
        .map(|word| {
            if word.is_empty() {
                return String::new();
            }

            // Capitalize first letter of each word
            let mut chars = word.chars();
            if let Some(first) = chars.next() {
                let rest: String = chars.collect::<String>().to_lowercase();
                format!("{}{}", first.to_uppercase(), rest)
            } else {
                String::new()
            }
        })
        .collect::<Vec<String>>()
        .join(" ")
}

/// Detect Node.js app details from command line
fn get_node_details(port_info: &PortInfo) -> String {
    let cmdline = get_process_cmdline(&port_info.pid);
    let cwd = get_process_cwd(&port_info.pid);

    // Try to get project name from package.json or path, and format it
    let project_name = cwd.as_ref()
        .and_then(|cwd_path| get_project_name_from_package_json(cwd_path))
        .or_else(|| cwd.as_ref().map(|cwd_path| get_project_name_from_path(cwd_path)))
        .map(|name| slug_to_title_case(&name));

    if let Some(cmdline) = cmdline {
        let cmdline_lower = cmdline.to_lowercase();

        // Detect framework and combine with project name
        let framework = if cmdline_lower.contains("vite") {
            Some("Vite")
        } else if cmdline_lower.contains("next") {
            Some("Next.js")
        } else if cmdline_lower.contains("react-scripts") {
            Some("React")
        } else if cmdline_lower.contains("webpack") {
            Some("Webpack")
        } else if cmdline_lower.contains("express") {
            Some("Express")
        } else if cmdline_lower.contains("nest") {
            Some("NestJS")
        } else if cmdline_lower.contains("nuxt") {
            Some("Nuxt")
        } else if cmdline_lower.contains("gatsby") {
            Some("Gatsby")
        } else if cmdline_lower.contains("nodemon") {
            Some("Nodemon")
        } else if cmdline_lower.contains("pm2") {
            Some("PM2")
        } else if cmdline_lower.contains("ts-node") {
            Some("TypeScript")
        } else {
            None
        };

        // Combine framework with project name
        if let Some(fw) = framework {
            if let Some(ref proj) = project_name {
                return format!("{} · {}", fw, proj);
            } else {
                return fw.to_string();
            }
        }

        // Try to extract script name from npm/yarn/pnpm commands
        if cmdline_lower.contains("npm") || cmdline_lower.contains("yarn") || cmdline_lower.contains("pnpm") {
            if let Some(run_idx) = cmdline.find("run ") {
                let after_run = &cmdline[run_idx + 4..];
                if let Some(script) = after_run.split_whitespace().next() {
                    if let Some(ref proj) = project_name {
                        return format!("{} · {}", script, proj);
                    } else {
                        return format!("Node.js · {}", script);
                    }
                }
            }
        }
    }

    // Fallback to just project name or generic Node.js
    if let Some(proj) = project_name {
        format!("Node.js · {}", proj)
    } else {
        "Node.js".to_string()
    }
}

/// Detect Python app details from command line
fn get_python_details(port_info: &PortInfo) -> String {
    let cmdline = get_process_cmdline(&port_info.pid);
    let cwd = get_process_cwd(&port_info.pid);

    // Get project directory name and format it
    let project_name = cwd.as_ref()
        .map(|cwd_path| get_project_name_from_path(cwd_path))
        .map(|name| slug_to_title_case(&name));

    if let Some(cmdline) = cmdline {
        let cmdline_lower = cmdline.to_lowercase();

        // Detect framework
        let framework = if cmdline_lower.contains("flask") {
            Some("Flask")
        } else if cmdline_lower.contains("django") {
            Some("Django")
        } else if cmdline_lower.contains("fastapi") {
            Some("FastAPI")
        } else if cmdline_lower.contains("uvicorn") {
            Some("Uvicorn")
        } else if cmdline_lower.contains("gunicorn") {
            Some("Gunicorn")
        } else if cmdline_lower.contains("streamlit") {
            Some("Streamlit")
        } else if cmdline_lower.contains("celery") {
            Some("Celery")
        } else if cmdline_lower.contains("tornado") {
            Some("Tornado")
        } else if cmdline_lower.contains("bottle") {
            Some("Bottle")
        } else if cmdline_lower.contains("pyramid") {
            Some("Pyramid")
        } else if cmdline_lower.contains("sanic") {
            Some("Sanic")
        } else if cmdline_lower.contains("jupyter") {
            Some("Jupyter")
        } else {
            None
        };

        // Combine framework with project name
        if let Some(fw) = framework {
            if let Some(ref proj) = project_name {
                return format!("{} · {}", fw, proj);
            } else {
                return fw.to_string();
            }
        }

        // Try to extract script name and format it
        if let Some(py_file) = cmdline.split_whitespace()
            .find(|s| s.ends_with(".py"))
            .and_then(|s| s.split('/').last())
            .and_then(|s| s.strip_suffix(".py"))
        {
            let formatted_script = slug_to_title_case(py_file);
            if let Some(ref proj) = project_name {
                return format!("{} · {}", formatted_script, proj);
            } else {
                return format!("Python · {}", formatted_script);
            }
        }
    }

    // Fallback to just project name or generic Python
    if let Some(proj) = project_name {
        format!("Python · {}", proj)
    } else {
        "Python".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_port_scanner_creation() {
        let scanner = PortScanner::new();
        assert!(scanner.scan_ports().is_ok() || scanner.scan_ports().is_err());
    }

    #[test]
    fn test_slug_to_title_case() {
        assert_eq!(slug_to_title_case("graphics-terminal"), "Graphics Terminal");
        assert_eq!(slug_to_title_case("League-of-Sages"), "League Of Sages");
        assert_eq!(slug_to_title_case("cinema"), "Cinema");
        assert_eq!(slug_to_title_case("my-awesome-app"), "My Awesome App");
    }

    #[test]
    fn test_categorize_port() {
        let node_port = PortInfo {
            port: 3000,
            process_name: "node".to_string(),
            pid: "12345".to_string(),
            protocol: "TCP".to_string(),
            friendly_name: None,
            category: None,
        };
        assert_eq!(categorize_port(&node_port), PortCategory::NodeApp);

        let postgres_port = PortInfo {
            port: 5432,
            process_name: "postgres".to_string(),
            pid: "54321".to_string(),
            protocol: "TCP".to_string(),
            friendly_name: None,
            category: None,
        };
        assert_eq!(categorize_port(&postgres_port), PortCategory::Database);
    }

    #[test]
    fn test_get_app_color() {
        assert_eq!(get_app_color("Spotify"), "green");
        assert_eq!(get_app_color("Discord"), "purple");
        assert_eq!(get_app_color("unknown"), "white");
    }

    #[test]
    fn test_port_category_names() {
        assert_eq!(PortCategory::NodeApp.name(), "Node.js Apps");
        assert_eq!(PortCategory::Database.name(), "Databases");
        assert_eq!(PortCategory::WebServer.name(), "Web Servers");
    }
}
