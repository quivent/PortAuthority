"""
Port Authority Python Client Library

Easy integration with Port Authority for Python services
"""

import os
import requests
from typing import Optional, Dict, Any


class PortAuthorityClient:
    """Port Authority client for Python services"""

    def __init__(self, base_url: Optional[str] = None, service_name: Optional[str] = None,
                 project: Optional[str] = None, timeout: int = 5):
        """
        Initialize Port Authority client

        Args:
            base_url: Port Authority service URL (default: from env or localhost:9999)
            service_name: Name of this service (default: from env)
            project: Project name (default: from env or 'default')
            timeout: Request timeout in seconds
        """
        self.base_url = base_url or os.getenv('PORT_AUTHORITY_URL', 'http://localhost:9999')
        self.service_name = service_name or os.getenv('SERVICE_NAME')
        self.project = project or os.getenv('PROJECT_NAME', 'default')
        self.timeout = timeout

    def allocate(self, service_name: Optional[str] = None, preferred_port: Optional[int] = None,
                 priority: int = 1, project: Optional[str] = None) -> Dict[str, Any]:
        """
        Allocate a port for a service

        Args:
            service_name: Name of the service (default: from constructor)
            preferred_port: Preferred port number
            priority: Allocation priority (1-5)
            project: Project name (default: from constructor)

        Returns:
            Allocation dictionary with port, serviceName, etc.

        Raises:
            Exception: If allocation fails
        """
        name = service_name or self.service_name
        if not name:
            raise ValueError('service_name is required')

        try:
            response = requests.post(
                f'{self.base_url}/allocate',
                json={
                    'serviceName': name,
                    'preferredPort': preferred_port,
                    'priority': priority,
                    'project': project or self.project
                },
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f'Port allocation failed: {str(e)}')

    def release(self, service_name: Optional[str] = None) -> bool:
        """
        Release a port allocation

        Args:
            service_name: Name of the service (default: from constructor)

        Returns:
            True if successful

        Raises:
            Exception: If release fails
        """
        name = service_name or self.service_name
        if not name:
            raise ValueError('service_name is required')

        try:
            response = requests.post(
                f'{self.base_url}/release',
                json={'serviceName': name},
                timeout=self.timeout
            )
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            raise Exception(f'Port release failed: {str(e)}')

    def get_port(self, service_name: Optional[str] = None) -> Optional[int]:
        """
        Get allocated port for a service

        Args:
            service_name: Name of the service (default: from constructor)

        Returns:
            Port number or None if not allocated

        Raises:
            Exception: If request fails
        """
        name = service_name or self.service_name
        if not name:
            raise ValueError('service_name is required')

        try:
            response = requests.get(
                f'{self.base_url}/allocations/{name}',
                timeout=self.timeout
            )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()['port']
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response.status_code == 404:
                return None
            raise Exception(f'Failed to get port: {str(e)}')

    def get_or_allocate(self, service_name: Optional[str] = None,
                        preferred_port: Optional[int] = None, priority: int = 1) -> int:
        """
        Get existing port or allocate a new one (convenience method)

        Args:
            service_name: Name of the service (default: from constructor)
            preferred_port: Preferred port number
            priority: Allocation priority (1-5)

        Returns:
            Port number

        Raises:
            Exception: If allocation fails
        """
        name = service_name or self.service_name
        port = self.get_port(name)

        if port:
            return port

        allocation = self.allocate(name, preferred_port=preferred_port, priority=priority)
        return allocation['port']

    def is_port_available(self, port: int) -> bool:
        """
        Check if a port is available

        Args:
            port: Port number to check

        Returns:
            True if available, False otherwise

        Raises:
            Exception: If check fails
        """
        try:
            response = requests.get(
                f'{self.base_url}/check/{port}',
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()['available']
        except requests.exceptions.RequestException as e:
            raise Exception(f'Port check failed: {str(e)}')

    def get_allocations(self) -> list:
        """
        Get all port allocations

        Returns:
            List of allocation dictionaries

        Raises:
            Exception: If request fails
        """
        try:
            response = requests.get(
                f'{self.base_url}/allocations',
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f'Failed to get allocations: {str(e)}')

    def health(self) -> Dict[str, Any]:
        """
        Check Port Authority health

        Returns:
            Health status dictionary
        """
        try:
            response = requests.get(
                f'{self.base_url}/health',
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {'status': 'unhealthy', 'error': str(e)}


# Helper functions for quick usage
def allocate_port(service_name: str, preferred_port: Optional[int] = None,
                  priority: int = 1, base_url: Optional[str] = None) -> int:
    """
    Quick helper to allocate a port

    Args:
        service_name: Name of the service
        preferred_port: Preferred port number
        priority: Allocation priority (1-5)
        base_url: Port Authority URL (optional)

    Returns:
        Allocated port number
    """
    client = PortAuthorityClient(base_url=base_url)
    allocation = client.allocate(service_name, preferred_port=preferred_port, priority=priority)
    return allocation['port']


def get_or_allocate_port(service_name: str, preferred_port: Optional[int] = None,
                         priority: int = 1, base_url: Optional[str] = None) -> int:
    """
    Quick helper to get or allocate a port

    Args:
        service_name: Name of the service
        preferred_port: Preferred port number
        priority: Allocation priority (1-5)
        base_url: Port Authority URL (optional)

    Returns:
        Port number
    """
    client = PortAuthorityClient(base_url=base_url)
    return client.get_or_allocate(service_name, preferred_port=preferred_port, priority=priority)
