/// Styled terminal output for port CLI
/// Using NYC Port Authority colors with raw ANSI codes
use std::collections::HashMap;

// ANSI Color Codes - Port Authority Theme
const BLUE: &str = "\x1b[94m";        // Bright Blue
const RED: &str = "\x1b[91m";         // Bright Red
const WHITE: &str = "\x1b[97m";       // Bright White
const BOLD: &str = "\x1b[1m";
const RESET: &str = "\x1b[0m";
const UNDERLINE: &str = "\x1b[4m";

/// Print success message
pub fn print_success(message: &str) {
    println!("{}{}{} {}{}{}", BOLD, BLUE, "✓", WHITE, message, RESET);
}

/// Print error message
pub fn print_error(message: &str) {
    eprintln!("{}{}{} {}{}{}", BOLD, RED, "✗", RED, message, RESET);
}

/// Print info message
pub fn print_info(message: &str) {
    println!("{}{} {}{}{}", BLUE, "→", WHITE, message, RESET);
}

/// Print warning message
pub fn print_warning(message: &str) {
    println!("{}{}{} {}{}{}", BOLD, RED, "⚠", WHITE, message, RESET);
}

/// Print a styled header with Port Authority aesthetic
pub fn print_header(text: &str) {
    println!("\n{}{}{}{}", BOLD, BLUE, text, RESET);
    println!("{}{}{}", BLUE, "═".repeat(text.len()), RESET);
}

/// Print base domain information
pub fn print_base_info(base_domain: Option<&str>, mappings: &HashMap<String, u16>) {
    print_header("🏢 PORT AUTHORITY");

    match base_domain {
        Some(domain) => {
            println!("\n{}{}Base Domain:{} {}{}{}{}", BOLD, BLUE, RESET, BOLD, WHITE, domain, RESET);

            if !mappings.is_empty() {
                println!("\n{}{}Active Subdomains:{} {}({} configured){}", BOLD, BLUE, RESET, WHITE, mappings.len(), RESET);

                let mut sorted: Vec<_> = mappings.keys().collect();
                sorted.sort();

                for subdomain in sorted.iter().take(5) {
                    println!("  {}▸{} {}{}.{}{}", BLUE, RESET, WHITE, subdomain, domain, RESET);
                }

                if mappings.len() > 5 {
                    println!("  {}▸{} {}({} more...){}", BLUE, RESET, WHITE, mappings.len() - 5, RESET);
                }

                println!("\n{}→{} Run {}{}port list{} to see all mappings with ports", BLUE, RESET, BOLD, RED, RESET);
            } else {
                println!("\n{}No subdomains configured yet{}", RED, RESET);
                println!("{}→{} Run {}{}port map <subdomain> <port>{} to create your first mapping", BLUE, RESET, BOLD, RED, RESET);
            }
        }
        None => {
            println!("\n{}Base domain not configured{}", RED, RESET);
            println!("{}→{} Run {}{}port base <domain>{} to set it", BLUE, RESET, BOLD, RED, RESET);
        }
    }

    println!();
}

/// Print empty configuration message
pub fn print_empty_config() {
    print_header("🏢 PORT AUTHORITY");
    println!("\n{}No configuration found{}", RED, RESET);
    println!("\n{}→{} Run {}{}port init{} to get started", BLUE, RESET, BOLD, RED, RESET);
    println!();
}

/// Print the configuration in a formatted table
pub fn print_config(base_domain: Option<&str>, mappings: &HashMap<String, u16>) {
    print_header("🏢 PORT AUTHORITY");

    // Base domain
    let domain_display = base_domain
        .map(|d| format!("{}{}{}{}", BOLD, WHITE, d, RESET))
        .unwrap_or_else(|| format!("{}not set{}", RED, RESET));
    println!("\n{}{}Base Domain{}: {}", BOLD, BLUE, RESET, domain_display);

    // Mappings
    if mappings.is_empty() {
        println!("\n{}No mappings configured{}", RED, RESET);
        println!("{}→{} Run {}{}port map <subdomain> <port>{} to create your first mapping", BLUE, RESET, BOLD, RED, RESET);
    } else {
        println!("\n{}{}Subdomain Mappings:{} {}({} total){}", BOLD, BLUE, RESET, WHITE, mappings.len(), RESET);
        println!("  ╔═════════════════════════════════════════════════╗");

        let mut sorted_mappings: Vec<_> = mappings.iter().collect();
        sorted_mappings.sort_by(|a, b| a.0.cmp(b.0));

        for (subdomain, _port) in sorted_mappings {
            let hostname = if let Some(base) = base_domain {
                format!("{}.{}", subdomain, base)
            } else {
                subdomain.to_string()
            };

            print!("  ║ {}▸{} ", BLUE, RESET);
            print!("{}{}{}{} ", BOLD, WHITE, subdomain, RESET);
            print!("{}→{} ", BLUE, RESET);
            println!("{}{}http://{}{}", BLUE, UNDERLINE, hostname, RESET);
        }

        println!("  ╚═════════════════════════════════════════════════╝");
        println!("\n{}→{} Use {}{}port open <subdomain>{} to open a subdomain in your browser", BLUE, RESET, BOLD, RED, RESET);
    }
    println!();
}

