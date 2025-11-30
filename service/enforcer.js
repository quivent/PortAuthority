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
}

module.exports = { Enforcer };
