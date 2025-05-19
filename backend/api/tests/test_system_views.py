"""
Test suite for system API views and serializers.
"""
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from api.models.role import UserRole
from api.models.system import SystemMetrics
from api.serializers.system import SystemMetricsSerializer
import json
from unittest.mock import patch

User = get_user_model()

class SystemViewsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create a user role for testing
        self.role = UserRole.objects.create(
            name='admin',
            description='Admin Role',
            priority=90,
            can_manage_users=True,
            can_manage_system=True,
            can_manage_network=True,
            can_view_all_data=True
        )
        
        # Create test user
        self.user = User.objects.create_user(
            username='testadmin',
            email='testadmin@example.com',
            password='complexpassword123'
        )
        self.user.role = self.role
        self.user.save()
        
        # Create test system metrics
        self.metrics = SystemMetrics.objects.create(
            cpu_usage=25.5,
            memory_usage=40.3,
            disk_usage=30.1,
            network_rx=1500,
            network_tx=800,
            active_connections=5,
            timestamp="2025-05-15T10:00:00Z"
        )
        
        # Authenticate
        self.client.force_authenticate(user=self.user)
    
    def test_list_system_metrics(self):
        """Test retrieving system metrics list"""
        url = reverse('metrics-list')
        response = self.client.get(url)
        
        # Assert response status code is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Assert at least one metrics record is returned
        self.assertGreaterEqual(len(response.data), 1)
        
        # Verify metrics data
        metrics_ids = [item['id'] for item in response.data]
        self.assertIn(self.metrics.id, metrics_ids)
    
    @patch('api.utils.system.get_system_metrics')
    def test_get_current_metrics(self, mock_get_system_metrics):
        """Test getting current system metrics"""
        # Set up mock return value
        mock_metrics = {
            'timestamp': '2025-05-15T12:30:00Z',
            'cpu_usage': 32.1,
            'memory_usage': 45.7,
            'disk_usage': 55.3,
            'network_rx': 2500,
            'network_tx': 1200,
            'uptime': {'percentage': 99.9, 'duration': '5d 12h 30m'},
            'memory_total': 16.0,
            'memory_used': 7.3,
            'disk_total': 500.0,
            'disk_used': 276.5,
            'cpu_cores': 8,
            'cpu_speed': 3.6,
            'server_info': {
                'hostname': 'everyst-server',
                'private_ip': '192.168.1.100',
                'public_ip': '12.34.56.78',
                'os': 'Linux 5.15.0',
                'architecture': 'x86_64',
                'kernel': '5.15.0-76-generic'
            }
        }
        mock_get_system_metrics.return_value = mock_metrics
        
        url = reverse('current-metrics')
        response = self.client.get(url)
        
        # Assert response status code is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify metrics data matches mock data
        self.assertEqual(response.data['cpu_usage'], mock_metrics['cpu_usage'])
        self.assertEqual(response.data['memory_usage'], mock_metrics['memory_usage'])
        self.assertEqual(response.data['disk_usage'], mock_metrics['disk_usage'])
        self.assertEqual(response.data['server_info']['hostname'], mock_metrics['server_info']['hostname'])
    
    def test_get_server_info(self):
        """Test getting server information"""
        url = reverse('server-info')
        
        with patch('api.utils.system.get_server_info') as mock_get_server_info:
            # Set up mock return value
            mock_server_info = {
                'hostname': 'everyst-server',
                'private_ip': '192.168.1.100',
                'public_ip': '12.34.56.78',
                'os': 'Linux 5.15.0',
                'architecture': 'x86_64',
                'kernel': '5.15.0-76-generic'
            }
            mock_get_server_info.return_value = mock_server_info
            
            response = self.client.get(url)
            
            # Assert response status code is 200 OK
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify server info data
            self.assertEqual(response.data['hostname'], mock_server_info['hostname'])
            self.assertEqual(response.data['private_ip'], mock_server_info['private_ip'])
            self.assertEqual(response.data['public_ip'], mock_server_info['public_ip'])
    
    def test_system_metrics_serializer(self):
        """Test the system metrics serializer"""
        serializer = SystemMetricsSerializer(self.metrics)
        
        # Verify serialized data
        self.assertEqual(serializer.data['cpu_usage'], self.metrics.cpu_usage)
        self.assertEqual(serializer.data['memory_usage'], self.metrics.memory_usage)
        self.assertEqual(serializer.data['disk_usage'], self.metrics.disk_usage)
        self.assertEqual(serializer.data['network_rx'], self.metrics.network_rx)
        self.assertEqual(serializer.data['network_tx'], self.metrics.network_tx)
