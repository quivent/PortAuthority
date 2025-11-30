/**
 * Allocation Engine - φ-Based Port Allocation Algorithm
 */

const net = require('net');

// Sacred Geometry Constants
const PHI = 1.618033988749895;
const PHI_INVERSE = 0.618033988749895;

class AllocationEngine {
    constructor(registry, options = {}) {
        this.registry = registry;
        this.config = {
            portRange: {
                start: options.portRangeStart || 4000,
                end: options.portRangeEnd || 9999
            },
            phiStep: Math.floor(PHI * 10), // φ-based stepping = 16
            maxRetries: 100
        };
    }

    /**
     * Allocate a port for a service
     */
    async allocate(options) {
        const {
            serviceName,
            preferredPort,
            priority = 1,
            project = 'default',
            phiMultiplier = 1.0
        } = options;

        // Check if service already has an allocation
        const existing = this.registry.getByService(serviceName);
        if (existing) {
            console.log(`♻️  Service ${serviceName} already allocated to port ${existing.port}`);
            return existing;
        }

        // Try preferred port first
        if (preferredPort) {
            const available = await this.isPortActuallyAvailable(preferredPort);
            if (available && this.registry.isPortAvailable(preferredPort)) {
                return this.registry.allocate(serviceName, preferredPort, {
                    project,
                    priority,
                    phiOptimized: false
                });
            }
        }

        // Use φ-based allocation
        const port = await this.allocatePhiPort(preferredPort || this.config.portRange.start, priority, phiMultiplier);

        return this.registry.allocate(serviceName, port, {
            project,
            priority,
            phiOptimized: true
        });
    }

    /**
     * φ-Based port allocation algorithm
     */
    async allocatePhiPort(basePort, priority, phiMultiplier) {
        const phiOffset = Math.floor(priority * PHI * phiMultiplier * 10);
        let candidatePort = basePort + phiOffset;

        for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
            // Ensure port is in range
            if (candidatePort > this.config.portRange.end) {
                candidatePort = this.config.portRange.start + (candidatePort % this.config.portRange.start);
            }

            if (candidatePort < this.config.portRange.start) {
                candidatePort = this.config.portRange.start;
            }

            // Check if port is available in registry
            if (!this.registry.isPortAvailable(candidatePort)) {
                candidatePort += this.config.phiStep;
                continue;
            }

            // Check if port is actually available on the system
            const available = await this.isPortActuallyAvailable(candidatePort);
            if (available) {
                return candidatePort;
            }

            // Port is in use, try next φ-step
            candidatePort += this.config.phiStep;
        }

        throw new Error(`Failed to allocate port after ${this.config.maxRetries} attempts`);
    }

    /**
     * Check if port is actually available on the system
     */
    isPortActuallyAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();

            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(false);
                } else {
                    resolve(false);
                }
            });

            server.once('listening', () => {
                server.close(() => {
                    resolve(true);
                });
            });

            server.listen(port, '127.0.0.1');
        });
    }

    /**
     * Get port range configuration
     */
    getPortRange() {
        return this.config.portRange;
    }
}

module.exports = { AllocationEngine };
