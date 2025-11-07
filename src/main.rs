mod browser;
mod config;
mod error;
mod hosts;
mod nginx;
mod output;
mod ports;

use clap::{Parser, Subcommand};
use config::Config;
use error::{PorterError, Result};
use log::{debug, error};
use std::io::{self, Write};
use dialoguer::{Input, Confirm, theme::ColorfulTheme};

/// A CLI tool for managing subdomain-to-localhost port mappings
#[derive(Parser, Debug)]
#[command(name = "port")]
#[command(author = "Josh Kornreich")]
#[command(version = "0.1.0")]
#[command(about = "Manage subdomain-to-localhost port mappings", long_about = None)]
#[command(styles = get_styles())]
#[command(color = clap::ColorChoice::Always)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// Enable verbose logging
    #[arg(short, long, global = true)]
    verbose: bool,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Interactive setup wizard (recommended for first-time users)
    Init,

    /// Show or set the base domain
    Base {
        /// The base domain to set (omit to show current)
        domain: Option<String>,
    },

    /// Set the base domain (deprecated, use 'base' instead)
    Set {
        #[command(subcommand)]
        set_command: SetCommands,
    },

    /// Map a subdomain to a port
    Map {
        /// The subdomain to map
        subdomain: String,

        /// The port number
        port: u16,
    },

    /// Map a subdomain to a port (alias for map)
    Route {
        /// The subdomain to map
        subdomain: String,

        /// The port number
        port: u16,
    },

    /// Remove a subdomain mapping
    Unmap {
        /// The subdomain to remove
        subdomain: String,
    },

    /// List all mappings
    List,

    /// Open a subdomain in the browser
    Open {
        /// The subdomain to open
        subdomain: String,
    },

    /// Display command tree
    Tree {
        /// Maximum depth to display
        #[arg(default_value = "2")]
        depth: usize,
    },

    /// Open documentation
    Docs,

    /// Reset all configuration
    Reset {
        /// Skip confirmation prompt
        #[arg(short, long)]
        yes: bool,
    },

    /// List all ports currently in use
    Ports,

    /// Full namespace: port authority <subcommand>
    Authority {
        #[command(subcommand)]
        authority_command: AuthorityCommands,
    },
}

#[derive(Subcommand, Debug)]
enum AuthorityCommands {
    /// Interactive setup wizard (recommended for first-time users)
    Init,

    /// Show or set the base domain
    Base {
        /// The base domain to set (omit to show current)
        domain: Option<String>,
    },

    /// Map a subdomain to a port
    Map {
        /// The subdomain to map
        subdomain: String,

        /// The port number
        port: u16,
    },

    /// Remove a subdomain mapping
    Unmap {
        /// The subdomain to remove
        subdomain: String,
    },

    /// List all mappings
    List,

    /// Open a subdomain in the browser
    Open {
        /// The subdomain to open
        subdomain: String,
    },

    /// Display command tree
    Tree {
        /// Maximum depth to display
        #[arg(default_value = "2")]
        depth: usize,
    },

    /// Reset all configuration
    Reset {
        /// Skip confirmation prompt
        #[arg(short, long)]
        yes: bool,
    },

    /// List all ports currently in use
    Ports,
}

#[derive(Subcommand, Debug)]
enum SetCommands {
    /// Set the base domain
    Base {
        /// The base domain (e.g., "localhost")
        domain: String,
    },
}

fn get_styles() -> clap::builder::Styles {
    use clap::builder::styling::*;

    Styles::styled()
        .header(AnsiColor::BrightCyan.on_default().bold())
        .usage(AnsiColor::BrightBlue.on_default().bold())
        .literal(AnsiColor::BrightGreen.on_default().bold())
        .placeholder(AnsiColor::BrightYellow.on_default())
        .valid(AnsiColor::BrightGreen.on_default().bold())
        .invalid(AnsiColor::BrightRed.on_default().bold())
        .error(AnsiColor::BrightRed.on_default().bold())
}

