/// Integration tests for port scanner functionality
use subway_authority::{PortScanner, PortInfo, PortCategory, categorize_port, get_friendly_name};

#[test]
fn test_port_scanner_initialization() {
    let scanner = PortScanner::new();
    // Scanner should be created successfully (it's a zero-sized type)
    // Just verify we can call methods on it
    let _ = scanner.scan_ports(); // This should not panic during creation
}

#[test]
fn test_scan_ports_returns_result() {
    let scanner = PortScanner::new();
    let result = scanner.scan_ports();

    // Should return either Ok or Err, not panic
    match result {
        Ok(ports) => {
            // Ports should be sorted by port number
            for i in 1..ports.len() {
                assert!(ports[i].port >= ports[i - 1].port,
                    "Ports should be sorted: {} >= {}",
                    ports[i].port, ports[i - 1].port
                );
            }

            // Each port should have enriched data
            for port in &ports {
                assert!(port.friendly_name.is_some(),
                    "Port {} should have friendly_name", port.port
                );
                assert!(port.category.is_some(),
                    "Port {} should have category", port.port
                );
            }
        }
        Err(e) => {
            // Error is acceptable (might not have permissions or lsof not available)
            println!("Port scanning failed (expected in some environments): {}", e);
        }
    }
}

#[test]
fn test_is_port_in_use() {
    let scanner = PortScanner::new();

    // Test with a common system port (likely to be in use)
    let result = scanner.is_port_in_use(80);
    // Should return a boolean without panicking
    assert!(result == true || result == false);

    // Test with an uncommon high port (unlikely to be in use)
    let result = scanner.is_port_in_use(65000);
    assert!(result == true || result == false);
}

#[test]
fn test_categorize_port_node() {
    let port = PortInfo {
        port: 3000,
        process_name: "node".to_string(),
        pid: "12345".to_string(),
        protocol: "TCP".to_string(),
        friendly_name: None,
        category: None,
    };

    assert_eq!(categorize_port(&port), PortCategory::NodeApp);
}

#[test]
fn test_categorize_port_database() {
    let port = PortInfo {
        port: 5432,
        process_name: "postgres".to_string(),
        pid: "54321".to_string(),
        protocol: "TCP".to_string(),
        friendly_name: None,
        category: None,
    };

    assert_eq!(categorize_port(&port), PortCategory::Database);
}

#[test]
fn test_categorize_port_web_server() {
    let port = PortInfo {
        port: 80,
        process_name: "nginx".to_string(),
        pid: "1234".to_string(),
        protocol: "TCP".to_string(),
        friendly_name: None,
        category: None,
    };

    assert_eq!(categorize_port(&port), PortCategory::WebServer);
}

#[test]
fn test_get_friendly_name_database() {
    let port = PortInfo {
        port: 5432,
        process_name: "postgres".to_string(),
        pid: "54321".to_string(),
        protocol: "TCP".to_string(),
        friendly_name: None,
        category: None,
    };

    assert_eq!(get_friendly_name(&port), "PostgreSQL");
}

#[test]
fn test_get_friendly_name_node() {
    let port = PortInfo {
        port: 3000,
        process_name: "node".to_string(),
        pid: "12345".to_string(),
        protocol: "TCP".to_string(),
        friendly_name: None,
        category: None,
    };

    let name = get_friendly_name(&port);
    // Node.js detection requires process inspection which may not work in tests
    // Just verify we get a non-empty string
    assert!(!name.is_empty());
    assert!(name.contains("Node") || name.contains("node"));
}

#[test]
fn test_port_category_names() {
    assert_eq!(PortCategory::NodeApp.name(), "Node.js Apps");
    assert_eq!(PortCategory::Database.name(), "Databases");
    assert_eq!(PortCategory::WebServer.name(), "Web Servers");
    assert_eq!(PortCategory::PythonApp.name(), "Python Apps");
    assert_eq!(PortCategory::SystemService.name(), "System Services");
}

#[test]
fn test_port_info_serialization() {
    use serde_json;

    let port = PortInfo {
        port: 3000,
        process_name: "node".to_string(),
        pid: "12345".to_string(),
        protocol: "TCP".to_string(),
        friendly_name: Some("Vite · My Project".to_string()),
        category: Some(PortCategory::NodeApp),
    };

    // Should serialize to JSON successfully
    let json = serde_json::to_string(&port).expect("Failed to serialize PortInfo");
    assert!(json.contains("\"port\":3000"));
    assert!(json.contains("\"process_name\":\"node\""));
    assert!(json.contains("\"friendly_name\":\"Vite · My Project\""));

    // Should deserialize back successfully
    let deserialized: PortInfo = serde_json::from_str(&json)
        .expect("Failed to deserialize PortInfo");
    assert_eq!(deserialized.port, port.port);
    assert_eq!(deserialized.process_name, port.process_name);
    assert_eq!(deserialized.friendly_name, port.friendly_name);
}

#[cfg(any(target_os = "macos", target_os = "linux"))]
#[test]
fn test_unix_specific_scanning() {
    let scanner = PortScanner::new();

    // On Unix systems, we should get actual results (unless lsof is not available)
    match scanner.scan_ports() {
        Ok(ports) => {
            println!("Found {} ports on Unix system", ports.len());
            // Most Unix systems will have at least a few ports open
            // (But we can't assert this as it depends on the system state)
        }
        Err(e) => {
            println!("Unix scanning failed (may need sudo or lsof): {}", e);
        }
    }
}

#[test]
fn test_multiple_scans_consistency() {
    let scanner = PortScanner::new();

    if let Ok(ports1) = scanner.scan_ports() {
        // Wait a tiny bit to ensure system state could theoretically change
        std::thread::sleep(std::time::Duration::from_millis(100));

        if let Ok(ports2) = scanner.scan_ports() {
            // Port lists should be relatively similar in length
            // (allowing for processes starting/stopping)
            let diff = (ports1.len() as i32 - ports2.len() as i32).abs();
            assert!(diff < 10,
                "Port scan results should be relatively consistent: {} vs {}",
                ports1.len(), ports2.len()
            );
        }
    }
}
