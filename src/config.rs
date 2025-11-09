/// Configuration management for porter CLI
use crate::apps::AppConfig;
use crate::error::{PorterError, Result};
use log::{debug, info};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

/// Main configuration structure
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Config {
    /// Base domain for subdomain mappings (e.g., "localhost")
    pub base_domain: Option<String>,

    /// Map of subdomain to port (e.g., "api" -> 3000)
    #[serde(default)]
    pub mappings: HashMap<String, u16>,

    /// App configurations for daemon management
    #[serde(default)]
    pub apps: Vec<AppConfig>,
}

impl Config {
    /// Get the default config directory path (~/.porter)
    pub fn config_dir() -> Result<PathBuf> {
        let home = dirs::home_dir()
            .ok_or_else(|| PorterError::Config("Could not determine home directory".into()))?;
        Ok(home.join(".porter"))
    }

    /// Get the full config file path (~/.porter/config.toml)
    pub fn config_path() -> Result<PathBuf> {
        Ok(Self::config_dir()?.join("config.toml"))
    }

    /// Load configuration from file, or return default if file doesn't exist
    pub fn load() -> Result<Self> {
        let config_path = Self::config_path()?;

        if !config_path.exists() {
            debug!("Config file does not exist, returning default");
            return Ok(Config::default());
        }

        let contents = fs::read_to_string(&config_path)
            .map_err(|e| PorterError::Config(format!("Failed to read config: {}", e)))?;

        let config: Config = toml::from_str(&contents)?;
        info!("Loaded config from {:?}", config_path);
        Ok(config)
    }

    /// Save configuration to file
    pub fn save(&self) -> Result<()> {
        let config_dir = Self::config_dir()?;
        let config_path = Self::config_path()?;

        // Create config directory if it doesn't exist
        if !config_dir.exists() {
            fs::create_dir_all(&config_dir)
                .map_err(|e| PorterError::Config(format!("Failed to create config directory: {}", e)))?;
        }

        // Serialize to TOML
        let contents = toml::to_string_pretty(self)?;

        // Write to file
        fs::write(&config_path, contents)
            .map_err(|e| PorterError::Config(format!("Failed to write config: {}", e)))?;

        info!("Saved config to {:?}", config_path);
        Ok(())
    }

    /// Validate configuration
    pub fn validate(&self) -> Result<()> {
        // Check if base_domain is set when there are mappings
        if !self.mappings.is_empty() && self.base_domain.is_none() {
            return Err(PorterError::Config(
                "Base domain must be set before creating mappings".into()
            ));
        }

        // Validate domain format if set
        if let Some(ref domain) = self.base_domain {
            Self::validate_domain(domain)?;
        }

        // Validate subdomain names
        for subdomain in self.mappings.keys() {
            Self::validate_subdomain(subdomain)?;
        }

        // Validate ports
        for port in self.mappings.values() {
            Self::validate_port(*port)?;
        }

        // Validate app configurations
        self.validate_apps()?;

        Ok(())
    }

    /// Validate all app configurations
    fn validate_apps(&self) -> Result<()> {
        use crate::apps::AppRegistry;

        for app in &self.apps {
            AppRegistry::validate_config(app)?;
        }

        // Check for duplicate app names
        let mut seen = std::collections::HashSet::new();
        for app in &self.apps {
            if !seen.insert(&app.name) {
                return Err(PorterError::DuplicateApp(app.name.clone()));
            }
        }

        Ok(())
    }

    /// Set the base domain
    pub fn set_base_domain(&mut self, domain: String) -> Result<()> {
        Self::validate_domain(&domain)?;
        self.base_domain = Some(domain);
        Ok(())
    }

    /// Add or update a subdomain mapping
    pub fn add_mapping(&mut self, subdomain: String, port: u16) -> Result<()> {
        if self.base_domain.is_none() {
            return Err(PorterError::Config(
                "Base domain must be set before creating mappings".into()
            ));
        }

        Self::validate_subdomain(&subdomain)?;
        Self::validate_port(port)?;

        self.mappings.insert(subdomain, port);
        Ok(())
    }

    /// Remove a subdomain mapping
    pub fn remove_mapping(&mut self, subdomain: &str) -> Result<u16> {
        self.mappings
            .remove(subdomain)
            .ok_or_else(|| PorterError::MappingNotFound(subdomain.to_string()))
    }

    /// Get a mapping for a subdomain
    pub fn get_mapping(&self, subdomain: &str) -> Option<u16> {
        self.mappings.get(subdomain).copied()
    }

    /// Clear all configuration
    pub fn reset(&mut self) {
        self.base_domain = None;
        self.mappings.clear();
        self.apps.clear();
    }