fn main() {
    // Force enable colors for Port Authority aesthetic
    colored::control::set_override(true);

    // Also set environment variable for clap and other tools
    std::env::set_var("CLICOLOR_FORCE", "1");
    std::env::set_var("FORCE_COLOR", "1");

    // Check if no arguments provided - show custom colorful help
    let args: Vec<String> = std::env::args().collect();
    if args.len() == 1 {
        show_custom_help();
        std::process::exit(0);
    }

    // Parse CLI arguments with custom error handling
    let cli = match Cli::try_parse() {
        Ok(cli) => cli,
        Err(e) => {
            // Custom error handling for better UX
            handle_parse_error(e);
            std::process::exit(1);
        }
    };

    // Initialize logger
    if cli.verbose {
        env_logger::Builder::from_default_env()
            .filter_level(log::LevelFilter::Debug)
            .init();
    } else {
        // In non-verbose mode, suppress all logging output
        env_logger::Builder::from_default_env()
            .filter_level(log::LevelFilter::Off)
            .init();
    }

    // Execute command
    if let Err(e) = execute_command(cli.command) {
        output::print_error(&format!("{}", e));
        error!("Command failed: {}", e);
        std::process::exit(1);
    }
}

fn execute_command(command: Commands) -> Result<()> {
    match command {
        Commands::Init => handle_init(),
        Commands::Base { domain } => handle_base(domain),
        Commands::Set { set_command } => handle_set(set_command),
        Commands::Map { subdomain, port } => handle_map(subdomain, port),
        Commands::Route { subdomain, port } => handle_map(subdomain, port), // Alias
        Commands::Unmap { subdomain } => handle_unmap(subdomain),
        Commands::List => handle_list(),
        Commands::Open { subdomain } => handle_open(subdomain),
        Commands::Tree { depth } => handle_tree(depth),
        Commands::Docs => handle_docs(),
        Commands::Reset { yes } => handle_reset(yes),
        Commands::Ports => handle_ports(),
        Commands::Authority { authority_command } => execute_authority_command(authority_command),
    }
}

fn execute_authority_command(command: AuthorityCommands) -> Result<()> {
    match command {
        AuthorityCommands::Init => handle_init(),
        AuthorityCommands::Base { domain } => handle_base(domain),
        AuthorityCommands::Map { subdomain, port } => handle_map(subdomain, port),
        AuthorityCommands::Unmap { subdomain } => handle_unmap(subdomain),
        AuthorityCommands::List => handle_list(),
        AuthorityCommands::Open { subdomain } => handle_open(subdomain),
        AuthorityCommands::Tree { depth } => handle_tree(depth),
        AuthorityCommands::Reset { yes } => handle_reset(yes),
        AuthorityCommands::Ports => handle_ports(),
    }
}

fn handle_base(domain: Option<String>) -> Result<()> {
    match domain {
        Some(new_domain) => {
            // Set base domain
            let mut config = Config::load()?;
            config.set_base_domain(new_domain.clone())?;
            config.save()?;

            output::print_success(&format!("Base domain set to: {}", new_domain));
            debug!("Base domain updated: {}", new_domain);
            Ok(())
        }
        None => {
            // Show current base domain
            let config = Config::load()?;
            output::print_base_info(config.base_domain.as_deref(), &config.mappings);
            Ok(())
        }
    }
}

