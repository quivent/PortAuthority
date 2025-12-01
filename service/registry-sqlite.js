/**
 * Port Registry - SQLite-backed port allocation database
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class PortRegistry {
    constructor(dbPath = null) {
        const defaultPath = path.join(__dirname, '..', 'port-registry.db');
        this.dbPath = dbPath || defaultPath;
        this.db = new Database(this.dbPath);
        this.initialize();
    }

    initialize() {
        // Create allocations table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS allocations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_name TEXT UNIQUE NOT NULL,
                port INTEGER UNIQUE NOT NULL,
                project TEXT DEFAULT 'default',
                priority INTEGER DEFAULT 1,
                phi_optimized INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                allocated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                last_seen TEXT DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
        `);

        // Create index on port for fast lookups
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_port ON allocations(port)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_service ON allocations(service_name)');

        console.log(`✅ Port registry initialized at ${this.dbPath}`);
    }

    /**
     * Allocate a port for a service
     */
    allocate(serviceName, port, options = {}) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO allocations
            (service_name, port, project, priority, phi_optimized, status, metadata)
            VALUES (?, ?, ?, ?, ?, 'active', ?)
        `);

        const metadata = JSON.stringify(options.metadata || {});

        stmt.run(
            serviceName,
            port,
            options.project || 'default',
            options.priority || 1,
            options.phiOptimized ? 1 : 0,
            metadata
        );

        return this.getByService(serviceName);
    }

    /**
     * Release a port allocation
     */
    release(serviceName, port) {
        let stmt;
        if (serviceName) {
            stmt = this.db.prepare('DELETE FROM allocations WHERE service_name = ?');
            stmt.run(serviceName);
        } else if (port) {
            stmt = this.db.prepare('DELETE FROM allocations WHERE port = ?');
            stmt.run(port);
        } else {
            return false;
        }

        return true;
    }

    /**
     * Check if a port is available
     */
    isPortAvailable(port) {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM allocations WHERE port = ?');
        const result = stmt.get(port);
        return result.count === 0;
    }

    /**
     * Get allocation by service name
     */
    getByService(serviceName) {
        const stmt = this.db.prepare('SELECT * FROM allocations WHERE service_name = ?');
        const row = stmt.get(serviceName);
        return row ? this.formatAllocation(row) : null;
    }

    /**
     * Get allocation by port
     */
    getByPort(port) {
        const stmt = this.db.prepare('SELECT * FROM allocations WHERE port = ?');
        const row = stmt.get(port);
        return row ? this.formatAllocation(row) : null;
    }

    /**
     * Get all allocations
     */
    getAllAllocations() {
        const stmt = this.db.prepare('SELECT * FROM allocations ORDER BY port ASC');
        const rows = stmt.all();
        return rows.map(row => this.formatAllocation(row));
    }

    /**
     * Get allocations by project
     */
    getAllocationsByProject(project) {
        const stmt = this.db.prepare('SELECT * FROM allocations WHERE project = ? ORDER BY port ASC');
        const rows = stmt.all(project);
        return rows.map(row => this.formatAllocation(row));
    }

    /**
     * Update last seen timestamp
     */
    updateLastSeen(serviceName) {
        const stmt = this.db.prepare(`
            UPDATE allocations
            SET last_seen = CURRENT_TIMESTAMP
            WHERE service_name = ?
        `);
        stmt.run(serviceName);
    }

    /**
     * Format database row to allocation object
     */
    formatAllocation(row) {
        return {
            id: row.id,
            serviceName: row.service_name,
            port: row.port,
            project: row.project,
            priority: row.priority,
            phiOptimized: row.phi_optimized === 1,
            status: row.status,
            allocatedAt: row.allocated_at,
            lastSeen: row.last_seen,
            metadata: row.metadata ? JSON.parse(row.metadata) : {}
        };
    }

    /**
     * Close database connection
     */
    close() {
        this.db.close();
    }
}

module.exports = { PortRegistry };
