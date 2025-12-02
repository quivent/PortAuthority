/**
 * Enforcer - Detects and kills unauthorized port usage
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class Enforcer {
    constructor(registry) {
        this.registry = registry;
    }

    /**
     * Detect port violations (unauthorized processes on allocated ports)
     */
    async detectViolations() {
        const allocations = this.registry.getAllAllocations();
        const violations = [];

        for (const allocation of allocations) {
            const processInfo = await this.getProcessOnPort(allocation.port);

            if (processInfo && !this.isAuthorizedProcess(processInfo, allocation)) {
                violations.push({
                    port: allocation.port,
                    serviceName: allocation.serviceName,
                    pid: processInfo.pid,
                    command: processInfo.command,
                    unauthorized: true
                });
            }
        }

        return violations;
    }

    /**
     * Enforce port authority - kill unauthorized processes
     */
    async enforce() {
        const violations = await this.detectViolations();

        for (const violation of violations) {
            console.warn(`⚠️  Killing unauthorized process ${violation.pid} on port ${violation.port}`);
            try {
                await this.killProcess(violation.pid);
                console.log(`✅ Killed process ${violation.pid}`);
            } catch (error) {
                console.error(`❌ Failed to kill process ${violation.pid}:`, error.message);
            }
        }

        return violations;
    }

    /**
     * Get process information for a port
     */
    async getProcessOnPort(port) {
        try {
            // Use lsof to find process on port
            const { stdout } = await execAsync(`lsof -i :${port} -t 2>/dev/null || true`);
            const pid = stdout.trim();

            if (!pid) {
                return null;
            }

            // Get command for the process
            const { stdout: cmdOut } = await execAsync(`ps -p ${pid} -o command= 2>/dev/null || true`);
            const command = cmdOut.trim();

            return {
                pid: parseInt(pid),
                command
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if a process is authorized for a port allocation
     */
    isAuthorizedProcess(processInfo, allocation) {
        // For now, we trust that if a process is on an allocated port,
        // it's the correct service. More sophisticated matching could be added.
        //
        // Future: Match by service name, process group, user, etc.
        return true;
    }

    /**
     * Kill a process by PID
     */
    async killProcess(pid) {
        try {
            await execAsync(`kill -9 ${pid}`);
        } catch (error) {
            throw new Error(`Failed to kill process ${pid}: ${error.message}`);
        }
    }

    /**
     * Scan for port thieves (processes on unallocated ports in our range)
     */
    async scanForThieves(portRangeStart = 4000, portRangeEnd = 9999) {
        const thieves = [];
        const allocations = this.registry.getAllAllocations();
        const allocatedPorts = new Set(allocations.map(a => a.port));

        // Scan for processes in the port range
        try {
            const { stdout } = await execAsync(`lsof -i TCP:${portRangeStart}-${portRangeEnd} -sTCP:LISTEN -t 2>/dev/null || true`);
            const pids = stdout.trim().split('\n').filter(p => p);

            for (const pid of pids) {
                const { stdout: portOut } = await execAsync(`lsof -p ${pid} -i TCP -sTCP:LISTEN -Fn -P 2>/dev/null | grep -o 'TCP.*:.*->' | cut -d':' -f2 | cut -d'-' -f1 || true`);
                const port = parseInt(portOut.trim());

                if (port && !allocatedPorts.has(port)) {
                    const { stdout: cmdOut } = await execAsync(`ps -p ${pid} -o command= 2>/dev/null || true`);
                    thieves.push({
                        port,
                        pid: parseInt(pid),
                        command: cmdOut.trim(),
                        unauthorized: true
                    });
                }
            }
        } catch (error) {
            console.error('Error scanning for thieves:', error.message);
        }

        return thieves;
    }

    /**
     * Discover ALL services listening on ports (system-wide scan)
     */
    async discoverAllServices(options = {}) {
        const portRangeStart = options.portRangeStart || 1000;
        const portRangeEnd = options.portRangeEnd || 65535;
        const includeRegistered = options.includeRegistered || false;

        const services = [];
        const allocations = this.registry.getAllAllocations();
        const allocatedPorts = new Set(allocations.map(a => a.port));

        try {
            // Use ss or lsof to find all listening TCP ports
            const { stdout } = await execAsync(
                `ss -tlnp 2>/dev/null | awk 'NR>1 {split($4,a,":"); if(a[length(a)]>=${portRangeStart} && a[length(a)]<=${portRangeEnd}) print a[length(a)], $6}' || lsof -i TCP -sTCP:LISTEN -P -n 2>/dev/null | awk 'NR>1 && $9~/:/ {split($9,a,":"); if(a[2]>=${portRangeStart} && a[2]<=${portRangeEnd}) print a[2], $2}'`
            );

            const lines = stdout.trim().split('\n').filter(l => l);
            const portMap = new Map();

            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const port = parseInt(parts[0]);
                const pidInfo = parts[1];

                if (isNaN(port) || port < portRangeStart || port > portRangeEnd) {
                    continue;
                }

                // Extract PID from ss output (format: users:(("name",pid=1234,fd=5)))
                let pid = null;
                if (pidInfo && pidInfo.includes('pid=')) {
                    const pidMatch = pidInfo.match(/pid=(\d+)/);
                    if (pidMatch) {
                        pid = parseInt(pidMatch[1]);
                    }
                }

                // If we don't have PID yet, try lsof
                if (!pid) {
                    try {
                        const { stdout: lsofOut } = await execAsync(`lsof -i :${port} -sTCP:LISTEN -t 2>/dev/null | head -1`);
                        pid = parseInt(lsofOut.trim());
                    } catch (e) {
                        // Ignore
                    }
                }

                if (!portMap.has(port)) {
                    portMap.set(port, { port, pid });
                }
            }

            // Get process details for each port
            for (const [port, info] of portMap) {
                const isRegistered = allocatedPorts.has(port);

                if (!includeRegistered && isRegistered) {
                    continue; // Skip registered services unless explicitly requested
                }

                let command = 'unknown';
                let user = 'unknown';
                let serviceName = null;

                if (info.pid) {
                    try {
                        const { stdout: cmdOut } = await execAsync(`ps -p ${info.pid} -o command= 2>/dev/null || true`);
                        command = cmdOut.trim();

                        const { stdout: userOut } = await execAsync(`ps -p ${info.pid} -o user= 2>/dev/null || true`);
                        user = userOut.trim();
                    } catch (e) {
                        // Ignore
                    }
                }

                // Infer service name from command
                serviceName = this.inferServiceName(command, port);

                // Check if already registered
                const allocation = isRegistered ? allocations.find(a => a.port === port) : null;

                services.push({
                    port,
                    pid: info.pid,
                    command,
                    user,
                    inferredServiceName: serviceName,
                    registered: isRegistered,
                    registeredAs: allocation ? allocation.serviceName : null,
                    allocation
                });
            }

            // Sort by port
            services.sort((a, b) => a.port - b.port);

        } catch (error) {
            console.error('Error discovering services:', error.message);
            throw error;
        }

        return services;
    }

    /**
     * Infer service name from command and port
     */
    inferServiceName(command, port) {
        if (!command || command === 'unknown') {
            return `service-${port}`;
        }

        // Extract meaningful name from command
        const cmd = command.toLowerCase();

        // Common patterns
        if (cmd.includes('node')) {
            const match = command.match(/\/([^\/]+)\/(?:node_modules|index|server|app)/);
            if (match) {
                return match[1];
            }
            const fileMatch = command.match(/([^\/\s]+)\.js/);
            if (fileMatch) {
                return fileMatch[1];
            }
        }

        if (cmd.includes('python')) {
            const match = command.match(/([^\/\s]+)\.py/);
            if (match) {
                return match[1];
            }
        }

        if (cmd.includes('vite')) {
            return 'vite-dev-server';
        }

        if (cmd.includes('nginx')) {
            return 'nginx';
        }

        if (cmd.includes('apache') || cmd.includes('httpd')) {
            return 'apache';
        }

        // Extract binary name
        const parts = command.split(/[\s\/]+/);
        const binary = parts.find(p => p && !p.startsWith('-') && !p.includes('='));

        if (binary) {
            return binary.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50) || `service-${port}`;
        }

        return `service-${port}`;
    }

    /**
     * Force a service into Port Authority management
     * Options:
     *   - kill: Kill the service first (default: false)
     *   - serviceName: Override inferred service name
     *   - project: Project name (default: 'discovered')
     */
    async forceRegister(port, options = {}) {
        const services = await this.discoverAllServices({
            portRangeStart: port,
            portRangeEnd: port,
            includeRegistered: true
        });

        const service = services.find(s => s.port === port);

        if (!service) {
            throw new Error(`No service found on port ${port}`);
        }

        if (service.registered) {
            return {
                port,
                serviceName: service.registeredAs,
                status: 'already-registered',
                killed: false
            };
        }

        // Make service name unique by appending port if not provided
        let serviceName = options.serviceName || `${service.inferredServiceName}-${port}`;
        const project = options.project || 'discovered';
        let killed = false;

        // Kill the service if requested
        if (options.kill && service.pid) {
            try {
                await this.killProcess(service.pid);
                killed = true;
                console.log(`✅ Killed process ${service.pid} on port ${port}`);
            } catch (error) {
                console.error(`❌ Failed to kill process ${service.pid}:`, error.message);
            }
        }

        // Register the port in Port Authority
        try {
            this.registry.allocate(serviceName, port, {
                project,
                priority: 3,
                phiOptimized: false,
                metadata: {
                    originalCommand: service.command,
                    originalPid: service.pid,
                    originalUser: service.user,
                    discoveredAt: new Date().toISOString(),
                    forceRegistered: true
                }
            });

            return {
                port,
                serviceName,
                status: 'registered',
                killed,
                command: service.command,
                originalPid: service.pid
            };
        } catch (error) {
            throw new Error(`Failed to register service: ${error.message}`);
        }
    }

    /**
     * Batch force registration of multiple services
     */
    async batchForceRegister(options = {}) {
        const portRangeStart = options.portRangeStart || 1000;
        const portRangeEnd = options.portRangeEnd || 65535;
        const kill = options.kill || false;
        const project = options.project || 'discovered';

        const services = await this.discoverAllServices({
            portRangeStart,
            portRangeEnd,
            includeRegistered: false // Only unregistered
        });

        const results = [];

        for (const service of services) {
            try {
                const result = await this.forceRegister(service.port, {
                    kill,
                    serviceName: service.inferredServiceName,
                    project
                });
                results.push(result);
            } catch (error) {
                results.push({
                    port: service.port,
                    serviceName: service.inferredServiceName,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        return results;
    }
}

module.exports = { Enforcer };