fn handle_init() -> Result<()> {
    use colored::Colorize;

    println!("\n{}", "🏢 PORT AUTHORITY".bright_blue().bold());
    println!("{}", "═".repeat(50).blue());
    println!("{}", "Setup Wizard".bright_white().bold());
    println!("\n{}\n", "This wizard will help you configure Port Authority for the first time.".white());

    // Check if already configured
    let existing_config = Config::load().ok();
    if let Some(config) = &existing_config {
        if config.base_domain.is_some() && !config.mappings.is_empty() {
            println!("{}", "⚠ You already have an existing configuration:".red().bold());
            output::print_config(config.base_domain.as_deref(), &config.mappings);
            println!();

            let continue_anyway = Confirm::with_theme(&ColorfulTheme::default())
                .with_prompt("Do you want to continue with the wizard anyway?")
                .default(false)
                .interact()
                .unwrap_or(false);

            if !continue_anyway {
                println!("\n{}", "Setup cancelled. Your existing configuration is preserved.".bright_white());
                return Ok(());
            }
        }
    }

    // Step 1: Set base domain
    println!("{}", "Step 1: Base Domain".bright_blue().bold());
    println!("{}", "This is the domain that subdomains will be added to.".white());
    println!("{}\n", "Common choices: localhost, local, test, dev".white());

    let base_domain: String = Input::with_theme(&ColorfulTheme::default())
        .with_prompt("Enter your base domain")
        .default("localhost".to_string())
        .interact_text()
        .unwrap_or_else(|_| "localhost".to_string());

    let mut config = Config::load().unwrap_or_default();
    config.set_base_domain(base_domain.clone())?;
    config.save()?;

    println!("\n{} {}{}\n", "✓".bright_blue().bold(), "Base domain set to: ".bright_white(), base_domain.bright_white().bold());

    // Step 2: Create first mapping
    println!("{}", "Step 2: Create Your First Mapping".bright_blue().bold());
    println!("{}", "Let's map a subdomain to a port on your computer.".white());
    println!("{}\n", format!("Example: 'api' subdomain → port 3000 = api.{}", base_domain).white());

    let create_mapping = Confirm::with_theme(&ColorfulTheme::default())
        .with_prompt("Would you like to create a mapping now?")
        .default(true)
        .interact()
        .unwrap_or(true);

    if create_mapping {
        let subdomain: String = Input::with_theme(&ColorfulTheme::default())
            .with_prompt("Enter subdomain name")
            .default("api".to_string())
            .validate_with(|input: &String| {
                if input.is_empty() {
                    Err("Subdomain cannot be empty")
                } else if input.contains('.') {
                    Err("Don't include dots - just the subdomain name")
                } else {
                    Ok(())
                }
            })
            .interact_text()
            .unwrap_or_else(|_| "api".to_string());

        let port: String = Input::with_theme(&ColorfulTheme::default())
            .with_prompt("Enter port number")
            .default("3000".to_string())
            .validate_with(|input: &String| {
                match input.parse::<u16>() {
                    Ok(p) if p > 0 => Ok(()),
                    _ => Err("Please enter a valid port number (1-65535)")
                }
            })
            .interact_text()
            .unwrap_or_else(|_| "3000".to_string());

        let port: u16 = port.parse().unwrap_or(3000);

        config.add_mapping(subdomain.clone(), port)?;
        config.save()?;

        let hostname = config.get_hostname(&subdomain)?;

        println!("\n{} Mapping created: {} {} → {}",
            "✓".green(),
            subdomain.green().bold(),
            "→".cyan(),
            format!("{}:{}", hostname, port).green().bold()
        );

        // Step 3: Hosts file
        println!("\n{}", "Step 3: Update Hosts File".cyan().bold());
        println!("To access your mapping, Port needs to update your system's hosts file.");
        println!("This requires elevated permissions (sudo/admin).\n");

        let update_hosts = Confirm::with_theme(&ColorfulTheme::default())
            .with_prompt("Would you like to update the hosts file now?")
            .default(true)
            .interact()
            .unwrap_or(true);

        if update_hosts {
            // Will auto-prompt for sudo if needed
            match hosts::add_entry(&hostname, port) {
                Ok(_) => {
                    println!("\n{}", "🎉 Setup Complete!".green().bold());
                    println!("\nYou can now:");
                    println!("  • Access your service at: {}", format!("http://{}:{}", hostname, port).cyan().underline());
                    println!("  • Open in browser: {}", format!("port open {}", subdomain).yellow());
                    println!("  • View all mappings: {}", "port list".yellow());
                    println!("  • Create more mappings: {}", format!("port map <subdomain> <port>").yellow());
                }
                Err(e) => {
                    println!("\n{} Could not update hosts file: {}", "✗".red(), e);
                    println!("\nConfiguration saved, but hosts file not updated.");
                    println!("Try running the command again.");
                }
            }
        } else {
            println!("\n{}", "Setup partially complete!".yellow());
            println!("\nTo activate your mapping, run: {}",
                format!("port map {} {}", subdomain, port).yellow().bold());
        }
    } else {
        println!("\n{}", "✓ Base domain configured!".green());
        println!("\nNext steps:");
        println!("  • Create a mapping: {}", "port map <subdomain> <port>".yellow());
        println!("  • View all commands: {}", "port --help".yellow());
    }

    println!("\n{}", "Need help? Run: port --help".cyan());
    println!("{}", "━".repeat(50).cyan());

    Ok(())
}

fn handle_set(set_command: SetCommands) -> Result<()> {
    match set_command {
        SetCommands::Base { domain } => {
            let mut config = Config::load()?;
            config.set_base_domain(domain.clone())?;
            config.save()?;

            output::print_success(&format!("Base domain set to: {}", domain));
            debug!("Base domain updated: {}", domain);
            Ok(())
        }
    }
}

