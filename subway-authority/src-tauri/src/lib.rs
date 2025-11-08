// Subway Authority Library
// Shared types and utilities

pub mod system_tray;
pub mod notification_service;
pub mod services;

// Re-export commonly used types
pub use system_tray::{TrayState, SystemStatus, PortMenuItem};
pub use notification_service::{
    MTANotification, MTANotificationType, NotificationService,
};
pub use services::{
    PortInfo, PortCategory, PortScanner, PortScannerError,
    categorize_port, get_app_color, get_friendly_name,
};
