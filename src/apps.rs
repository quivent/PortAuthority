/// App registry and configuration management for porter daemon
use crate::error::{PorterError, Result};
use log::{debug, info};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;

/// App configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// Unique app identifier
    pub name: String,

    /// Command to execute
    pub command: String,

    /// Working directory
    pub directory: String,

    /// Port for health checks
    pub port: u16,

    /// Environment variables
    #[serde(default)]
    pub env: HashMap<String, String>,

    /// Enable auto-restart
    #[serde(default = "default_auto_restart")]
    pub auto_restart: bool,

    /// Maximum restart attempts
    #[serde(default = "default_max_restarts")]
    pub max_restarts: u32,

    /// Health check interval (seconds)
    #[serde(default = "default_health_interval")]
    pub health_check_interval: u64,

    /// Optional HTTP health check path
    #[serde(default)]
    pub health_check_path: Option<String>,

    /// Health check type (tcp, http, websocket)
    #[serde(default = "default_health_check_type")]
    pub health_check_type: String,

    /// WebSocket-specific timeout (seconds)
    #[serde(default = "default_websocket_timeout")]
    pub websocket_timeout: u64,

    /// Groups this app belongs to
    #[serde(default)]
    pub groups: Vec<String>,
}

fn default_auto_restart() -> bool {
    true
}
fn default_max_restarts() -> u32 {
    5
}
fn default_health_interval() -> u64 {
    30
}
fn default_health_check_type() -> String {
    "tcp".to_string()
}
fn default_websocket_timeout() -> u64 {
    5
}

impl AppConfig {
    /// Create a new app configuration
    pub fn new(name: String, command: String, directory: String, port: u16) -> Self {
        Self {
            name,
            command,
            directory,
            port,
            env: HashMap::new(),
            auto_restart: default_auto_restart(),
            max_restarts: default_max_restarts(),
            health_check_interval: default_health_interval(),
            health_check_path: None,
            health_check_type: default_health_check_type(),
            websocket_timeout: default_websocket_timeout(),
            groups: Vec::new(),
        }
    }

    /// Add an environment variable
    pub fn with_env(mut self, key: String, value: String) -> Self {
        self.env.insert(key, value);
        self
    }

    /// Set auto-restart flag
    pub fn with_auto_restart(mut self, enabled: bool) -> Self {
        self.auto_restart = enabled;
        self
    }

    /// Set maximum restart attempts
    pub fn with_max_restarts(mut self, max: u32) -> Self {
        self.max_restarts = max;
        self
    }

    /// Set health check interval
    pub fn with_health_interval(mut self, seconds: u64) -> Self {
        self.health_check_interval = seconds;
        self
    }

    /// Set health check path
    pub fn with_health_path(mut self, path: String) -> Self {
        self.health_check_path = Some(path);
        self
    }
}

/// App registry for managing all apps
pub struct AppRegistry {
    apps: HashMap<String, AppConfig>,
}

impl AppRegistry {
    /// Create a new empty registry
    pub fn new() -> Self {
        Self {
            apps: HashMap::new(),
        }
    }

    /// Create registry from a list of app configurations
    pub fn from_configs(configs: Vec<AppConfig>) -> Result<Self> {
        let mut registry = Self::new();
        for config in configs {
            registry.add(config)?;
        }
        Ok(registry)
    }

    /// Add a new app to the registry
    pub fn add(&mut self, config: AppConfig) -> Result<()> {
        // Validate configuration
        Self::validate_config(&config)?;

        // Check for duplicates
        if self.apps.contains_key(&config.name) {
            return Err(PorterError::DuplicateApp(config.name.clone()));
        }

        debug!("Adding app to registry: {}", config.name);
        self.apps.insert(config.name.clone(), config);
        Ok(())
    }

    /// Remove an app from the registry
    pub fn remove(&mut self, name: &str) -> Result<AppConfig> {
        debug!("Removing app from registry: {}", name);
        self.apps
            .remove(name)
            .ok_or_else(|| PorterError::AppNotFound(name.to_string()))
    }

    /// Get an app configuration (immutable)
    pub fn get(&self, name: &str) -> Option<&AppConfig> {
        self.apps.get(name)
    }

    /// Get a mutable app configuration
    pub fn get_mut(&mut self, name: &str) -> Option<&mut AppConfig> {
        self.apps.get_mut(name)
    }

    /// List all apps
    pub fn list(&self) -> Vec<&AppConfig> {
        let mut apps: Vec<_> = self.apps.values().collect();
        apps.sort_by_key(|a| &a.name);
        apps
    }

    /// Check if an app exists
    pub fn contains(&self, name: &str) -> bool {
        self.apps.contains_key(name)
    }