fn handle_map(subdomain: String, port: u16) -> Result<()> {
    use colored::Colorize;

    let mut config = Config::load()?;

    // Add mapping to config
    config.add_mapping(subdomain.clone(), port)?;
    config.validate()?;
    config.save()?;

    // Get the full hostname
    let hostname = config.get_hostname(&subdomain)?;

    println!("\n{}", "🏢 PORT AUTHORITY".bright_blue().bold());
    println!("{}", "═".repeat(50).blue());
    println!("{}", "Configuring Mapping".bright_white().bold());
    println!();

    // Update /etc/hosts
    let hosts_ok = match hosts::add_entry(&hostname, port) {
        Ok(_) => {
            println!("  {} {}", "✓".bright_blue().bold(), "DNS configured in /etc/hosts".bright_white());
            true
        }
        Err(_) => {
            println!("  {} {}", "⚠".red().bold(), "DNS not configured (run with sudo for DNS)".white());
            false
        }
    };

    // Configure nginx
    match nginx::add_nginx_config(&hostname, port) {
        Ok(_) => {
            println!("  {} {}", "✓".bright_blue().bold(), "nginx proxy configured and reloaded".bright_white());
            println!();
            println!("  {} {} {}",
                subdomain.bright_white().bold(),
                "→".blue(),
                format!("http://{}", hostname).bright_blue().underline()
            );
            println!("  {} {}", "▸".blue(), format!("Proxying to localhost:{}", port).white());

            if !hosts_ok {
                println!();
                println!("  {} For DNS to work, run: {}", "💡".bright_blue(), format!("sudo port map {} {}", subdomain, port).red().bold());
            }
        }
        Err(e) => {
            output::print_warning(&format!("nginx configuration failed: {}", e));
            output::print_info("Make sure nginx is installed: brew install nginx");
        }
    }

    println!();
    Ok(())
}

fn handle_unmap(subdomain: String) -> Result<()> {
    use colored::Colorize;

    let mut config = Config::load()?;

    // Get hostname before removing
    let hostname = config.get_hostname(&subdomain)?;

    // Remove from config
    let _port = config.remove_mapping(&subdomain)?;
    config.save()?;

    println!("\n{}", "🏢 PORT AUTHORITY".bright_blue().bold());
    println!("{}", "═".repeat(50).blue());
    println!("{}", "Removing Mapping".bright_white().bold());
    println!();

    // Remove from hosts file
    match hosts::remove_entry(&hostname) {
        Ok(_) => println!("  {} {}", "✓".bright_blue().bold(), "Removed from /etc/hosts".bright_white()),
        Err(_) => println!("  {} {}", "⚠".red().bold(), "DNS entry not removed (run with sudo)".white()),
    }

    // Remove nginx config
    match nginx::remove_nginx_config(&hostname) {
        Ok(_) => {
            println!("  {} {}", "✓".bright_blue().bold(), "nginx configuration removed and reloaded".bright_white());
            println!();
            println!("  {} {}", "✓".bright_blue().bold(), format!("Unmapped {}", subdomain).bright_white().bold());
        }
        Err(e) => {
            output::print_warning(&format!("nginx configuration removal failed: {}", e));
        }
    }

    println!();
    Ok(())
}

fn handle_list() -> Result<()> {
    let config = Config::load()?;

    if config.base_domain.is_none() && config.mappings.is_empty() {
        output::print_empty_config();
    } else {
        output::print_config(config.base_domain.as_deref(), &config.mappings);
    }

    Ok(())
}

fn handle_open(subdomain: String) -> Result<()> {
    let config = Config::load()?;

    // Get port for subdomain
    let port = config.get_mapping(&subdomain)
        .ok_or_else(|| error::PorterError::MappingNotFound(subdomain.clone()))?;

    // Get full hostname
    let hostname = config.get_hostname(&subdomain)?;

    // Build URL and open
    let url = browser::build_url(&hostname, port);
    browser::open_url(&url)?;

    output::print_success(&format!("Opening {} in browser", url));
    Ok(())
}

fn handle_tree(depth: usize) -> Result<()> {
    output::print_tree(Some(depth));
    Ok(())
}

