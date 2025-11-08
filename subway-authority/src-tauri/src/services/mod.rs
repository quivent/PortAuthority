/// Service modules for Subway Authority
///
/// This module contains the core business logic for port scanning,
/// detection, and management.

pub mod port_scanner;

// Re-export commonly used types
pub use port_scanner::{
    PortInfo, PortCategory, PortScanner, PortScannerError,
    categorize_port, get_app_color, get_friendly_name,
};
