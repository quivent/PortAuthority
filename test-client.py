#!/usr/bin/env python3

"""
Quick test of Port Authority Python client
"""

from portauth import PortAuthorityClient, get_or_allocate_port

def test_client():
    print('🧪 Testing Port Authority Python Client\n')

    try:
        # Test 1: Create client and allocate port
        print('Test 1: Allocate port using client...')
        client = PortAuthorityClient()
        allocation = client.allocate(
            'test-python-service',
            preferred_port=6000,
            project='test'
        )
        print(f"✅ Allocated: {allocation['serviceName']} -> Port {allocation['port']}\n")

        # Test 2: Get existing port
        print('Test 2: Get existing port...')
        port = client.get_port('test-python-service')
        print(f'✅ Retrieved port: {port}\n')

        # Test 3: Quick helper
        print('Test 3: Using quick helper...')
        quick_port = get_or_allocate_port(
            'test-quick-python',
            preferred_port=6100
        )
        print(f'✅ Quick allocated: Port {quick_port}\n')

        # Test 4: Check port availability
        print('Test 4: Check port availability...')
        available = client.is_port_available(9500)
        print(f'✅ Port 9500 available: {available}\n')

        # Test 5: Get all allocations
        print('Test 5: Get all allocations...')
        allocations = client.get_allocations()
        print(f'✅ Total allocations: {len(allocations)}\n')

        print('🎉 All tests passed!')

    except Exception as error:
        print(f'❌ Test failed: {error}')
        exit(1)

if __name__ == '__main__':
    test_client()
