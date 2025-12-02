/**
 * Port Registry - JSON-backed port allocation database
 * (No native dependencies - pure JavaScript)
 */

const path = require('path');
const fs = require('fs');

class PortRegistry {
    constructor(dbPath = null) {
        const defaultPath = path.join(__dirname, '..', 'port-registry.json');
        this.dbPath = dbPath || defaultPath;
        this.allocations = [];
        this.nextId = 1;
        this.load();
    }

    /**
     * Load allocations from JSON file
     */
    load() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const data = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
                this.allocations = data.allocations || [];
                this.nextId = data.nextId || 1;
                console.log(`✅ Port registry loaded from ${this.dbPath} (${this.allocations.length} allocations)`);
            } else {
                console.log(`✅ Port registry initialized at ${this.dbPath} (new database)`);
                this.save();
            }
        } catch (error) {
            console.error(`⚠️  Failed to load registry, starting fresh:`, error.message);
            this.allocations = [];
            this.nextId = 1;
            this.save();
        }
    }

    /**
     * Save allocations to JSON file
     */
    save() {
        try {
            const data = {
                allocations: this.allocations,
                nextId: this.nextId,
                lastUpdated: new Date().toISOString()
            };
            fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error(`❌ Failed to save registry:`, error.message);
        }
    }

    /**
     * Allocate a port for a service
     */
    allocate(serviceName, port, options = {}) {
        // Remove existing allocation if any
        this.allocations = this.allocations.filter(a => a.serviceName !== serviceName);

        const allocation = {
            id: this.nextId++,
            serviceName,
            port,
            project: options.project || 'default',
            priority: options.priority || 1,
            phiOptimized: options.phiOptimized || false,
            status: 'active',
            allocatedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            metadata: options.metadata || {},
            // Launcher fields
            process_pid: null,
            process_status: 'stopped',
            process_command: null,
            process_cwd: null,
            process_env: null,
            process_started_at: null,
            process_stopped_at: null,
            auto_restart: false
        };

        this.allocations.push(allocation);
        this.save();

        return this.formatAllocation(allocation);
    }

    /**
     * Release a port allocation
     */
    release(serviceName, port) {
        const initialLength = this.allocations.length;

        if (serviceName) {
            this.allocations = this.allocations.filter(a => a.serviceName !== serviceName);
        } else if (port) {
            this.allocations = this.allocations.filter(a => a.port !== port);
        } else {
            return false;
        }

        if (this.allocations.length < initialLength) {
            this.save();
            return true;
        }

        return false;
    }

    /**
     * Check if a port is available
     */
    isPortAvailable(port) {
        return !this.allocations.some(a => a.port === port);
    }

    /**
     * Get allocation by service name
     */
    getByService(serviceName) {
        const allocation = this.allocations.find(a => a.serviceName === serviceName);
        return allocation ? this.formatAllocation(allocation) : null;
    }

    /**
     * Get allocation by port
     */
    getByPort(port) {
        const allocation = this.allocations.find(a => a.port === port);
        return allocation ? this.formatAllocation(allocation) : null;
    }

    /**
     * Get all allocations
     */
    getAllAllocations() {
        return this.allocations
            .sort((a, b) => a.port - b.port)
            .map(a => this.formatAllocation(a));
    }

    /**
     * Get allocations by project
     */
    getAllocationsByProject(project) {
        return this.allocations
            .filter(a => a.project === project)
            .sort((a, b) => a.port - b.port)
            .map(a => this.formatAllocation(a));
    }

    /**
     * Update last seen timestamp
     */
    updateLastSeen(serviceName) {
        const allocation = this.allocations.find(a => a.serviceName === serviceName);
        if (allocation) {
            allocation.lastSeen = new Date().toISOString();
            this.save();
        }
    }

    /**
     * Format allocation object
     */
    formatAllocation(alloc) {
        return {
            id: alloc.id,
            serviceName: alloc.serviceName,
            port: alloc.port,
            project: alloc.project,
            priority: alloc.priority,
            phiOptimized: alloc.phiOptimized,
            status: alloc.status,
            allocatedAt: alloc.allocatedAt,
            lastSeen: alloc.lastSeen,
            metadata: alloc.metadata,
            // Launcher fields
            process_pid: alloc.process_pid || null,
            process_status: alloc.process_status || 'stopped',
            process_command: alloc.process_command || null,
            process_cwd: alloc.process_cwd || null,
            process_env: alloc.process_env || null,
            process_started_at: alloc.process_started_at || null,
            process_stopped_at: alloc.process_stopped_at || null,
            auto_restart: alloc.auto_restart || false
        };
    }

    /**
     * Update process information for a service
     */
    updateProcess(serviceName, processInfo) {
        const allocation = this.allocations.find(a => a.serviceName === serviceName);
        if (allocation) {
            allocation.process_pid = processInfo.pid || null;
            allocation.process_status = processInfo.status || 'stopped';
            allocation.process_command = processInfo.command || null;
            allocation.process_cwd = processInfo.cwd || null;
            allocation.process_env = processInfo.env ? JSON.stringify(processInfo.env) : null;
            allocation.process_started_at = processInfo.startedAt || null;
            allocation.process_stopped_at = processInfo.stoppedAt || null;
            allocation.auto_restart = processInfo.autoRestart || false;
            this.save();
        }
    }

    /**
     * Update process status only
     */
    updateProcessStatus(serviceName, status, pid = null) {
        const allocation = this.allocations.find(a => a.serviceName === serviceName);
        if (allocation) {
            allocation.process_status = status;
            if (pid !== null) {
                allocation.process_pid = pid;
            }

            if (status === 'running') {
                allocation.process_started_at = new Date().toISOString();
                allocation.process_stopped_at = null;
            } else if (status === 'stopped' || status === 'crashed') {
                allocation.process_stopped_at = new Date().toISOString();
            }

            this.save();
        }
    }

    /**
     * Close database connection (no-op for JSON)
     */
    close() {
        this.save();
    }
}

module.exports = { PortRegistry };
