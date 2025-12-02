/**
 * API client utilities for Port Authority CLI
 */

const axios = require('axios');
const chalk = require('chalk');

const PORT_AUTHORITY_URL = process.env.PORT_AUTHORITY_URL || 'http://localhost:9999';

class PortAuthorityClient {
    constructor() {
        this.baseURL = PORT_AUTHORITY_URL;
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000
        });
    }

    async allocate(serviceName, options = {}) {
        try {
            const response = await this.client.post('/allocate', {
                serviceName,
                preferredPort: options.preferred ? parseInt(options.preferred) : undefined,
                priority: options.priority ? parseInt(options.priority) : 1,
                project: options.project || 'default'
            });
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to allocate port');
        }
    }

    async release(serviceName) {
        try {
            const response = await this.client.post('/release', { serviceName });
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to release port');
        }
    }

    async getAllocations(project = null) {
        try {
            const response = await this.client.get('/allocations');
            let allocations = response.data;

            if (project) {
                allocations = allocations.filter(a => a.project === project);
            }

            return allocations;
        } catch (error) {
            this.handleError(error, 'Failed to get allocations');
        }
    }

    async checkPort(port) {
        try {
            const response = await this.client.get(`/check/${port}`);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to check port');
        }
    }

    async enforce() {
        try {
            const response = await this.client.post('/enforce');
            return response.data;
        } catch (error) {
            this.handleError(error, 'Enforcement failed');
        }
    }

    async getMetrics() {
        try {
            const response = await this.client.get('/metrics');
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to get metrics');
        }
    }

    async getHealth() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            this.handleError(error, 'Health check failed');
        }
    }

    // Launcher methods
    async launch(serviceName, options = {}) {
        try {
            const response = await this.client.post(`/launcher/launch/${serviceName}`, options);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to launch service');
        }
    }

    async stop(serviceName, force = false) {
        try {
            const response = await this.client.post(`/launcher/stop/${serviceName}`, { force });
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to stop service');
        }
    }

    async restart(serviceName) {
        try {
            const response = await this.client.post(`/launcher/restart/${serviceName}`);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to restart service');
        }
    }

    async getStatus(serviceName) {
        try {
            const response = await this.client.get(`/launcher/status/${serviceName}`);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to get service status');
        }
    }

    async getAllStatuses(runningOnly = false) {
        try {
            const response = await this.client.get('/launcher/status', {
                params: { runningOnly }
            });
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to get service statuses');
        }
    }

    async getLogs(serviceName, lines = 50) {
        try {
            const response = await this.client.get(`/launcher/logs/${serviceName}`, {
                params: { lines }
            });
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to get service logs');
        }
    }

    // Domain management methods
    async getDomains() {
        try {
            const response = await this.client.get('/domains');
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to get domains');
        }
    }

    async getDomain(domain) {
        try {
            const response = await this.client.get(`/domains/${domain}`);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to get domain');
        }
    }

    async addDomain(domain, serviceName, options = {}) {
        try {
            const response = await this.client.post('/domains', {
                domain,
                serviceName,
                ...options
            });
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to add domain');
        }
    }

    async removeDomain(domain) {
        try {
            const response = await this.client.delete(`/domains/${domain}`);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to remove domain');
        }
    }

    async verifyDomain(domain) {
        try {
            const response = await this.client.post(`/domains/${domain}/verify`);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to verify domain');
        }
    }

    async generateDomainConfig(type) {
        try {
            const response = await this.client.get(`/domains/config/${type}`);
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to generate config');
        }
    }

    handleError(error, message) {
        console.error(chalk.red(`❌ ${message}:`), error.response?.data?.error || error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error(chalk.gray('   Make sure Port Authority is running: npm start'));
        }
        process.exit(1);
    }
}

module.exports = new PortAuthorityClient();