fn handle_docs() -> Result<()> {
    output::print_docs();

    // Try to open GitHub repo
    let docs_url = "https://github.com/joshkornreich/port-authority";
    if let Err(e) = browser::open_url(docs_url) {
        output::print_warning(&format!("Could not open browser: {}", e));
        output::print_info(&format!("Visit: {}", docs_url));
    }

    Ok(())
}

fn show_custom_help() {
    use colored::Colorize;

    println!("\n{}", "🏢 PORT AUTHORITY".bright_cyan().bold());
    println!("{}", "═".repeat(60).bright_blue());
    println!("{}\n", "Manage subdomain-to-localhost port mappings".bright_white());

    println!("{}", "CORE COMMANDS".bright_cyan().bold());
    println!("  {} {}  {}", "port init".bright_green().bold(), "→".bright_blue(), "Interactive setup wizard (recommended)".white());
    println!("  {} {}  {}", "port list".bright_green().bold(), "→".bright_blue(), "Show all mappings".white());
    println!("  {} {}  {}", "port ports".bright_green().bold(), "→".bright_blue(), "List all active ports".white());
    println!();

    println!("{}", "MAPPING COMMANDS".bright_cyan().bold());
    println!("  {} {}  {}", "port map <subdomain> <port>".bright_green().bold(), "→".bright_blue(), "Map subdomain to port".white());
    println!("  {} {}  {}", "port unmap <subdomain>".bright_green().bold(), "→".bright_blue(), "Remove subdomain mapping".white());
    println!("  {} {}  {}", "port open <subdomain>".bright_green().bold(), "→".bright_blue(), "Open subdomain in browser".white());
    println!();

    println!("{}", "CONFIGURATION".bright_cyan().bold());
    println!("  {} {}  {}", "port base [domain]".bright_green().bold(), "→".bright_blue(), "Show or set base domain".white());
    println!("  {} {}  {}", "port reset".bright_green().bold(), "→".bright_blue(), "Clear all configuration".white());
    println!();

    println!("{}", "OTHER".bright_cyan().bold());
    println!("  {} {}  {}", "port tree [depth]".bright_green().bold(), "→".bright_blue(), "Display command tree".white());
    println!("  {} {}  {}", "port docs".bright_green().bold(), "→".bright_blue(), "Open documentation".white());
    println!("  {} {}  {}", "port --help".bright_green().bold(), "→".bright_blue(), "Show detailed help".white());
    println!();

    println!("{}", "EXAMPLES".bright_yellow().bold());
    println!("  {} Set up Port Authority for first time", "port init".bright_green());
    println!("  {} Map 'api' subdomain to port 3000", "port map api 3000".bright_green());
    println!("  {} Open api.localhost in browser", "port open api".bright_green());
    println!("  {} See what's running on your ports", "port ports".bright_green());
    println!();

    println!("{}", "━".repeat(60).bright_blue());
    println!("{} {}", "Version:".bright_blue(), "0.1.0".white());
    println!("{} {}\n", "For more help:".bright_blue(), "port --help".bright_yellow());
}

