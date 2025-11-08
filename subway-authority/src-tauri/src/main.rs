// Subway Authority - Main Tauri Application
// NYC Port Authority themed desktop application for port management

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod system_tray;
mod notification_service;
mod services;

use system_tray::{build_system_tray, handle_system_tray_event, TrayState};
use notification_service::{
    show_mta_notification, notify_port_conflict, notify_service_down, notify_all_healthy,
    MTANotificationType, NotificationService,
};
use services::{PortScanner, PortInfo, PortCategory};
use tauri::{Manager, State, Window};
use std::sync::Arc;
use parking_lot::RwLock;

/// Application state
struct AppState {
    tray_state: Arc<RwLock<TrayState>>,
}

/// Tauri command to update tray tooltip
#[tauri::command]
async fn update_tray_tooltip(
    app: tauri::AppHandle,
    state: TrayState,
) -> Result<(), String> {
    system_tray::update_tray_tooltip(&app, &state);
    Ok(())
}

/// Tauri command to update tray icon
#[tauri::command]
async fn update_tray_icon(
    app: tauri::AppHandle,
    status: system_tray::SystemStatus,
) -> Result<(), String> {
    system_tray::update_tray_icon(&app, status);
    Ok(())
}

/// Tauri command to update port status menu
#[tauri::command]
async fn update_port_status_menu(
    app: tauri::AppHandle,
    ports: Vec<system_tray::PortMenuItem>,
) -> Result<(), String> {
    system_tray::update_port_status_menu(&app, ports);
    Ok(())
}

/// Scan for active ports on the system
#[tauri::command]
async fn scan_active_ports() -> Result<Vec<PortInfo>, String> {
    let scanner = PortScanner::new();
    scanner.scan_ports()
        .map_err(|e| format!("Failed to scan ports: {}", e))
}

/// Check if a specific port is in use
#[tauri::command]
async fn is_port_in_use(port: u16) -> Result<bool, String> {
    let scanner = PortScanner::new();
    Ok(scanner.is_port_in_use(port))
}

/// Get categorized ports grouped by application type
#[tauri::command]
async fn get_categorized_ports() -> Result<std::collections::HashMap<String, Vec<PortInfo>>, String> {
    use std::collections::HashMap;

    let scanner = PortScanner::new();
    let ports = scanner.scan_ports()
        .map_err(|e| format!("Failed to scan ports: {}", e))?;

    let mut categorized: HashMap<String, Vec<PortInfo>> = HashMap::new();

    for port in ports {
        let category_name = port.category
            .as_ref()
            .map(|c| c.name())
            .unwrap_or("Other")
            .to_string();

        categorized.entry(category_name)
            .or_insert_with(Vec::new)
            .push(port);
    }

    Ok(categorized)
}

fn main() {
    // Initialize logging
    env_logger::init();

    // Build system tray
    let tray = build_system_tray();

    // Build Tauri application
    tauri::Builder::default()
        .system_tray(tray)
        .on_system_tray_event(handle_system_tray_event)
        .setup(|app| {
            // Initialize application state
            let app_state = AppState {
                tray_state: Arc::new(RwLock::new(TrayState::default())),
            };
            app.manage(app_state);

            // Setup window
            let window = app.get_window("main").unwrap();

            // Hide window on close (minimize to tray)
            #[cfg(target_os = "macos")]
            {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        // Prevent window close, hide instead
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }

            // Show welcome notification
            let app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                let service = NotificationService::new(app_handle.clone());
                let _ = service.show_simple(
                    MTANotificationType::GoodService,
                    "🚇 Subway Authority Started",
                    "Port management system is now running. Access quick actions from the system tray.",
                ).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // System tray commands
            update_tray_tooltip,
            update_tray_icon,
            update_port_status_menu,
            // Notification commands
            show_mta_notification,
            notify_port_conflict,
            notify_service_down,
            notify_all_healthy,
            // Port management commands
            scan_active_ports,
            is_port_in_use,
            get_categorized_ports,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
