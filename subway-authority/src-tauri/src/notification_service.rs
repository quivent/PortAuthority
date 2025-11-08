// MTA-Style Notification Service
// Desktop notifications with NYC Transit Authority branding

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use std::time::{Duration, SystemTime};

/// MTA-style notification types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MTANotificationType {
    ServiceAlert,    // Port issues, conflicts
    PlannedWork,     // Configuration changes
    GoodService,     // Healthy status
    ServiceChange,   // Port status changes
    Emergency,       // Critical system issues
}

impl MTANotificationType {
    /// Get the emoji indicator for this notification type
    pub fn emoji(&self) -> &str {
        match self {
            MTANotificationType::ServiceAlert => "⚠️",
            MTANotificationType::PlannedWork => "🔧",
            MTANotificationType::GoodService => "✅",
            MTANotificationType::ServiceChange => "🚇",
            MTANotificationType::Emergency => "🚫",
        }
    }

    /// Get the train line emoji for visual consistency
    pub fn train_emoji(&self) -> &str {
        match self {
            MTANotificationType::ServiceAlert => "🚈",
            MTANotificationType::PlannedWork => "🚊",
            MTANotificationType::GoodService => "🚇",
            MTANotificationType::ServiceChange => "🚇",
            MTANotificationType::Emergency => "🚨",
        }
    }

    /// Get the notification priority level
    pub fn priority(&self) -> NotificationPriority {
        match self {
            MTANotificationType::Emergency => NotificationPriority::Critical,
            MTANotificationType::ServiceAlert => NotificationPriority::High,
            MTANotificationType::ServiceChange => NotificationPriority::Medium,
            MTANotificationType::PlannedWork => NotificationPriority::Low,
            MTANotificationType::GoodService => NotificationPriority::Info,
        }
    }
}

/// Notification priority levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum NotificationPriority {
    Info = 0,
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
}

/// MTA-style notification payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MTANotification {
    pub id: String,
    pub notification_type: MTANotificationType,
    pub title: String,
    pub message: String,
    pub port: Option<u16>,
    pub service_name: Option<String>,
    pub timestamp: u64,
    pub dismissible: bool,
    pub actions: Vec<NotificationAction>,
}

/// Notification action button
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationAction {
    pub id: String,
    pub label: String,
    pub action_type: ActionType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    ViewDetails,
    OpenPort,
    FixIssue,
    Dismiss,
    OpenSettings,
}

impl MTANotification {
    /// Create a new MTA-style notification
    pub fn new(
        notification_type: MTANotificationType,
        title: String,
        message: String,
    ) -> Self {
        let timestamp = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or(Duration::from_secs(0))
            .as_secs();

        Self {
            id: format!("mta_{}", timestamp),
            notification_type,
            title,
            message,
            port: None,
            service_name: None,
            timestamp,
            dismissible: true,
            actions: Vec::new(),
        }
    }

    /// Create a port conflict notification
    pub fn port_conflict(port: u16, service_name: &str) -> Self {
        let mut notification = Self::new(
            MTANotificationType::ServiceAlert,
            format!("⚠️ SERVICE CHANGE - Port {} Conflict", port),
            format!(
                "Port {} conflict detected on {}. \
                Another service may be using this port. \
                Check the Control Tower for details.",
                port, service_name
            ),
        );
        notification.port = Some(port);
        notification.service_name = Some(service_name.to_string());
        notification.actions = vec![
            NotificationAction {
                id: "view_details".to_string(),
                label: "View Details".to_string(),
                action_type: ActionType::ViewDetails,
            },
            NotificationAction {
                id: "fix_issue".to_string(),
                label: "Fix Issue".to_string(),
                action_type: ActionType::FixIssue,
            },
        ];
        notification
    }