    /// Get the number of registered apps
    pub fn len(&self) -> usize {
        self.apps.len()
    }

    /// Check if registry is empty
    pub fn is_empty(&self) -> bool {
        self.apps.is_empty()
    }

    /// Validate app configuration
    pub fn validate_config(config: &AppConfig) -> Result<()> {
        // Validate name
        if config.name.is_empty() {
            return Err(PorterError::InvalidAppConfig(
                "App name cannot be empty".into(),
            ));
        }

        if !config
            .name
            .chars()
            .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
        {
            return Err(PorterError::InvalidAppConfig(
                "App name must be alphanumeric with hyphens and underscores".into(),
            ));
        }

        // Validate command
        if config.command.is_empty() {
            return Err(PorterError::InvalidAppConfig(
                "Command cannot be empty".into(),
            ));
        }

        // Validate directory exists
        let dir_path = Path::new(&config.directory);
        if !dir_path.exists() {
            return Err(PorterError::InvalidAppConfig(format!(
                "Directory does not exist: {}",
                config.directory
            )));
        }

        if !dir_path.is_dir() {
            return Err(PorterError::InvalidAppConfig(format!(
                "Path is not a directory: {}",
                config.directory
            )));
        }

        // Validate port
        if config.port == 0 {
            return Err(PorterError::InvalidAppConfig("Port cannot be 0".into()));
        }

        // Validate health check interval
        if config.health_check_interval < 5 {
            return Err(PorterError::InvalidAppConfig(
                "Health check interval must be at least 5 seconds".into(),
            ));
        }

        // Validate max restarts
        if config.max_restarts > 100 {
            return Err(PorterError::InvalidAppConfig(
                "Maximum restart attempts cannot exceed 100".into(),
            ));
        }

        info!("App configuration validated: {}", config.name);
        Ok(())
    }

    /// Check for port conflicts within the registry
    pub fn check_port_conflict(&self, port: u16, exclude_name: Option<&str>) -> Option<String> {
        for (name, app) in &self.apps {
            if app.port == port && Some(name.as_str()) != exclude_name {
                return Some(name.clone());
            }
        }
        None
    }

    /// Get all apps using a specific port
    pub fn apps_on_port(&self, port: u16) -> Vec<&AppConfig> {
        self.apps
            .values()
            .filter(|app| app.port == port)
            .collect()
    }

    /// Convert to vector of configs (for serialization)
    pub fn to_vec(&self) -> Vec<AppConfig> {
        let mut apps: Vec<_> = self.apps.values().cloned().collect();
        apps.sort_by_key(|a| a.name.clone());
        apps
    }

    /// Get all apps in a group
    pub fn apps_in_group(&self, group: &str) -> Vec<&AppConfig> {
        self.apps
            .values()
            .filter(|app| app.groups.contains(&group.to_string()))
            .collect()
    }

    /// Get all unique groups
    pub fn list_groups(&self) -> Vec<String> {
        let mut groups = std::collections::HashSet::new();
        for app in self.apps.values() {
            for group in &app.groups {
                groups.insert(group.clone());
            }
        }
        let mut result: Vec<_> = groups.into_iter().collect();
        result.sort();
        result
    }

    /// Validate group name
    pub fn validate_group_name(name: &str) -> Result<()> {
        if name.is_empty() {
            return Err(PorterError::InvalidInput(
                "Group name cannot be empty".into(),
            ));
        }
        if !name.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
            return Err(PorterError::InvalidInput(
                "Group name must be alphanumeric with hyphens and underscores".into(),
            ));
        }
        Ok(())
    }
}

