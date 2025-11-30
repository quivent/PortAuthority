/**
 * Port Authority Node.js Client Library
 *
 * Easy integration with Port Authority for Node.js services
 */

const axios = require('axios');

class PortAuthorityClient {
    constructor(options = {}) {
        this.baseURL = options.baseURL || process.env.PORT_AUTHORITY_URL || 'http://localhost:9999';
        this.serviceName = options.serviceName || process.env.SERVICE_NAME;
        this.project = options.project || process.env.PROJECT_NAME || 'default';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: options.timeout || 5000
        });
    }

    /**
     * Allocate a port for this service
     */
    async allocate(serviceName = null, options = {}) {
        const name = serviceName || this.serviceName;
        if (!name) {
            throw new Error('serviceName is required');
        }

        try {
            const response = await this.client.post('/allocate', {
                serviceName: name,
                preferredPort: options.preferredPort,
                priority: options.priority || 1,
                project: options.project || this.project
            });

            return response.data;
        } catch (error) {
            throw new Error(`Port allocation failed: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Release a port allocation
     */
    async release(serviceName = null) {
        const name = serviceName || this.serviceName;
        if (!name) {
            throw new Error('serviceName is required');
        }

        try {
            await this.client.post('/release', { serviceName: name });
            return true;
        } catch (error) {
            throw new Error(`Port release failed: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Get allocated port for a service
     */
    async getPort(serviceName = null) {
        const name = serviceName || this.serviceName;
        if (!name) {
            throw new Error('serviceName is required');
        }

        try {
            const response = await this.client.get(`/allocations/${name}`);
            return response.data.port;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw new Error(`Failed to get port: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Get or allocate port (convenience method)
     */
    async getOrAllocate(serviceName = null, options = {}) {
        const name = serviceName || this.serviceName;
        const port = await this.getPort(name);

        if (port) {
            return port;
        }

        const allocation = await this.allocate(name, options);
        return allocation.port;
    }

    /**
     * Check if a port is available
     */
    async isPortAvailable(port) {
        try {
            const response = await this.client.get(`/check/${port}`);
            return response.data.available;
        } catch (error) {
            throw new Error(`Port check failed: ${error.message}`);
        }
    }

    /**
     * Get all allocations
     */
    async getAllocations() {
        try {
            const response = await this.client.get('/allocations');
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get allocations: ${error.message}`);
        }
    }

    /**
     * Health check
     */
    async health() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }
}

/**
 * Helper function for quick port allocation
 */
async function allocatePort(serviceName, options = {}) {
    const client = new PortAuthorityClient(options);
    const allocation = await client.allocate(serviceName, options);
    return allocation.port;
}

/**
 * Helper function to get or allocate port
 */
async function getOrAllocatePort(serviceName, options = {}) {
    const client = new PortAuthorityClient(options);
    return await client.getOrAllocate(serviceName, options);
}

module.exports = {
    PortAuthorityClient,
    allocatePort,
    getOrAllocatePort
};
