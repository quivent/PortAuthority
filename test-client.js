#!/usr/bin/env node

/**
 * Quick test of Port Authority Node.js client
 */

const { PortAuthorityClient, getOrAllocatePort } = require('./clients/node');

async function testClient() {
    console.log('🧪 Testing Port Authority Node.js Client\n');

    try {
        // Test 1: Create client and allocate port
        console.log('Test 1: Allocate port using client...');
        const client = new PortAuthorityClient();
        const allocation = await client.allocate('test-node-service', {
            preferredPort: 7000,
            project: 'test'
        });
        console.log(`✅ Allocated: ${allocation.serviceName} -> Port ${allocation.port}\n`);

        // Test 2: Get existing port
        console.log('Test 2: Get existing port...');
        const port = await client.getPort('test-node-service');
        console.log(`✅ Retrieved port: ${port}\n`);

        // Test 3: Quick helper
        console.log('Test 3: Using quick helper...');
        const quickPort = await getOrAllocatePort('test-quick-service', {
            preferredPort: 7100
        });
        console.log(`✅ Quick allocated: Port ${quickPort}\n`);

        // Test 4: Check port availability
        console.log('Test 4: Check port availability...');
        const available = await client.isPortAvailable(9000);
        console.log(`✅ Port 9000 available: ${available}\n`);

        // Test 5: Get all allocations
        console.log('Test 5: Get all allocations...');
        const allocations = await client.getAllocations();
        console.log(`✅ Total allocations: ${allocations.length}\n`);

        console.log('🎉 All tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testClient();