fn handle_parse_error(err: clap::Error) {
    use colored::Colorize;

    let err_str = err.to_string();

    // Extract the command being attempted
    if err_str.contains("required arguments were not provided") {
        println!("\n{} {}", "✗".red().bold(), "Missing required information".red().bold());
        println!();

        if err_str.contains("port map") || err_str.contains("'map'") {
            println!("{} {}", "Usage:".cyan().bold(), "port map <subdomain> <port>");
            println!();
            println!("{}", "Examples:".cyan().bold());
            println!("  {} Map 'api' subdomain to port 3000", "port map api 3000".yellow());
            println!("  {} Map 'frontend' to port 8080", "port map frontend 8080".yellow());
            println!("  {} Map 'db' to port 5432", "port map db 5432".yellow());
            println!();
            println!("{} This creates a reverse proxy so {} redirects to {}",
                "→".cyan(),
                "http://api.localhost".green().underline(),
                "localhost:3000".green()
            );
        } else if err_str.contains("port base") || err_str.contains("'base'") {
            println!("{} {}", "Usage:".cyan().bold(), "port base [domain]");
            println!();
            println!("{}", "Examples:".cyan().bold());
            println!("  {} Show current base domain", "port base".yellow());
            println!("  {} Set base domain to 'localhost'", "port base localhost".yellow());
            println!("  {} Set base domain to 'local'", "port base local".yellow());
        } else if err_str.contains("port open") || err_str.contains("'open'") {
            println!("{} {}", "Usage:".cyan().bold(), "port open <subdomain>");
            println!();
            println!("{}", "Examples:".cyan().bold());
            println!("  {} Open api.localhost in browser", "port open api".yellow());
            println!("  {} Open frontend.localhost", "port open frontend".yellow());
        } else {
            // Generic help
            println!("{}", "Try one of these commands:".cyan().bold());
            println!("  {} Get started with interactive setup", "port init".yellow().bold());
            println!("  {} Map a subdomain to a port", "port map <subdomain> <port>".yellow());
            println!("  {} Show all mappings", "port list".yellow());
            println!("  {} Show base domain", "port base".yellow());
        }

        println!();
        println!("{} Run {} for all commands", "→".cyan(), "port --help".yellow());
        println!();
    } else if err_str.contains("unrecognized subcommand") || err_str.contains("unexpected argument") {
        println!("\n{} {}", "✗".red().bold(), "Unknown command".red().bold());
        println!();
        println!("{}", "Did you mean:".cyan().bold());
        println!("  {} Interactive setup wizard", "port init".yellow().bold());
        println!("  {} Map subdomain to port", "port map <subdomain> <port>".yellow());
        println!("  {} Show all mappings", "port list".yellow());
        println!("  {} Show/set base domain", "port base [domain]".yellow());
        println!();
        println!("{} Run {} to see all commands", "→".cyan(), "port --help".yellow());
        println!();
    } else {
        // Fallback to original error but with suggestions
        eprintln!("{}", err);
        println!();
        println!("{} Try {} for help", "→".cyan(), "port --help".yellow());
        println!();
    }
}

