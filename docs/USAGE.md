# Port Authority Usage Guide

## Using the CLI

### Allocate a Port

```bash
# Basic allocation
portauth allocate my-service

# With preferred port
portauth allocate my-service --preferred 8080

# With priority and project
portauth allocate my-service --priority 5 --project production
```

Output:
```
✅ Port allocated successfully!

Service: my-service
Port: 8080
Project: production
φ-Optimized: ✓
```

### List All Allocations

```bash
portauth list

# Filter by project
portauth list --project production
```

### Check Port Availability

```bash
portauth check 8080
```

### Release a Port

```bash
portauth release my-service
```

### Enforce Port Authority

```bash
# Kill unauthorized processes
portauth enforce
```

### View Metrics

```bash
portauth metrics
```

## Using Node.js Client

### Basic Usage

```javascript
const { PortAuthorityClient } = require('portauth-client');

const client = new PortAuthorityClient({
    serviceName: 'my-service',
    project: 'my-project'
});

// Allocate a port
const allocation = await client.allocate();
console.log(`Allocated port: ${allocation.port}`);

// Start your server
app.listen(allocation.port, () => {
    console.log(`Server running on port ${allocation.port}`);
});
```

### Quick Helper

```javascript
const { getOrAllocatePort } = require('portauth-client');

// Get existing port or allocate new one
const port = await getOrAllocatePort('my-service', {
    preferredPort: 3000,
    project: 'production'
});

app.listen(port);
```

### Express.js Example

```javascript
const express = require('express');
const { getOrAllocatePort } = require('portauth-client');

const app = express();

// Your routes here
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Get port from Port Authority and start server
(async () => {
    const port = await getOrAllocatePort('my-express-app', {
        preferredPort: 3000
    });

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
})();
```

## Using Python Client

### Basic Usage

```python
from portauth import PortAuthorityClient

client = PortAuthorityClient(
    service_name='my-service',
    project='my-project'
)

# Allocate a port
allocation = client.allocate()
port = allocation['port']
print(f"Allocated port: {port}")
```

### Quick Helper

```python
from portauth import get_or_allocate_port

# Get existing port or allocate new one
port = get_or_allocate_port(
    'my-service',
    preferred_port=8000,
    priority=1
)
```

### FastAPI Example

```python
from fastapi import FastAPI
import uvicorn
from portauth import get_or_allocate_port

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

if __name__ == "__main__":
    # Get port from Port Authority
    port = get_or_allocate_port(
        'my-fastapi-app',
        preferred_port=8000
    )

    uvicorn.run(app, host="0.0.0.0", port=port)
```

### Flask Example

```python
from flask import Flask
from portauth import get_or_allocate_port

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello World!'

if __name__ == '__main__':
    # Get port from Port Authority
    port = get_or_allocate_port('my-flask-app', preferred_port=5000)

    app.run(host='0.0.0.0', port=port)
```

## REST API Usage

### Allocate a Port

```bash
curl -X POST http://localhost:9999/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "my-service",
    "preferredPort": 3000,
    "priority": 1,
    "project": "default"
  }'
```

Response:
```json
{
  "id": 1,
  "serviceName": "my-service",
  "port": 3000,
  "project": "default",
  "priority": 1,
  "phiOptimized": false,
  "status": "active",
  "allocatedAt": "2025-11-30T12:00:00.000Z",
  "metadata": {}
}
```

### Release a Port

```bash
curl -X POST http://localhost:9999/release \
  -H "Content-Type: application/json" \
  -d '{"serviceName": "my-service"}'
```

### Get All Allocations

```bash
curl http://localhost:9999/allocations
```

### Check Port Availability

```bash
curl http://localhost:9999/check/3000
```

## Best Practices

1. **Always use Port Authority** - Never hardcode ports
2. **Use meaningful service names** - Makes debugging easier
3. **Organize by project** - Use the project parameter
4. **Release ports when done** - Free up resources
5. **Run enforce periodically** - Keep the system clean

## Troubleshooting

### Port Authority not responding

```bash
# Check if service is running
portauth health

# Or check manually
curl http://localhost:9999/health

# If not running, start it
cd /home/alice/PortAuthority
npm start
```

### Port conflict despite using Port Authority

```bash
# Kill unauthorized processes
portauth enforce
```

### Service can't connect to Port Authority

Check environment variable:
```bash
echo $PORT_AUTHORITY_URL
# Should be: http://localhost:9999

# If not set:
export PORT_AUTHORITY_URL=http://localhost:9999
```