    /// Create a service down notification
    pub fn service_down(port: u16, service_name: &str) -> Self {
        let mut notification = Self::new(
            MTANotificationType::Emergency,
            format!("🚫 DELAYS - Service Stopped on Port {}", port),
            format!(
                "Application '{}' has stopped on port {}. \
                Service is currently unavailable.",
                service_name, port
            ),
        );
        notification.port = Some(port);
        notification.service_name = Some(service_name.to_string());
        notification.actions = vec![
            NotificationAction {
                id: "view_details".to_string(),
                label: "View Details".to_string(),
                action_type: ActionType::ViewDetails,
            },
            NotificationAction {
                id: "open_port".to_string(),
                label: "Open Port".to_string(),
                action_type: ActionType::OpenPort,
            },
        ];
        notification
    }

    /// Create a healthy service notification
    pub fn service_healthy(total_ports: usize) -> Self {
        Self::new(
            MTANotificationType::GoodService,
            "✅ GOOD SERVICE - All Ports Running Smoothly".to_string(),
            format!(
                "All {} active ports are healthy and accessible. \
                No delays or service changes at this time.",
                total_ports
            ),
        )
    }

    /// Create a configuration change notification
    pub fn config_changed(description: &str) -> Self {
        Self::new(
            MTANotificationType::PlannedWork,
            "🔧 PLANNED WORK - Configuration Updated".to_string(),
            format!("Configuration change: {}. Changes take effect immediately.", description),
        )
    }

    /// Create a new mapping notification
    pub fn mapping_created(subdomain: &str, port: u16) -> Self {
        let mut notification = Self::new(
            MTANotificationType::ServiceChange,
            format!("🚇 SERVICE CHANGE - New Route Created"),
            format!(
                "New subdomain mapping created: {}.localhost → Port {}. \
                Service is now accessible.",
                subdomain, port
            ),
        );
        notification.port = Some(port);
        notification.service_name = Some(subdomain.to_string());
        notification
    }

    /// Format as MTA-style announcement
    pub fn format_mta_style(&self) -> String {
        format!(
            "{} {}\n\n{}\n\n{} Train Line {}",
            self.notification_type.emoji(),
            self.title,
            self.message,
            self.notification_type.train_emoji(),
            self.format_service_line()
        )
    }

    fn format_service_line(&self) -> String {
        if let Some(port) = self.port {
            if let Some(ref service) = self.service_name {
                format!("{} (Port {})", service, port)
            } else {
                format!("Port {}", port)
            }
        } else {
            "System".to_string()
        }
    }
}

/// Notification service manager
pub struct NotificationService {
    app_handle: AppHandle,
}

impl NotificationService {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    /// Show a desktop notification
    pub async fn show(&self, notification: &MTANotification) -> Result<(), String> {
        // Send native OS notification
        self.show_native_notification(notification).await?;

        // Emit event to frontend for in-app notification
        self.app_handle
            .emit_all("notification:new", notification)
            .map_err(|e| format!("Failed to emit notification event: {}", e))?;

        Ok(())
    }

    /// Show native desktop notification
    async fn show_native_notification(&self, notification: &MTANotification) -> Result<(), String> {
        #[cfg(target_os = "macos")]
        {
            use notify_rust::{Notification, Timeout};

            let mut n = Notification::new();
            n.appname("Subway Authority")
                .summary(&notification.title)
                .body(&notification.message)
                .timeout(Timeout::Milliseconds(5000));

            // Note: urgency method not available in notify-rust 4.x
            // Priority is conveyed through the message title and content

            n.show()
                .map_err(|e| format!("Failed to show notification: {}", e))?;
        }

        #[cfg(target_os = "windows")]
        {
            use notify_rust::Notification;

            Notification::new()
                .appname("Subway Authority")
                .summary(&notification.title)
                .body(&notification.message)
                .show()
                .map_err(|e| format!("Failed to show notification: {}", e))?;
        }

        #[cfg(target_os = "linux")]
        {
            use notify_rust::{Notification, Timeout};

            Notification::new()
                .appname("Subway Authority")
                .summary(&notification.title)
                .body(&notification.message)
                .timeout(Timeout::Milliseconds(5000))
                .show()
                .map_err(|e| format!("Failed to show notification: {}", e))?;
        }

        Ok(())
    }