/// Print a mapping entry
pub fn print_mapping(subdomain: &str, port: u16, hostname: &str) {
    println!("{}{}{}{} Mapped {} {}→{} {} (port {})",
        BOLD, BLUE, "✓", RESET,
        subdomain,
        BLUE, RESET,
        hostname,
        port
    );
}

/// Print removal confirmation
pub fn print_removal(subdomain: &str) {
    println!("{}{}{}{} Removed mapping for {}{}{}",
        BOLD, BLUE, "✓", RESET,
        WHITE, subdomain, RESET
    );
}

/// Print command tree
pub fn print_tree(max_depth: Option<usize>) {
    let depth = max_depth.unwrap_or(2);

    print_header("🏢 PORT AUTHORITY COMMANDS");
    println!();
    println!("{}{}port{}", BOLD, BLUE, RESET);

    if depth >= 1 {
        println!("  ├── {}{}init{}", BOLD, WHITE, RESET);
        println!("  │   └── {}Interactive setup wizard{}", WHITE, RESET);
        println!("  ├── {}{}base{} {}[domain]{}", BOLD, WHITE, RESET, BLUE, RESET);
        println!("  │   └── {}Show or set base domain{}", WHITE, RESET);
        println!("  ├── {}{}map{} {}<subdomain>{} {}<port>{}", BOLD, WHITE, RESET, RED, RESET, RED, RESET);
        println!("  │   └── {}Map subdomain to port{}", WHITE, RESET);
        println!("  ├── {}{}unmap{} {}<subdomain>{}", BOLD, WHITE, RESET, RED, RESET);
        println!("  │   └── {}Remove subdomain mapping{}", WHITE, RESET);
        println!("  ├── {}{}list{}", BOLD, WHITE, RESET);
        println!("  │   └── {}Show all mappings{}", WHITE, RESET);
        println!("  ├── {}{}open{} {}<subdomain>{}", BOLD, WHITE, RESET, RED, RESET);
        println!("  │   └── {}Open subdomain in browser{}", WHITE, RESET);
        println!("  ├── {}{}ports{}", BOLD, WHITE, RESET);
        println!("  │   └── {}List all active ports{}", WHITE, RESET);
        println!("  ├── {}{}reset{}", BOLD, WHITE, RESET);
        println!("  │   └── {}Clear all configuration{}", WHITE, RESET);
        println!("  ├── {}{}tree{} {}[depth]{}", BOLD, WHITE, RESET, BLUE, RESET);
        println!("  │   └── {}Show command tree{}", WHITE, RESET);
        println!("  └── {}{}docs{}", BOLD, WHITE, RESET);
        println!("      └── {}Open documentation{}", WHITE, RESET);
    }

    println!();
    println!("{}Depth{}: {}{}{}{}", BLUE, RESET, BOLD, WHITE, depth, RESET);
    if depth < 2 {
        println!("{}💡{} {}Use 'port tree 2' for more detail{}", BLUE, RESET, WHITE, RESET);
    }
    println!();
}

/// Print documentation URL
pub fn print_docs() {
    print_header("🏢 PORT AUTHORITY DOCS");
    println!("\n{}Opening documentation in your browser...{}", WHITE, RESET);
    println!("\n{}→{} {}{}https://github.com/joshkornreich/port-authority{}", BLUE, RESET, BLUE, UNDERLINE, RESET);
    println!();
}

/// Print reset confirmation
pub fn print_reset_confirmation() {
    print_warning("This will clear ALL port configuration and hosts file entries.");
    println!("{}→{} {}{}Proceed? [y/N]:{}", BLUE, RESET, BOLD, WHITE, RESET);
}

/// Print hosts file guidance
pub fn print_hosts_guidance(guidance: &str) {
    print_header("Hosts File Permission Required");
    println!("\n{}{}{}", RED, guidance, RESET);
    println!();
}

/// Print app added confirmation
pub fn print_app_added(name: &str, config: &crate::apps::AppConfig) {
    print_header("🏢 PORT AUTHORITY");
    println!("\n{}{}App Added{}: {}{}{}{}", BOLD, BLUE, RESET, BOLD, WHITE, name, RESET);
    println!("  {}▸{} {}Command:{} {}", BLUE, RESET, BLUE, WHITE, config.command);
    println!("  {}▸{} {}Port:{} {}", BLUE, RESET, BLUE, WHITE, config.port);
    println!("  {}▸{} {}Directory:{} {}", BLUE, RESET, BLUE, WHITE, config.directory);
    println!("  {}▸{} {}Auto-restart:{} {}", BLUE, RESET, BLUE, WHITE, config.auto_restart);
    println!("  {}▸{} {}Max restarts:{} {}", BLUE, RESET, BLUE, WHITE, config.max_restarts);
    println!();
}

