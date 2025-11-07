# Porter Usage Examples

Real-world examples of using Porter for local development.

## Example 1: Microservices Architecture

```bash
# Set base domain
porter set base localhost

# Authentication service
porter map auth 4000

# User service
porter map users 4001

# Payment service
porter map payments 4002

# API Gateway
porter map gateway 8080

# Frontend application
porter map app 3000

# Admin dashboard
porter map admin 3001

# View all services
porter list
```

Now access your services:
- http://auth.localhost:4000
- http://users.localhost:4001
- http://payments.localhost:4002
- http://gateway.localhost:8080
- http://app.localhost:3000
- http://admin.localhost:3001

## Example 2: Full-Stack Project

```bash
# React frontend
porter map app 3000

# Node.js/Express backend
porter map api 8080

# PostgreSQL admin (pgAdmin)
porter map db 5050

# Redis Commander
porter map cache 8081

# Documentation site (Docusaurus/MkDocs)
porter map docs 3001
```

## Example 3: Multi-Tenant Development

```bash
# Client A environment
porter map client-a-app 3000
porter map client-a-api 8000

# Client B environment
porter map client-b-app 3001
porter map client-b-api 8001

# Shared services
porter map shared-auth 4000
porter map shared-storage 9000
```

## Example 4: API Versioning

```bash
# API version 1
porter map api-v1 8001

# API version 2
porter map api-v2 8002

# API version 3 (beta)
porter map api-v3-beta 8003

# API documentation
porter map api-docs 3000
```

## Example 5: Database UIs

```bash
# PostgreSQL - pgAdmin
porter map pgadmin 5050

# MongoDB - Mongo Express
porter map mongo-ui 8081

# Redis - Redis Commander
porter map redis-ui 8082

# MySQL - phpMyAdmin
porter map phpmyadmin 8083

# Elasticsearch - Kibana
porter map kibana 5601
```

## Example 6: Frontend Frameworks

```bash
# React development server
porter map react 3000

# Vue development server
porter map vue 8080

# Angular development server
porter map angular 4200

# Svelte development server
porter map svelte 5000

# Next.js development server
porter map nextjs 3000

# Storybook
porter map storybook 6006
```

## Example 7: DevOps Tools

```bash
# Jenkins
porter map jenkins 8080

# Grafana
porter map grafana 3000

# Prometheus
porter map prometheus 9090

# Jaeger (distributed tracing)
porter map jaeger 16686

# MinIO (S3-compatible storage)
porter map minio 9000
```

## Example 8: Testing Environments

```bash
# Development environment
porter map dev-app 3000
porter map dev-api 8000

# Staging environment
porter map staging-app 3001
porter map staging-api 8001

# QA environment
porter map qa-app 3002
porter map qa-api 8002
```

## Example 9: Quick Setup Script

Create a script to set up your entire development environment:

```bash
#!/bin/bash
# setup-dev-env.sh

echo "Setting up development environment..."

# Set base domain
porter set base localhost

# Core services
porter map app 3000
porter map api 8080
porter map admin 4000

# Databases and UIs
porter map postgres 5432
porter map pgadmin 5050
porter map redis 6379

# Monitoring
porter map grafana 3001

echo "Development environment ready!"
porter list
```

Make it executable and run:
```bash
chmod +x setup-dev-env.sh
./setup-dev-env.sh
```

## Example 10: Using with Docker Compose

Combine Porter with Docker Compose for a powerful development setup:

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    image: node:18
    ports:
      - "3000:3000"
    # Access via: http://app.localhost:3000

  backend:
    image: node:18
    ports:
      - "8080:8080"
    # Access via: http://api.localhost:8080

  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: password

  pgadmin:
    image: dpage/pgadmin4
    ports:
      - "5050:80"
    # Access via: http://pgadmin.localhost:5050
```

Set up with Porter:
```bash
porter map app 3000
porter map api 8080
porter map pgadmin 5050

docker-compose up
```

## Example 11: Team Collaboration

Share your Porter configuration with your team:

```bash
# Export current configuration
cat ~/.porter/config.toml > project-porter-config.toml

# Team members can set up the same mappings
porter set base localhost
porter map frontend 3000
porter map backend 8080
porter map database 5432
```

## Example 12: Cleanup and Reset

```bash
# Remove specific mappings
porter unmap old-service
porter unmap deprecated-api

# View remaining mappings
porter list

# Reset everything (with confirmation)
porter reset

# Reset without confirmation (dangerous!)
porter reset --yes
```

## Tips for Production-Like Setup

### Use Standard Ports for Services

```bash
# Web services: 3000-3999
porter map main-app 3000
porter map admin-app 3001

# API services: 8000-8999
porter map api-v1 8000
porter map api-v2 8001

# Internal services: 4000-4999
porter map auth-service 4000
porter map notification-service 4001

# Databases: 5000-5999
porter map postgres 5432
porter map redis 6379
```

### Document Your Setup

Create a PORTS.md file in your project:

```markdown
# Port Mappings

## Services
- app.localhost:3000 - Frontend application
- api.localhost:8080 - Backend API
- admin.localhost:4000 - Admin dashboard

## Databases
- postgres.localhost:5432 - PostgreSQL
- redis.localhost:6379 - Redis

## Tools
- grafana.localhost:3001 - Monitoring
```

### Integration with Environment Variables

```javascript
// config.js
module.exports = {
  apiUrl: process.env.API_URL || 'http://api.localhost:8080',
  appUrl: process.env.APP_URL || 'http://app.localhost:3000',
};
```

## Troubleshooting Examples

### Check Configuration
```bash
porter list
```

### Verify Hosts File (macOS/Linux)
```bash
cat /etc/hosts | grep porter
```

### Verbose Mode
```bash
porter --verbose map debug-service 9999
```

### Browser Cache Issues
```bash
# Clear browser cache or use private/incognito mode
# OR use a different port:
porter unmap api
porter map api 8081
```