impl Default for AppRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn create_test_config(name: &str) -> AppConfig {
        AppConfig::new(
            name.to_string(),
            "echo hello".to_string(),
            env::temp_dir().to_string_lossy().to_string(),
            3000,
        )
    }

    #[test]
    fn test_app_config_creation() {
        let config = create_test_config("test-app");
        assert_eq!(config.name, "test-app");
        assert_eq!(config.port, 3000);
        assert!(config.auto_restart);
        assert_eq!(config.max_restarts, 5);
    }

    #[test]
    fn test_app_config_builders() {
        let config = AppConfig::new(
            "test".to_string(),
            "echo test".to_string(),
            "/tmp".to_string(),
            8080,
        )
        .with_env("KEY".to_string(), "value".to_string())
        .with_auto_restart(false)
        .with_max_restarts(10)
        .with_health_interval(60)
        .with_health_path("/health".to_string());

        assert_eq!(config.env.get("KEY"), Some(&"value".to_string()));
        assert!(!config.auto_restart);
        assert_eq!(config.max_restarts, 10);
        assert_eq!(config.health_check_interval, 60);
        assert_eq!(config.health_check_path, Some("/health".to_string()));
    }

    #[test]
    fn test_registry_add_remove() {
        let mut registry = AppRegistry::new();
        let config = create_test_config("app1");

        assert!(registry.add(config.clone()).is_ok());
        assert_eq!(registry.len(), 1);

        let removed = registry.remove("app1").unwrap();
        assert_eq!(removed.name, "app1");
        assert_eq!(registry.len(), 0);
    }

    #[test]
    fn test_duplicate_app() {
        let mut registry = AppRegistry::new();
        let config = create_test_config("app1");

        assert!(registry.add(config.clone()).is_ok());
        assert!(matches!(
            registry.add(config),
            Err(PorterError::DuplicateApp(_))
        ));
    }

    #[test]
    fn test_app_not_found() {
        let mut registry = AppRegistry::new();
        assert!(matches!(
            registry.remove("nonexistent"),
            Err(PorterError::AppNotFound(_))
        ));
    }

    #[test]
    fn test_validate_config() {
        let valid_config = create_test_config("valid-app");
        assert!(AppRegistry::validate_config(&valid_config).is_ok());

        // Empty name
        let mut invalid = valid_config.clone();
        invalid.name = String::new();
        assert!(AppRegistry::validate_config(&invalid).is_err());

        // Invalid name characters
        let mut invalid = valid_config.clone();
        invalid.name = "app.with.dots".to_string();
        assert!(AppRegistry::validate_config(&invalid).is_err());

        // Empty command
        let mut invalid = valid_config.clone();
        invalid.command = String::new();
        assert!(AppRegistry::validate_config(&invalid).is_err());

        // Invalid directory
        let mut invalid = valid_config.clone();
        invalid.directory = "/nonexistent/directory".to_string();
        assert!(AppRegistry::validate_config(&invalid).is_err());

        // Invalid port
        let mut invalid = valid_config.clone();
        invalid.port = 0;
        assert!(AppRegistry::validate_config(&invalid).is_err());
    }

    #[test]
    fn test_port_conflict_detection() {
        let mut registry = AppRegistry::new();

        let app1 = AppConfig::new("app1".to_string(), "cmd1".to_string(), "/tmp".to_string(), 3000);
        let app2 = AppConfig::new("app2".to_string(), "cmd2".to_string(), "/tmp".to_string(), 3000);

        registry.add(app1).unwrap();

        assert_eq!(
            registry.check_port_conflict(3000, None),
            Some("app1".to_string())
        );
        assert_eq!(registry.check_port_conflict(3000, Some("app1")), None);
        assert_eq!(registry.check_port_conflict(8080, None), None);

        // Should still detect conflict when adding app2
        assert_eq!(
            registry.check_port_conflict(3000, Some("app2")),
            Some("app1".to_string())
        );
    }

    #[test]
    fn test_list_sorting() {
        let mut registry = AppRegistry::new();

        registry.add(create_test_config("zebra")).unwrap();
        registry.add(create_test_config("alpha")).unwrap();
        registry.add(create_test_config("beta")).unwrap();

        let list = registry.list();
        assert_eq!(list.len(), 3);
        assert_eq!(list[0].name, "alpha");
        assert_eq!(list[1].name, "beta");
        assert_eq!(list[2].name, "zebra");
    }

    #[test]
    fn test_apps_on_port() {
        let mut registry = AppRegistry::new();

        let app1 = AppConfig::new(
            "app1".to_string(),
            "cmd1".to_string(),
            env::temp_dir().to_string_lossy().to_string(),
            3000,
        );
        let app2 = AppConfig::new(
            "app2".to_string(),
            "cmd2".to_string(),
            env::temp_dir().to_string_lossy().to_string(),
            3000,
        );
        let app3 = AppConfig::new(
            "app3".to_string(),
            "cmd3".to_string(),
            env::temp_dir().to_string_lossy().to_string(),
            8080,
        );

        registry.add(app1).unwrap();
        registry.add(app2).unwrap();
        registry.add(app3).unwrap();

        let on_3000 = registry.apps_on_port(3000);
        assert_eq!(on_3000.len(), 2);

        let on_8080 = registry.apps_on_port(8080);
        assert_eq!(on_8080.len(), 1);

        let on_9999 = registry.apps_on_port(9999);
        assert_eq!(on_9999.len(), 0);
    }

    #[test]
    fn test_from_configs() {
        let configs = vec![
            create_test_config("app1"),
            create_test_config("app2"),
            create_test_config("app3"),
        ];

        let registry = AppRegistry::from_configs(configs).unwrap();
        assert_eq!(registry.len(), 3);
        assert!(registry.contains("app1"));
        assert!(registry.contains("app2"));
        assert!(registry.contains("app3"));
    }
}
