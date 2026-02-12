#!/usr/bin/env node

/**
 * Port Authority - Centralized Port Management Service
 *
 * The single source of truth for port allocation across all projects.
 * Prevents port conflicts and unauthorized port usage.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const { PortRegistry } = require('./registry');
const { AllocationEngine } = require('./engine');
const { Enforcer } = require('./enforcer');
const { Launcher } = require('./launcher');
const { DomainManager } = require('./domains');

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
        this.launcher = new Launcher(this.registry);
        this.domainManager = new DomainManager();

        this.setupMiddleware();
        this.setupRoutes();
        this.setupEnforcement();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));

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

        // Discover all services
        this.app.get('/discover', async (req, res) => {
            try {
                const portRangeStart = parseInt(req.query.start) || 1000;
                const portRangeEnd = parseInt(req.query.end) || 65535;
                const includeRegistered = req.query.includeRegistered === 'true';

                const services = await this.enforcer.discoverAllServices({
                    portRangeStart,
                    portRangeEnd,
                    includeRegistered
                });

                res.json({ services, count: services.length });
            } catch (error) {
                console.error('Discovery error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Force register a single service
        this.app.post('/discover/register/:port', async (req, res) => {
            try {
                const port = parseInt(req.params.port);
                const { kill, serviceName, project } = req.body;

                const result = await this.enforcer.forceRegister(port, {
                    kill: kill || false,
                    serviceName,
                    project
                });

                res.json(result);
            } catch (error) {
                console.error('Force register error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Batch force register all discovered services
        this.app.post('/discover/register-all', async (req, res) => {
            try {
                const { portRangeStart, portRangeEnd, kill, project } = req.body;

                const results = await this.enforcer.batchForceRegister({
                    portRangeStart,
                    portRangeEnd,
                    kill: kill || false,
                    project
                });

                res.json({
                    results,
                    total: results.length,
                    succeeded: results.filter(r => r.status === 'registered').length,
                    failed: results.filter(r => r.status === 'failed').length,
                    alreadyRegistered: results.filter(r => r.status === 'already-registered').length
                });
            } catch (error) {
                console.error('Batch register error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // LAUNCHER ENDPOINTS

        // Launch a service
        this.app.post('/launcher/launch/:serviceName', async (req, res) => {
            try {
                const { serviceName } = req.params;
                const { command, cwd, env, autoRestart, captureOutput } = req.body;

                if (!command) {
                    return res.status(400).json({ error: 'command is required' });
                }

                const result = await this.launcher.launch(serviceName, {
                    command,
                    cwd,
                    env,
                    autoRestart,
                    captureOutput
                });

                res.json(result);
            } catch (error) {
                console.error('Launch error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Stop a service
        this.app.post('/launcher/stop/:serviceName', async (req, res) => {
            try {
                const { serviceName } = req.params;
                const { force } = req.body;

                const result = await this.launcher.stop(serviceName, { force });
                res.json(result);
            } catch (error) {
                console.error('Stop error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Restart a service
        this.app.post('/launcher/restart/:serviceName', async (req, res) => {
            try {
                const { serviceName } = req.params;
                const result = await this.launcher.restart(serviceName);
                res.json(result);
            } catch (error) {
                console.error('Restart error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Get service status
        this.app.get('/launcher/status/:serviceName', async (req, res) => {
            try {
                const { serviceName } = req.params;
                const status = await this.launcher.status(serviceName);
                res.json(status);
            } catch (error) {
                console.error('Status error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Get all service statuses
        this.app.get('/launcher/status', async (req, res) => {
            try {
                const runningOnly = req.query.runningOnly === 'true';
                const statuses = await this.launcher.statusAll({ runningOnly });
                res.json({ services: statuses, count: statuses.length });
            } catch (error) {
                console.error('Status all error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Get service logs
        this.app.get('/launcher/logs/:serviceName', (req, res) => {
            try {
                const { serviceName } = req.params;
                const lines = parseInt(req.query.lines) || 50;
                const logs = this.launcher.getLogs(serviceName, { lines });
                res.json(logs);
            } catch (error) {
                console.error('Logs error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // DOMAIN MANAGEMENT ENDPOINTS

        // Get all domains
        this.app.get('/domains', (req, res) => {
            try {
                const domains = this.domainManager.getAllDomains();
                res.json(domains);
            } catch (error) {
                console.error('Domains list error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Get domain by name
        this.app.get('/domains/:domain', (req, res) => {
            try {
                const domain = this.domainManager.getDomain(req.params.domain);
                if (domain) {
                    res.json(domain);
                } else {
                    res.status(404).json({ error: 'Domain not found' });
                }
            } catch (error) {
                console.error('Domain get error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Add domain mapping
        this.app.post('/domains', (req, res) => {
            try {
                const { domain, serviceName, ssl, certPath, keyPath, proxyType, customConfig } = req.body;

                if (!domain || !serviceName) {
                    return res.status(400).json({ error: 'domain and serviceName are required' });
                }

                // Verify service exists
                const service = this.registry.getByService(serviceName);
                if (!service) {
                    return res.status(404).json({ error: `Service '${serviceName}' not found` });
                }

                const mapping = this.domainManager.addDomain(domain, serviceName, {
                    ssl,
                    certPath,
                    keyPath,
                    proxyType,
                    customConfig
                });

                res.json(mapping);
            } catch (error) {
                console.error('Domain add error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Remove domain mapping
        this.app.delete('/domains/:domain', (req, res) => {
            try {
                const removed = this.domainManager.removeDomain(req.params.domain);
                if (removed) {
                    res.json({ success: true });
                } else {
                    res.status(404).json({ error: 'Domain not found' });
                }
            } catch (error) {
                console.error('Domain remove error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Verify domain
        this.app.post('/domains/:domain/verify', (req, res) => {
            try {
                const updated = this.domainManager.verifyDomain(req.params.domain);
                if (updated) {
                    res.json(updated);
                } else {
                    res.status(404).json({ error: 'Domain not found' });
                }
            } catch (error) {
                console.error('Domain verify error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Generate config
        this.app.get('/domains/config/:type', (req, res) => {
            try {
                const type = req.params.type.toLowerCase();

                let config;
                if (type === 'nginx') {
                    config = this.domainManager.generateNginxConfig(this.registry);
                } else if (type === 'caddy') {
                    config = this.domainManager.generateCaddyConfig(this.registry);
                } else {
                    return res.status(400).json({ error: 'Invalid config type. Use: nginx or caddy' });
                }

                res.type('text/plain').send(config);
            } catch (error) {
                console.error('Config generation error:', error);
                res.status(500).json({ error: error.message });
            }
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
            console.log(`   WEB UI http://localhost:${PORT_AUTHORITY_PORT}/`);
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