/// Print list of apps
pub fn print_app_list(apps: &[crate::apps::AppConfig]) {
    print_header("🏢 PORT AUTHORITY");
    println!("\n{}{}Configured Apps:{} {}({} total){}", BOLD, BLUE, RESET, WHITE, apps.len(), RESET);
    println!("  ╔═══════════════════════════════════════════════════════╗");

    for app in apps {
        println!("  ║ {}{}{}{:<20}{} {}→{} {}{:<10}{}",
            BOLD, WHITE, app.name, "", RESET,
            BLUE, RESET,
            WHITE, format!(":{}", app.port), RESET
        );
        println!("  ║   {}▸{} {}", BLUE, RESET, app.command);
    }

    println!("  ╚═══════════════════════════════════════════════════════╝");
    println!();
}

/// Print list of apps with status
pub fn print_app_list_with_status(
    apps: &[crate::apps::AppConfig],
    statuses: &[crate::process::ProcessStatus],
) {
    use std::collections::HashMap;

    print_header("🏢 PORT AUTHORITY");
    println!("\n{}{}Managed Apps:{} {}({} total){}", BOLD, BLUE, RESET, WHITE, apps.len(), RESET);
    println!("  ╔═══════════════════════════════════════════════════════╗");

    // Create status map
    let status_map: HashMap<_, _> = statuses.iter()
        .map(|s| (s.name.as_str(), s))
        .collect();

    for app in apps {
        let status_indicator = if let Some(status) = status_map.get(app.name.as_str()) {
            match status.state {
                crate::process::ProcessState::Running => format!("{}●{} Running", BLUE, RESET),
                crate::process::ProcessState::Stopped => format!("{}●{} Stopped", RED, RESET),
                crate::process::ProcessState::Starting => format!("{}⟳{} Starting", BLUE, RESET),
                crate::process::ProcessState::Restarting => format!("{}⟳{} Restarting", BLUE, RESET),
                crate::process::ProcessState::Unhealthy => format!("{}●{} Unhealthy", RED, RESET),
                crate::process::ProcessState::Failed => format!("{}✗{} Failed", RED, RESET),
            }
        } else {
            format!("{}●{} Unknown", WHITE, RESET)
        };

        println!("  ║ {}{}{:<20}{} {} {}:{}",
            BOLD, WHITE, app.name, RESET,
            status_indicator,
            WHITE, app.port
        );
    }

    println!("  ╚═══════════════════════════════════════════════════════╝");
    println!();
}

/// Print daemon status
pub fn print_daemon_status(status: &crate::daemon::DaemonStatus, verbose: bool) {
    print_header("🏢 PORT AUTHORITY");

    println!("\n{}{}Daemon Status{}", BOLD, BLUE, RESET);
    println!("  {}▸{} {}PID:{} {}", BLUE, RESET, BLUE, WHITE, status.pid);
    println!("  {}▸{} {}Uptime:{} {:.0}s", BLUE, RESET, BLUE, WHITE, status.uptime.as_secs());
    println!("  {}▸{} {}Apps:{} {}", BLUE, RESET, BLUE, WHITE, status.apps.len());
    println!("  {}▸{} {}Total Restarts:{} {}", BLUE, RESET, BLUE, WHITE, status.total_restarts);

    if verbose && !status.apps.is_empty() {
        println!("\n{}{}App Details:{}", BOLD, BLUE, RESET);
        for app in &status.apps {
            let state_str = match app.state {
                crate::process::ProcessState::Running => format!("{}Running{}", BLUE, RESET),
                crate::process::ProcessState::Stopped => format!("{}Stopped{}", RED, RESET),
                crate::process::ProcessState::Starting => format!("{}Starting{}", BLUE, RESET),
                crate::process::ProcessState::Restarting => format!("{}Restarting{}", BLUE, RESET),
                crate::process::ProcessState::Unhealthy => format!("{}Unhealthy{}", RED, RESET),
                crate::process::ProcessState::Failed => format!("{}Failed{}", RED, RESET),
            };

            println!("  {}▸{} {}{}{} - {}",
                BLUE, RESET,
                BOLD, app.name, RESET,
                state_str
            );

            if let Some(pid) = app.pid {
                println!("    {}PID:{} {}", BLUE, WHITE, pid);
            }
            println!("    {}Restarts:{} {}", BLUE, WHITE, app.restart_count);
        }
    }

    println!();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_print_functions() {
        // These just test that the functions don't panic
        print_success("Test success");
        print_error("Test error");
        print_info("Test info");
        print_warning("Test warning");
        print_header("Test Header");
    }

    #[test]
    fn test_print_mapping() {
        print_mapping("api", 3000, "api.localhost");
    }

    #[test]
    fn test_print_tree() {
        print_tree(Some(1));
        print_tree(Some(2));
        print_tree(None);
    }
}
