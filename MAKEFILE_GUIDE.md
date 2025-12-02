# Using Port Authority with Makefile Applications

Port Authority works perfectly with Makefile-based applications! Here's a comprehensive guide.

## Quick Start

```bash
# 1. Allocate a port for your application
portauth allocate my-app --project myproject

# 2. Launch it using Make
portauth launch my-app --command "make run" --cwd /path/to/your/app

# 3. Check status
portauth ps my-app

# 4. View logs
portauth logs my-app
```

## Making Your Makefile Port Authority Compatible

### Option 1: Use PORT Environment Variable (Recommended)

Port Authority automatically sets `PORT` when launching services. Update your Makefile:

```makefile
# Set default port, but allow override from environment
PORT ?= 3000

.PHONY: run start dev

run:
	@echo "Starting on port $(PORT)..."
	./myapp --port $(PORT)

start:
	node server.js --port $(PORT)

dev:
	npm run dev -- --port $(PORT)
```

### Option 2: Read PORT from .env File

```makefile
# Load environment variables
include .env
export

run:
	@echo "Starting on port $$PORT..."
	./myapp
```

### Option 3: Direct Variable Passing

```makefile
run:
	./myapp --port $(PORT)

# When launching:
# portauth launch my-app --command "make run PORT=\$PORT"
```

## Complete Examples

### Example 1: Node.js Application

**Makefile:**
```makefile
PORT ?= 3000
NODE_ENV ?= development

.PHONY: install dev start build

install:
	npm install

dev:
	@echo "Starting dev server on port $(PORT)..."
	npm run dev -- --port $(PORT)

start:
	@echo "Starting production server on port $(PORT)..."
	NODE_ENV=$(NODE_ENV) node server.js

build:
	npm run build
```

**Launch:**
```bash
portauth allocate myapp-dev --project development
portauth launch myapp-dev \
  --command "make dev" \
  --cwd /home/user/myapp \
  --env "NODE_ENV=development"
```

### Example 2: Go Application

**Makefile:**
```makefile
PORT ?= 8080
BINARY_NAME := myserver

.PHONY: build run clean

build:
	go build -o $(BINARY_NAME) ./cmd/server

run: build
	@echo "Starting server on port $(PORT)..."
	./$(BINARY_NAME) -port $(PORT)

dev:
	go run ./cmd/server -port $(PORT)

clean:
	rm -f $(BINARY_NAME)
```

**Launch:**
```bash
portauth allocate go-server --project backend
portauth launch go-server \
  --command "make run" \
  --cwd /home/user/go-app \
  --auto-restart
```

### Example 3: Python Flask Application

**Makefile:**
```makefile
PORT ?= 5000
PYTHON := python3
VENV := venv

.PHONY: install run dev test

install:
	$(PYTHON) -m venv $(VENV)
	. $(VENV)/bin/activate && pip install -r requirements.txt

run:
	@echo "Starting Flask app on port $(PORT)..."
	. $(VENV)/bin/activate && flask run --port $(PORT)

dev:
	. $(VENV)/bin/activate && \
	FLASK_ENV=development flask run --port $(PORT) --reload

test:
	. $(VENV)/bin/activate && pytest
```

**Launch:**
```bash
portauth allocate flask-app --project api
portauth launch flask-app \
  --command "make run" \
  --cwd /home/user/flask-app \
  --env "FLASK_APP=app.py"
```

### Example 4: Rust Application

**Makefile:**
```makefile
PORT ?= 8000
CARGO := cargo

.PHONY: build run dev release

build:
	$(CARGO) build

run: build
	@echo "Starting on port $(PORT)..."
	PORT=$(PORT) $(CARGO) run

dev:
	PORT=$(PORT) $(CARGO) watch -x run

release:
	$(CARGO) build --release
```

**Launch:**
```bash
portauth allocate rust-api --project backend
portauth launch rust-api \
  --command "make run" \
  --cwd /home/user/rust-app
```

