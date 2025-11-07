/// Reverse proxy daemon for porter CLI
use crate::config::Config;
use crate::error::{PorterError, Result};
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Client, Request, Response, Server, StatusCode, Uri};
use log::{debug, error, info};
use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Arc;

const PROXY_PORT: u16 = 8080; // Use 8080 to avoid needing sudo

/// Start the reverse proxy daemon
pub async fn start_proxy(config: Arc<Config>) -> Result<()> {
    let addr = SocketAddr::from(([127, 0, 0, 1], PROXY_PORT));

    info!("Starting Porter reverse proxy on http://127.0.0.1:{}", PROXY_PORT);

    let make_svc = make_service_fn(move |_conn| {
        let config = Arc::clone(&config);
        async move {
            Ok::<_, Infallible>(service_fn(move |req| {
                handle_request(req, Arc::clone(&config))
            }))
        }
    });

    let server = Server::bind(&addr).serve(make_svc);

    println!("\n🚢 Porter proxy running on port {}", PROXY_PORT);
    println!("→ Access your services at http://<subdomain>.localhost:{}", PROXY_PORT);
    println!("→ Press Ctrl+C to stop\n");

    if let Err(e) = server.await {
        error!("Server error: {}", e);
        return Err(PorterError::Proxy(format!("Server failed: {}", e)));
    }

    Ok(())
}

async fn handle_request(
    req: Request<Body>,
    config: Arc<Config>,
) -> std::result::Result<Response<Body>, Infallible> {
    let host = req
        .headers()
        .get("host")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    debug!("Incoming request for host: {}", host);

    // Extract subdomain from host header
    let subdomain = extract_subdomain(host, config.base_domain.as_deref());

    match subdomain {
        Some(sub) => {
            // Look up port mapping
            if let Some(port) = config.mappings.get(&sub) {
                info!("Proxying {} -> localhost:{}", sub, port);
                match proxy_to_backend(req, *port).await {
                    Ok(response) => Ok(response),
                    Err(e) => {
                        error!("Proxy error for {}: {}", sub, e);
                        Ok(error_response(
                            StatusCode::BAD_GATEWAY,
                            &format!("Backend service not available on port {}", port),
                        ))
                    }
                }
            } else {
                info!("Subdomain not found: {}", sub);
                Ok(error_response(
                    StatusCode::NOT_FOUND,
                    &format!(
                        "Subdomain '{}' not mapped. Run: porter map {} <port>",
                        sub, sub
                    ),
                ))
            }
        }
        None => {
            // No valid subdomain
            Ok(landing_page_response(&config))
        }
    }
}

async fn proxy_to_backend(
    mut req: Request<Body>,
    port: u16,
) -> std::result::Result<Response<Body>, Box<dyn std::error::Error + Send + Sync>> {
    let client = Client::new();

    // Build the backend URL
    let path = req.uri().path();
    let query = req.uri().query().map(|q| format!("?{}", q)).unwrap_or_default();
    let backend_url = format!("http://127.0.0.1:{}{}{}", port, path, query);

    debug!("Forwarding to: {}", backend_url);

    // Update request URI
    *req.uri_mut() = backend_url.parse::<Uri>()?;

    // Forward request
    let response = client.request(req).await?;
    Ok(response)
}

fn extract_subdomain(host: &str, base_domain: Option<&str>) -> Option<String> {
    // Remove port if present
    let host = host.split(':').next().unwrap_or(host);

    let base = base_domain.unwrap_or("localhost");

    // Check if host ends with .base_domain
    if let Some(stripped) = host.strip_suffix(&format!(".{}", base)) {
        if !stripped.is_empty() && !stripped.contains('.') {
            return Some(stripped.to_string());
        }
    }

    // Check for exact match (base domain itself)
    if host == base {
        return None; // Landing page
    }

    None
}

fn error_response(status: StatusCode, message: &str) -> Response<Body> {
    let html = format!(
        r#"<!DOCTYPE html>
<html>
<head>
    <title>Porter - {}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            padding: 20px;
            text-align: center;
        }}
        h1 {{ color: #e74c3c; }}
        .code {{
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            margin: 20px 0;
        }}
    </style>
</head>
<body>
    <h1>⚓ {}</h1>
    <p>{}</p>
    <div class="code">porter map &lt;subdomain&gt; &lt;port&gt;</div>
    <p><a href="http://localhost:8080">← Back to Porter Dashboard</a></p>
</body>
</html>"#,
        status.as_u16(),
        status.as_u16(),
        message
    );

    Response::builder()
        .status(status)
        .header("Content-Type", "text/html; charset=utf-8")
        .body(Body::from(html))
        .unwrap()
}

fn landing_page_response(config: &Config) -> Response<Body> {
    let mut mappings_html = String::new();

    if config.mappings.is_empty() {
        mappings_html.push_str("<p>No subdomains configured yet.</p>");
        mappings_html.push_str(
            r#"<div class="code">porter map &lt;subdomain&gt; &lt;port&gt;</div>"#,
        );
    } else {
        mappings_html.push_str("<h2>Active Mappings</h2>");
        mappings_html.push_str(r#"<table style="margin: 20px auto;">"#);

        let mut sorted: Vec<_> = config.mappings.iter().collect();
        sorted.sort_by_key(|(k, _)| *k);

        for (subdomain, port) in sorted {
            let base = config.base_domain.as_deref().unwrap_or("localhost");
            mappings_html.push_str(&format!(
                r#"<tr>
                    <td style="padding: 10px;"><a href="http://{}.{}:8080">{}.{}</a></td>
                    <td style="padding: 10px;">→</td>
                    <td style="padding: 10px;">localhost:{}</td>
                </tr>"#,
                subdomain, base, subdomain, base, port
            ));
        }

        mappings_html.push_str("</table>");
    }

    let html = format!(
        r#"<!DOCTYPE html>
<html>
<head>
    <title>Porter - Port Authority</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }}
        h1 {{ font-size: 3em; margin: 20px 0; }}
        .subtitle {{ font-size: 1.2em; opacity: 0.9; }}
        .card {{
            background: rgba(255, 255, 255, 0.95);
            color: #333;
            border-radius: 10px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }}
        .code {{
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            margin: 20px 0;
        }}
        a {{ color: #667eea; text-decoration: none; font-weight: bold; }}
        a:hover {{ text-decoration: underline; }}
    </style>
</head>
<body>
    <h1>⚓ Porter</h1>
    <p class="subtitle">Your Local Development Port Authority</p>

    <div class="card">
        {}
    </div>

    <div class="card">
        <h3>Quick Commands</h3>
        <div class="code">porter map &lt;subdomain&gt; &lt;port&gt;</div>
        <div class="code">porter list</div>
        <div class="code">porter open &lt;subdomain&gt;</div>
    </div>
</body>
</html>"#,
        mappings_html
    );

    Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "text/html; charset=utf-8")
        .body(Body::from(html))
        .unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_subdomain() {
        assert_eq!(
            extract_subdomain("api.localhost", Some("localhost")),
            Some("api".to_string())
        );
        assert_eq!(
            extract_subdomain("api.localhost:8080", Some("localhost")),
            Some("api".to_string())
        );
        assert_eq!(extract_subdomain("localhost", Some("localhost")), None);
        assert_eq!(extract_subdomain("example.com", Some("localhost")), None);
    }
}
