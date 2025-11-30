#!/usr/bin/env node

/**
 * Port Authority - Centralized Port Management Service
 *
 * The single source of truth for port allocation across all projects.
 * Prevents port conflicts and unauthorized port usage.
 */

const express = require('express');
const cors = require('cors');
const { PortRegistry } = require('./registry');
const { AllocationEngine } = require('./engine');
const { Enforcer } = require('./enforcer');

// Sacred Geometry Constants
const PHI = 1.618033988749895;

// Port Authority runs on a well-known port
const PORT_AUTHORITY_PORT = process.env.PORT_AUTHORITY_PORT || 9999;

class PortAuthorityService {
    constructor() {
        this.app = express();
        this.registry = new PortRegistry();
        this.engine = new AllocationEngine(this.registry);
        this.enforcer = new Enforcer(this.registry);

        this.setupMiddleware();
        this.setupRoutes();
        this.setupEnforcement();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'port-authority',
                uptime: process.uptime(),
                allocations: this.registry.getAllAllocations().length
            });
        });

        // Allocate a port for a service
        this.app.post('/allocate', async (req, res) => {
            try {
                const { serviceName, preferredPort, priority, project } = req.body;

                if (!serviceName) {
                    return res.status(400).json({ error: 'serviceName is required' });
                }

                const allocation = await this.engine.allocate({
                    serviceName,
                    preferredPort,
                    priority: priority || 1,
                    project: project || 'default',
                    phiMultiplier: 1.0
                });

                res.json(allocation);
            } catch (error) {
                console.error('Allocation error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Release a port
        this.app.post('/release', (req, res) => {
            try {
                const { serviceName, port } = req.body;

                if (!serviceName && !port) {
                    return res.status(400).json({ error: 'serviceName or port is required' });
                }

                const released = this.registry.release(serviceName, port);
                res.json({ success: released });
            } catch (error) {
                console.error('Release error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Get all allocations
        this.app.get('/allocations', (req, res) => {
            const allocations = this.registry.getAllAllocations();
            res.json(allocations);
        });

        // Get allocation for specific service
        this.app.get('/allocations/:serviceName', (req, res) => {
            const allocation = this.registry.getByService(req.params.serviceName);
            if (allocation) {
                res.json(allocation);
            } else {
                res.status(404).json({ error: 'Service not found' });
            }
        });

        // Check if port is available
        this.app.get('/check/:port', (req, res) => {
            const port = parseInt(req.params.port);
            const isAvailable = this.registry.isPortAvailable(port);
            res.json({ port, available: isAvailable });
        });

        // Enforce - kill unauthorized processes
        this.app.post('/enforce', async (req, res) => {
            try {
                const violations = await this.enforcer.enforce();
                res.json({ violations, killed: violations.length });
            } catch (error) {
                console.error('Enforcement error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Get metrics
        this.app.get('/metrics', (req, res) => {
            const allocations = this.registry.getAllAllocations();
            const metrics = {
                totalAllocations: allocations.length,
                activeAllocations: allocations.filter(a => a.status === 'active').length,
                portRange: this.engine.getPortRange(),
                phiOptimized: allocations.filter(a => a.phiOptimized).length,
                byProject: {}
            };

            allocations.forEach(alloc => {
                metrics.byProject[alloc.project] = (metrics.byProject[alloc.project] || 0) + 1;
            });

            res.json(metrics);
        });
    }

    setupEnforcement() {
        // Periodic enforcement check (every 30 seconds)
        setInterval(async () => {
            try {
                const violations = await this.enforcer.detectViolations();
                if (violations.length > 0) {
                    console.warn(`⚠️  Detected ${violations.length} port violations`);
                    violations.forEach(v => {
                        console.warn(`   Port ${v.port}: Unauthorized process ${v.pid}`);
                    });
                }
            } catch (error) {
                console.error('Enforcement check error:', error);
            }
        }, 30000);
    }

    start() {
        this.app.listen(PORT_AUTHORITY_PORT, () => {
            console.log('╔════════════════════════════════════════════════════╗');
            console.log('║       PORT AUTHORITY SERVICE                       ║');
            console.log('║  Centralized Port Management - Zero Conflicts      ║');
            console.log('╚════════════════════════════════════════════════════╝');
            console.log('');
            console.log(`✅ Service running on port ${PORT_AUTHORITY_PORT}`);
            console.log(`✅ Registry initialized with ${this.registry.getAllAllocations().length} allocations`);
            console.log(`✅ Enforcement active`);
            console.log(`✅ φ-Based optimization enabled (φ = ${PHI})`);
            console.log('');
            console.log('API Endpoints:');
            console.log(`   POST   http://localhost:${PORT_AUTHORITY_PORT}/allocate`);
            console.log(`   POST   http://localhost:${PORT_AUTHORITY_PORT}/release`);
            console.log(`   GET    http://localhost:${PORT_AUTHORITY_PORT}/allocations`);
            console.log(`   POST   http://localhost:${PORT_AUTHORITY_PORT}/enforce`);
            console.log(`   GET    http://localhost:${PORT_AUTHORITY_PORT}/metrics`);
            console.log('');
        });

        // Graceful shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    shutdown() {
        console.log('\n🛑 Shutting down Port Authority...');
        this.registry.close();
        process.exit(0);
    }
}

// Start service if run directly
if (require.main === module) {
    const service = new PortAuthorityService();
    service.start();
}

module.exports = PortAuthorityService;
