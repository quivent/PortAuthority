/**
 * Domain Manager - Manage domain-to-service mappings
 */

const path = require('path');
const fs = require('fs');

class DomainManager {
    constructor() {
        const domainsPath = path.join(__dirname, '..', 'domains.json');
        this.domainsPath = domainsPath;
        this.domains = [];
        this.load();
    }

    /**
     * Load domains from JSON file
     */
    load() {
        try {
            if (fs.existsSync(this.domainsPath)) {
                const data = JSON.parse(fs.readFileSync(this.domainsPath, 'utf8'));
                this.domains = data.domains || [];
                console.log(`✅ Domains loaded from ${this.domainsPath} (${this.domains.length} domains)`);
            } else {
                console.log(`✅ Domains initialized at ${this.domainsPath} (new database)`);
                this.save();
            }
        } catch (error) {
            console.error(`⚠️  Failed to load domains, starting fresh:`, error.message);
            this.domains = [];
            this.save();
        }
    }

    /**
     * Save domains to JSON file
     */
    save() {
        try {
            const data = {
                domains: this.domains,
                lastUpdated: new Date().toISOString()
            };
            fs.writeFileSync(this.domainsPath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error(`❌ Failed to save domains:`, error.message);
        }
    }

    /**
     * Add a domain mapping
     */
    addDomain(domain, serviceName, options = {}) {
        // Remove existing mapping for this domain
        this.domains = this.domains.filter(d => d.domain !== domain);

        const mapping = {
            domain,
            serviceName,
            ssl: options.ssl || false,
            certPath: options.certPath || null,
            keyPath: options.keyPath || null,
            proxyType: options.proxyType || 'http',
            customConfig: options.customConfig || null,
            verified: options.verified || false,
            createdAt: new Date().toISOString(),
            metadata: options.metadata || {}
        };

        this.domains.push(mapping);
        this.save();

        return mapping;
    }

    /**
     * Remove a domain mapping
     */
    removeDomain(domain) {
        const initialLength = this.domains.length;
        this.domains = this.domains.filter(d => d.domain !== domain);

        if (this.domains.length < initialLength) {
            this.save();
            return true;
        }

        return false;
    }

    /**
     * Get domain mapping
     */
    getDomain(domain) {
        return this.domains.find(d => d.domain === domain) || null;
    }

    /**
     * Get all domains
     */
    getAllDomains() {
        return this.domains.sort((a, b) => a.domain.localeCompare(b.domain));
    }

    /**
     * Get domains by service
     */
    getDomainsByService(serviceName) {
        return this.domains.filter(d => d.serviceName === serviceName);
    }

    /**
     * Update domain configuration
     */
    updateDomain(domain, updates) {
        const mapping = this.domains.find(d => d.domain === domain);
        if (mapping) {
            Object.assign(mapping, updates);
            mapping.updatedAt = new Date().toISOString();
            this.save();
            return mapping;
        }
        return null;
    }

    /**
     * Verify domain (mark as verified)
     */
    verifyDomain(domain) {
        return this.updateDomain(domain, { verified: true });
    }

    /**
     * Generate nginx configuration for all domains
     */
    generateNginxConfig(registry) {
        const configs = [];

        for (const domainMapping of this.domains) {
            const allocation = registry.getByService(domainMapping.serviceName);

            if (!allocation) {
                continue;
            }

            const config = this.generateNginxServerBlock(domainMapping, allocation);
            configs.push(config);
        }

        return configs.join('\n\n');
    }

    /**
     * Generate nginx server block for a domain
     */
    generateNginxServerBlock(domainMapping, allocation) {
        const { domain, ssl, certPath, keyPath, proxyType } = domainMapping;
        const port = allocation.port;

        let config = `server {
    listen 80;
    server_name ${domain};
`;

        if (ssl && certPath && keyPath) {
            config += `
    listen 443 ssl http2;
    ssl_certificate ${certPath};
    ssl_certificate_key ${keyPath};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
`;
        }

        config += `
    location / {
        proxy_pass http://localhost:${port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
`;

        if (proxyType === 'websocket') {
            config += `
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
`;
        }

        config += `    }
}`;

        if (ssl && !certPath) {
            config = `# SSL enabled but certificates not configured for ${domain}\n` + config;
        }

        return config;
    }

    /**
     * Generate Caddy configuration
     */
    generateCaddyConfig(registry) {
        const configs = [];

        for (const domainMapping of this.domains) {
            const allocation = registry.getByService(domainMapping.serviceName);

            if (!allocation) {
                continue;
            }

            let config = `${domainMapping.domain} {
    reverse_proxy localhost:${allocation.port}`;

            if (domainMapping.proxyType === 'websocket') {
                config += `
    reverse_proxy localhost:${allocation.port} {
        header_up Upgrade {http.request.header.Upgrade}
        header_up Connection {http.request.header.Connection}
    }`;
            }

            config += `\n}`;

            configs.push(config);
        }

        return configs.join('\n\n');
    }

    /**
     * Close (save)
     */
    close() {
        this.save();
    }
}

module.exports = { DomainManager };