## Running from Any Directory

After installation, `portauth` is available globally:

```bash
# From anywhere:
cd /tmp
portauth ps

cd ~/projects/my-app
portauth launch my-app --command "make run"

cd ~
portauth logs my-app
```

## Best Practices

### 1. Use Specific Make Targets

Create dedicated targets for Port Authority:

```makefile
.PHONY: pa-run pa-dev pa-prod

# Port Authority compatible targets
pa-run:
	@echo "Port Authority: Starting on $(PORT)..."
	./app --port $(PORT) --log json

pa-dev:
	PORT=$(PORT) npm run dev

pa-prod:
	NODE_ENV=production PORT=$(PORT) node server.js
```

```bash
portauth launch my-app --command "make pa-run"
```

### 2. Add Health Check Target

```makefile
.PHONY: health

health:
	@curl -f http://localhost:$(PORT)/health || exit 1
```

### 3. Include Port in Help

```makefile
.PHONY: help

help:
	@echo "Makefile targets:"
	@echo "  make run PORT=<port>    - Start server"
	@echo "  make dev PORT=<port>    - Start dev server"
	@echo "  make build              - Build application"
	@echo ""
	@echo "With Port Authority:"
	@echo "  portauth launch my-app --command 'make run'"
```

### 4. Environment File Support

```makefile
# Load .env if it exists
ifneq (,$(wildcard .env))
	include .env
	export
endif

run:
	@echo "Starting with PORT=$(PORT)..."
	./app
```

## Common Patterns

### Multi-Service Makefiles

```makefile
PORT_API ?= 3000
PORT_WORKER ?= 3001
PORT_FRONTEND ?= 3002

.PHONY: api worker frontend all

api:
	cd api && PORT=$(PORT_API) npm start

worker:
	cd worker && PORT=$(PORT_WORKER) python worker.py

frontend:
	cd frontend && PORT=$(PORT_FRONTEND) npm start

all:
	make -j3 api worker frontend
```

**Register each service:**
```bash
portauth allocate api --project prod
portauth allocate worker --project prod
portauth allocate frontend --project prod

portauth launch api --command "make api" --cwd /path/to/monorepo
portauth launch worker --command "make worker" --cwd /path/to/monorepo
portauth launch frontend --command "make frontend" --cwd /path/to/monorepo
```

### Docker-based Makefiles

```makefile
PORT ?= 8080
IMAGE := myapp:latest

.PHONY: docker-build docker-run

docker-build:
	docker build -t $(IMAGE) .

docker-run:
	docker run -p $(PORT):8080 $(IMAGE)
```

## Troubleshooting

### PORT not being passed

Make sure to use `$(PORT)` in Makefile, not `$PORT`:

```makefile
# ✅ Correct
run:
	./app --port $(PORT)

# ❌ Wrong (shell variable, not Make variable)
run:
	./app --port $PORT
```

### Make target not found

Verify target exists:
```bash
make -n run  # Dry run to check
```

### Port not available

Check what Port Authority allocated:
```bash
portauth list | grep my-app
```

### Service starts but uses wrong port

Ensure your application actually reads the PORT:
```bash
# Test manually first
cd /path/to/app
PORT=9999 make run

# Check if it's listening on 9999
lsof -i :9999
```

## Integration Examples

### With Discovery

```bash
# Discover existing Makefile apps
portauth discover --start 3000 --end 9000

# Register them
portauth discover --register --project legacy
```

### With Auto-Restart

```bash
portauth launch critical-app \
  --command "make run" \
  --cwd /path/to/app \
  --auto-restart
```

### With Environment Variables

```bash
portauth launch my-app \
  --command "make prod" \
  --cwd /path/to/app \
  --env "NODE_ENV=production,DEBUG=false,API_KEY=secret"
```

---

**Now your Makefile applications have zero port conflicts!**