    /// Add an app to configuration
    pub fn add_app(&mut self, app_config: AppConfig) -> Result<()> {
        use crate::apps::AppRegistry;

        // Validate
        AppRegistry::validate_config(&app_config)?;

        // Check for duplicates
        if self.apps.iter().any(|a| a.name == app_config.name) {
            return Err(PorterError::DuplicateApp(app_config.name));
        }

        self.apps.push(app_config);
        Ok(())
    }

    /// Remove an app from configuration
    pub fn remove_app(&mut self, name: &str) -> Result<AppConfig> {
        let index = self
            .apps
            .iter()
            .position(|a| a.name == name)
            .ok_or_else(|| PorterError::AppNotFound(name.to_string()))?;

        Ok(self.apps.remove(index))
    }

    /// Get app by name
    pub fn get_app(&self, name: &str) -> Option<&AppConfig> {
        self.apps.iter().find(|a| a.name == name)
    }

    /// Get mutable app by name
    pub fn get_app_mut(&mut self, name: &str) -> Option<&mut AppConfig> {
        self.apps.iter_mut().find(|a| a.name == name)
    }

    /// Get the full hostname for a subdomain
    pub fn get_hostname(&self, subdomain: &str) -> Result<String> {
        let base = self.base_domain.as_ref()
            .ok_or_else(|| PorterError::Config("Base domain not set".into()))?;
        Ok(format!("{}.{}", subdomain, base))
    }

    /// Validate domain format
    fn validate_domain(domain: &str) -> Result<()> {
        if domain.is_empty() {
            return Err(PorterError::InvalidInput("Domain cannot be empty".into()));
        }

        if domain.contains('/') || domain.contains('\\') {
            return Err(PorterError::InvalidInput(
                "Domain cannot contain path separators".into()
            ));
        }

        Ok(())
    }

    /// Validate subdomain format
    fn validate_subdomain(subdomain: &str) -> Result<()> {
        if subdomain.is_empty() {
            return Err(PorterError::InvalidInput("Subdomain cannot be empty".into()));
        }

        if subdomain.contains('.') {
            return Err(PorterError::InvalidInput(
                "Subdomain cannot contain dots (use only the subdomain part)".into()
            ));
        }

        if !subdomain.chars().all(|c| c.is_alphanumeric() || c == '-') {
            return Err(PorterError::InvalidInput(
                "Subdomain can only contain alphanumeric characters and hyphens".into()
            ));
        }

        Ok(())
    }

    /// Validate port number
    fn validate_port(port: u16) -> Result<()> {
        if port == 0 {
            return Err(PorterError::InvalidInput("Port cannot be 0".into()));
        }

        if port < 1024 {
            log::warn!("Port {} is in the privileged range (< 1024)", port);
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_domain() {
        assert!(Config::validate_domain("localhost").is_ok());
        assert!(Config::validate_domain("example.com").is_ok());
        assert!(Config::validate_domain("").is_err());
        assert!(Config::validate_domain("invalid/domain").is_err());
    }

    #[test]
    fn test_validate_subdomain() {
        assert!(Config::validate_subdomain("api").is_ok());
        assert!(Config::validate_subdomain("my-api").is_ok());
        assert!(Config::validate_subdomain("api123").is_ok());
        assert!(Config::validate_subdomain("").is_err());
        assert!(Config::validate_subdomain("api.v1").is_err());
        assert!(Config::validate_subdomain("api_v1").is_err());
    }

    #[test]
    fn test_validate_port() {
        assert!(Config::validate_port(3000).is_ok());
        assert!(Config::validate_port(8080).is_ok());
        assert!(Config::validate_port(0).is_err());
        assert!(Config::validate_port(1).is_ok()); // Warning but valid
    }

    #[test]
    fn test_add_mapping() {
        let mut config = Config::default();

        // Should fail without base domain
        assert!(config.add_mapping("api".into(), 3000).is_err());

        // Set base domain and try again
        config.set_base_domain("localhost".into()).unwrap();
        assert!(config.add_mapping("api".into(), 3000).is_ok());
        assert_eq!(config.get_mapping("api"), Some(3000));
    }

    #[test]
    fn test_remove_mapping() {
        let mut config = Config::default();
        config.set_base_domain("localhost".into()).unwrap();
        config.add_mapping("api".into(), 3000).unwrap();

        assert_eq!(config.remove_mapping("api").unwrap(), 3000);
        assert!(config.get_mapping("api").is_none());
        assert!(config.remove_mapping("api").is_err());
    }

    #[test]
    fn test_get_hostname() {
        let mut config = Config::default();
        assert!(config.get_hostname("api").is_err());

        config.set_base_domain("localhost".into()).unwrap();
        assert_eq!(config.get_hostname("api").unwrap(), "api.localhost");
    }
}