fn handle_ports() -> Result<()> {
    use colored::Colorize;
    use std::collections::HashMap;

    println!("\n{}", "🏢 PORT AUTHORITY".bright_blue().bold());
    println!("{}", "═".repeat(50).blue());
    println!("{}", "Active Ports".bright_white().bold());

    match ports::get_active_ports() {
        Ok(port_list) => {
            if port_list.is_empty() {
                println!("\n{}", "No active ports found".yellow());
                return Ok(());
            }

            // Load config to check which are already mapped
            let config = Config::load().unwrap_or_default();
            let base = config.base_domain.as_deref().unwrap_or("localhost");

            // Group ports by category
            let mut grouped: HashMap<ports::PortCategory, Vec<&ports::PortInfo>> = HashMap::new();
            for port_info in &port_list {
                let category = ports::categorize_port(port_info);
                grouped.entry(category).or_insert_with(Vec::new).push(port_info);
            }

            // Sort categories
            let mut categories: Vec<_> = grouped.keys().copied().collect();
            categories.sort();

            println!();

            for category in categories {
                let mut ports_in_category: Vec<_> = grouped.get(&category).unwrap().iter().copied().collect();

                // Sort by process name within category so same apps are together
                ports_in_category.sort_by(|a, b| a.process_name.cmp(&b.process_name));

                // Category header with color
                let category_name = category.name();
                let header_color = match category {
                    ports::PortCategory::Database => category_name.blue().bold(),
                    ports::PortCategory::WebServer => category_name.magenta().bold(),
                    ports::PortCategory::NodeApp => category_name.green().bold(),
                    ports::PortCategory::PythonApp => category_name.yellow().bold(),
                    ports::PortCategory::RubyApp => category_name.red().bold(),
                    ports::PortCategory::JavaApp => category_name.cyan().bold(),
                    ports::PortCategory::DesktopApp => category_name.magenta().bold(),
                    ports::PortCategory::SystemService => category_name.white().bold(),
                    ports::PortCategory::Other => category_name.white().bold(),
                };

                println!("  {}", header_color);
                println!("  ╔════════════════════════════════════════════════════════════════╗");

                for port_info in &ports_in_category {
                    let friendly_name = ports::get_friendly_name(port_info);

                    // Check if this port is already mapped
                    let mapped_subdomain = config.mappings.iter()
                        .find(|(_, &p)| p == port_info.port)
                        .map(|(sub, _)| sub.as_str());

                    let port_str = format!("{:<5}", port_info.port);

                    // Split the friendly name into parts (framework · project)
                    let name_parts: Vec<&str> = friendly_name.split(" · ").collect();
                    let name_str = if name_parts.len() == 2 {
                        // We have framework and project name
                        format!("{:<15} {:<20}", name_parts[0], name_parts[1])
                    } else {
                        // Just one part
                        format!("{:<35}", friendly_name)
                    };

                    // Use Port Authority colors with enhanced scheme
                    let (port_colored, name_colored) = if category == ports::PortCategory::DesktopApp {
                        // Use brand colors for desktop apps
                        let color = ports::get_app_color(&port_info.process_name);
                        match color {
                            "green" => (port_str.green().bold(), name_str.green().bold()),
                            "purple" => (port_str.magenta().bold(), name_str.magenta().bold()),
                            "magenta" => (port_str.magenta().bold(), name_str.magenta().bold()),
                            "red" => (port_str.red().bold(), name_str.red().bold()),
                            _ => (port_str.bright_white().bold(), name_str.bright_white()),
                        }
                    } else {
                        // Enhanced category colors for dev tools with bold emphasis
                        match category {
                            ports::PortCategory::NodeApp => (port_str.bright_green().bold(), name_str.green().bold()),
                            ports::PortCategory::PythonApp => (port_str.bright_yellow().bold(), name_str.yellow().bold()),
                            ports::PortCategory::Database => (port_str.bright_cyan().bold(), name_str.cyan().bold()),
                            ports::PortCategory::WebServer => (port_str.bright_magenta().bold(), name_str.magenta().bold()),
                            ports::PortCategory::RubyApp => (port_str.bright_red().bold(), name_str.red().bold()),
                            ports::PortCategory::JavaApp => (port_str.bright_blue().bold(), name_str.blue().bold()),
                            _ => (port_str.bright_white().bold(), name_str.white()),
                        }
                    };

                    if let Some(subdomain) = mapped_subdomain {
                        // Already mapped - show checkmark with Port Authority colors
                        println!("  ║ {} {} {} {}",
                            port_colored,
                            "→".bright_blue(),
                            name_colored,
                            format!("✓ {}.{}", subdomain, base).bright_cyan().bold()
                        );
                    } else {
                        // Not mapped - show command to map it in dimmed style
                        println!("  ║ {} {} {} {}",
                            port_colored,
                            "→".bright_blue(),
                            name_colored,
                            format!("port map <name> {}", port_info.port).red().dimmed()
                        );
                    }
                }

                println!("  ╚════════════════════════════════════════════════════════════════╝");
                println!();
            }

            println!("{} Use {} to map a port",
                "→".blue(),
                "port map <subdomain> <port>".red().bold()
            );
        }
        Err(e) => {
            output::print_error(&format!("Failed to scan ports: {}", e));
            println!("{} Make sure you have permission to run 'lsof'", "→".cyan());
        }
    }

    println!();
    Ok(())
}

fn handle_reset(skip_confirmation: bool) -> Result<()> {
    // Ask for confirmation unless --yes flag is provided
    if !skip_confirmation {
        output::print_reset_confirmation();

        let mut input = String::new();
        io::stdout().flush().unwrap();
        io::stdin().read_line(&mut input).unwrap();

        let answer = input.trim().to_lowercase();
        if answer != "y" && answer != "yes" {
            output::print_info("Reset cancelled");
            return Ok(());
        }
    }

    // Clear hosts file entries
    match hosts::clear_entries() {
        Ok(_) => output::print_success("Cleared hosts file entries"),
        Err(e) => output::print_warning(&format!("Could not clear hosts file: {}", e)),
    }

    // Clear nginx configs
    match nginx::clear_all_configs() {
        Ok(_) => output::print_success("Cleared nginx configurations"),
        Err(e) => output::print_warning(&format!("Could not clear nginx configs: {}", e)),
    }

    // Reset config
    let mut config = Config::load()?;
    config.reset();
    config.save()?;

    output::print_success("All configuration cleared");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cli_parsing() {
        // Test that CLI parsing works
        let cli = Cli::try_parse_from(vec!["porter", "list"]);
        assert!(cli.is_ok());

        let cli = Cli::try_parse_from(vec!["porter", "set", "base", "localhost"]);
        assert!(cli.is_ok());

        let cli = Cli::try_parse_from(vec!["porter", "map", "api", "3000"]);
        assert!(cli.is_ok());
    }
}