    /// Show a simple notification with just title and message
    pub async fn show_simple(
        &self,
        notification_type: MTANotificationType,
        title: &str,
        message: &str,
    ) -> Result<(), String> {
        let notification = MTANotification::new(
            notification_type,
            title.to_string(),
            message.to_string(),
        );
        self.show(&notification).await
    }

    /// Play MTA-style sound effect (optional)
    pub async fn play_notification_sound(&self, notification_type: &MTANotificationType) {
        // Sound effects would be implemented here
        // Could use rodio or system audio APIs
        let sound_file = match notification_type {
            MTANotificationType::ServiceAlert => "alert.mp3",
            MTANotificationType::PlannedWork => "announcement.mp3",
            MTANotificationType::GoodService => "chime.mp3",
            MTANotificationType::ServiceChange => "door-chime.mp3",
            MTANotificationType::Emergency => "emergency.mp3",
        };

        // TODO: Implement audio playback with rodio
        log::debug!("Playing notification sound: {}", sound_file);
    }
}

/// Tauri command to show notification from frontend
#[tauri::command]
pub async fn show_mta_notification(
    app: AppHandle,
    notification_type: MTANotificationType,
    title: String,
    message: String,
) -> Result<(), String> {
    let service = NotificationService::new(app);
    service.show_simple(notification_type, &title, &message).await
}

/// Tauri command to show port conflict notification
#[tauri::command]
pub async fn notify_port_conflict(
    app: AppHandle,
    port: u16,
    service_name: String,
) -> Result<(), String> {
    let service = NotificationService::new(app);
    let notification = MTANotification::port_conflict(port, &service_name);
    service.show(&notification).await
}

/// Tauri command to show service down notification
#[tauri::command]
pub async fn notify_service_down(
    app: AppHandle,
    port: u16,
    service_name: String,
) -> Result<(), String> {
    let service = NotificationService::new(app);
    let notification = MTANotification::service_down(port, &service_name);
    service.show(&notification).await
}

/// Tauri command to show all services healthy notification
#[tauri::command]
pub async fn notify_all_healthy(
    app: AppHandle,
    total_ports: usize,
) -> Result<(), String> {
    let service = NotificationService::new(app);
    let notification = MTANotification::service_healthy(total_ports);
    service.show(&notification).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_notification_type_emoji() {
        assert_eq!(MTANotificationType::ServiceAlert.emoji(), "⚠️");
        assert_eq!(MTANotificationType::GoodService.emoji(), "✅");
        assert_eq!(MTANotificationType::Emergency.emoji(), "🚫");
    }

    #[test]
    fn test_notification_priority() {
        assert!(NotificationPriority::Critical > NotificationPriority::High);
        assert!(NotificationPriority::High > NotificationPriority::Low);
        assert!(NotificationPriority::Low > NotificationPriority::Info);
    }

    #[test]
    fn test_port_conflict_notification() {
        let notification = MTANotification::port_conflict(3000, "api-server");
        assert_eq!(notification.notification_type, MTANotificationType::ServiceAlert);
        assert_eq!(notification.port, Some(3000));
        assert_eq!(notification.service_name, Some("api-server".to_string()));
        assert!(notification.title.contains("SERVICE CHANGE"));
        assert_eq!(notification.actions.len(), 2);
    }

    #[test]
    fn test_service_down_notification() {
        let notification = MTANotification::service_down(8080, "web-app");
        assert_eq!(notification.notification_type, MTANotificationType::Emergency);
        assert_eq!(notification.port, Some(8080));
        assert!(notification.title.contains("DELAYS"));
    }

    #[test]
    fn test_service_healthy_notification() {
        let notification = MTANotification::service_healthy(5);
        assert_eq!(notification.notification_type, MTANotificationType::GoodService);
        assert!(notification.title.contains("GOOD SERVICE"));
    }

    #[test]
    fn test_mta_style_formatting() {
        let notification = MTANotification::port_conflict(3000, "api");
        let formatted = notification.format_mta_style();
        assert!(formatted.contains("⚠️"));
        assert!(formatted.contains("SERVICE CHANGE"));
        assert!(formatted.contains("🚈"));
    }
}
