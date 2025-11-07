/// Port scanning and detection for porter
use crate::error::{PorterError, Result};
use log::debug;
use std::process::Command;

#[derive(Debug, Clone)]
pub struct PortInfo {
    pub port: u16,
    pub process_name: String,
    pub pid: String,
    pub protocol: String,
}

/// Get list of ports currently in use
pub fn get_active_ports() -> Result<Vec<PortInfo>> {
    if cfg!(target_os = "macos") || cfg!(target_os = "linux") {
        get_active_ports_unix()
    } else {
        Err(PorterError::Config("Port scanning not supported on this OS".into()))
    }
}

fn get_active_ports_unix() -> Result<Vec<PortInfo>> {
    // Use lsof to list open ports
    let output = Command::new("lsof")
        .args(&["-i", "-P", "-n"])
        .output()
        .map_err(|e| PorterError::Config(format!("Failed to run lsof: {}", e)))?;

    if !output.status.success() {
        return Err(PorterError::Config("lsof command failed".into()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut ports = Vec::new();
    let mut seen_ports = std::collections::HashSet::new();

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

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
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
    let output = Command::new("ps")
        .args(&["-p", pid, "-o", "command="])
        .output()
        .ok()?;

    if output.status.success() {
        let cmdline = String::from_utf8_lossy(&output.stdout);
        Some(cmdline.trim().to_string())
    } else {
        None
    }
}

/// Get the working directory of a process
fn get_process_cwd(pid: &str) -> Option<String> {
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
            // Keep common small words lowercase unless they're the first word
            let lower = word.to_lowercase();
            if word.is_empty() {
                return String::new();
            }

            // Capitalize first letter of each word, but keep common words lowercase
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

/// Check if a specific port is in use
pub fn is_port_in_use(port: u16) -> bool {
    if let Ok(ports) = get_active_ports() {
        ports.iter().any(|p| p.port == port)
    } else {
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_active_ports() {
        // This test will only work if lsof is available
        if let Ok(ports) = get_active_ports() {
            // Should find at least some system ports
            assert!(ports.len() > 0);

            // Ports should be sorted
            for i in 1..ports.len() {
                assert!(ports[i].port >= ports[i - 1].port);
            }
        }
    }

    #[test]
    fn test_friendly_names() {
        let port_info = PortInfo {
            port: 3000,
            process_name: "node".to_string(),
            pid: "12345".to_string(),
            protocol: "TCP".to_string(),
        };

        let name = get_friendly_name(&port_info);
        assert!(name.contains("Node"));
    }
}
