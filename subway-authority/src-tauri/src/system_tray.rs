// System Tray Integration for Subway Authority
// NYC Port Authority themed system tray with quick actions

use tauri::{
    AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem, SystemTraySubmenu,
};
use std::sync::Arc;
use parking_lot::RwLock;

/// System tray state management
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TrayState {
    pub active_ports: usize,
    pub healthy_ports: usize,
    pub issues: usize,
    pub last_status: String,
}

impl Default for TrayState {
    fn default() -> Self {
        Self {
            active_ports: 0,
            healthy_ports: 0,
            issues: 0,
            last_status: "Initializing...".to_string(),
        }
    }
}

/// Build the system tray menu with NYC Port Authority theme
pub fn build_system_tray() -> SystemTray {
    let tray_menu = build_tray_menu();
    SystemTray::new().with_menu(tray_menu)
}

/// Construct the tray menu structure
fn build_tray_menu() -> SystemTrayMenu {
    // Quick Actions submenu
    let quick_actions = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("scan_ports", "🔍 Scan Ports"))
        .add_item(CustomMenuItem::new("view_map", "🗺️  View Subway Map"))
        .add_item(CustomMenuItem::new("open_control_tower", "🏢 Control Tower"));

    // Port Status submenu (dynamic)
    let port_status = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("refresh_status", "🔄 Refresh Status"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("status_placeholder", "Loading...").disabled());

    // Main menu
    SystemTrayMenu::new()
        .add_item(
            CustomMenuItem::new("status_header", "🚇 Subway Authority")
                .disabled()
        )
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_submenu(SystemTraySubmenu::new("Quick Actions", quick_actions))
        .add_submenu(SystemTraySubmenu::new("Port Status", port_status))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("settings", "⚙️  Settings"))
        .add_item(CustomMenuItem::new("help", "❓ Help"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("show_main", "🎯 Open Control Tower"))
        .add_item(CustomMenuItem::new("quit", "🚪 Exit"))
}

/// Handle system tray events
pub fn handle_system_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick {
            position: _,
            size: _,
            ..
        } => {
            // On left click, show the main window
            if let Some(window) = app.get_window("main") {
                if window.is_visible().unwrap_or(false) {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        }
        SystemTrayEvent::RightClick {
            position: _,
            size: _,
            ..
        } => {
            // Right click shows the menu (handled automatically by Tauri)
        }
        SystemTrayEvent::DoubleClick {
            position: _,
            size: _,
            ..
        } => {
            // Double click opens the control tower
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.emit("navigate", "/control-tower");
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => {
            handle_menu_click(app, &id);
        }
        _ => {}
    }
}

/// Handle menu item clicks
fn handle_menu_click(app: &AppHandle, menu_id: &str) {
    match menu_id {
        "scan_ports" => {
            // Trigger port scan
            if let Some(window) = app.get_window("main") {
                let _ = window.emit("action:scan-ports", ());
            }
        }
        "view_map" => {
            // Open subway map view
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.emit("navigate", "/subway-map");
            }
        }
        "open_control_tower" => {
            // Open control tower dashboard
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.emit("navigate", "/control-tower");
            }
        }
        "refresh_status" => {
            // Refresh port status
            if let Some(window) = app.get_window("main") {
                let _ = window.emit("action:refresh-status", ());
            }
        }
        "settings" => {
            // Open settings
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.emit("navigate", "/settings");
            }
        }
        "help" => {
            // Open help documentation
            let _ = open::that("https://github.com/yourusername/subway-authority/wiki");
        }
        "show_main" => {
            // Show main window
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        "quit" => {
            // Quit application
            std::process::exit(0);
        }
        _ => {}
    }
}

/// Update tray tooltip with current status
pub fn update_tray_tooltip(app: &AppHandle, state: &TrayState) {
    let tooltip = format!(
        "🚇 Subway Authority\n\
        Active Ports: {}\n\
        Healthy: {} | Issues: {}\n\
        Status: {}",
        state.active_ports, state.healthy_ports, state.issues, state.last_status
    );

    // Note: Tauri 1.x system tray menu items are not directly mutable after creation
    // We can only update the tooltip on the tray handle itself
    // For dynamic menu updates, consider rebuilding the entire menu or upgrading to Tauri 2.x

    // Update the system tray tooltip
    let _ = app.tray_handle().set_tooltip(&tooltip);
}

/// Update tray icon based on system status
pub fn update_tray_icon(app: &AppHandle, status: SystemStatus) {
    let icon_name = match status {
        SystemStatus::Healthy => "tray-icon-green",
        SystemStatus::Warning => "tray-icon-yellow",
        SystemStatus::Error => "tray-icon-red",
        SystemStatus::Inactive => "tray-icon-gray",
    };

    // Update icon (requires icon assets to be available)
    // let icon = include_bytes!(format!("../icons/{}.png", icon_name));
    // let _ = app.tray_handle().set_icon(tauri::Icon::Raw(icon.to_vec()));
}

/// System health status indicator
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SystemStatus {
    Healthy,   // All services running smoothly
    Warning,   // Some issues detected
    Error,     // Critical problems
    Inactive,  // No active services
}

/// Update dynamic port status in tray menu
pub fn update_port_status_menu(app: &AppHandle, ports: Vec<PortMenuItem>) {
    // Build new port status submenu
    let mut port_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("refresh_status", "🔄 Refresh Status"))
        .add_native_item(SystemTrayMenuItem::Separator);

    if ports.is_empty() {
        port_menu = port_menu.add_item(
            CustomMenuItem::new("no_ports", "No active ports")
                .disabled()
        );
    } else {
        for port in ports.iter().take(10) {  // Limit to 10 most recent
            let label = format!("{} Port {} - {}", port.status_emoji, port.port, port.name);
            port_menu = port_menu.add_item(
                CustomMenuItem::new(
                    format!("port_{}", port.port),
                    label
                )
            );
        }

        if ports.len() > 10 {
            port_menu = port_menu.add_item(
                CustomMenuItem::new("more_ports", format!("... and {} more", ports.len() - 10))
                    .disabled()
            );
        }
    }

    // Update the tray menu (Note: Tauri 1.x has limitations on dynamic menu updates)
    // For full dynamic updates, consider Tauri 2.x or rebuild entire menu
}

/// Port menu item representation
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PortMenuItem {
    pub port: u16,
    pub name: String,
    pub status_emoji: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tray_state_default() {
        let state = TrayState::default();
        assert_eq!(state.active_ports, 0);
        assert_eq!(state.healthy_ports, 0);
        assert_eq!(state.issues, 0);
        assert_eq!(state.last_status, "Initializing...");
    }

    #[test]
    fn test_system_status() {
        assert_eq!(SystemStatus::Healthy, SystemStatus::Healthy);
        assert_ne!(SystemStatus::Healthy, SystemStatus::Warning);
    }

    #[test]
    fn test_port_menu_item() {
        let item = PortMenuItem {
            port: 3000,
            name: "api-server".to_string(),
            status_emoji: "✅".to_string(),
        };
        assert_eq!(item.port, 3000);
        assert_eq!(item.name, "api-server");
    }
}
