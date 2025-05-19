"""
Test suite for API serializers.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from api.models.role import UserRole
from api.models.network import NetworkDevice
from api.models.system import SystemMetrics
from api.models.notification import Notification
from api.serializers.user import UserSerializer, UserRoleSerializer
from api.serializers.network import NetworkDeviceSerializer
from api.serializers.system import SystemMetricsSerializer
from api.serializers.notification import NotificationSerializer

User = get_user_model()

class UserSerializersTest(TestCase):
    def setUp(self):
        # Create test user role
        self.role = UserRole.objects.create(
            name='test_role',
            description='Test Role',
            priority=50,
            can_manage_users=True,
            can_manage_system=True,
            can_manage_network=True,
            can_view_all_data=True
        )
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123',
            role=self.role
        )
    
    def test_user_role_serializer(self):
        """Test user role serialization"""
        serializer = UserRoleSerializer(instance=self.role)
        data = serializer.data
        
        self.assertEqual(data['name'], 'test_role')
        self.assertEqual(data['description'], 'Test Role')
        self.assertEqual(data['priority'], 50)
        self.assertTrue(data['can_manage_users'])
        self.assertTrue(data['can_manage_system'])
        self.assertTrue(data['can_manage_network'])
        self.assertTrue(data['can_view_all_data'])
    
    def test_user_serializer(self):
        """Test user serialization"""
        serializer = UserSerializer(instance=self.user)
        data = serializer.data
        
        self.assertEqual(data['username'], 'testuser')
        self.assertEqual(data['email'], 'test@example.com')
        self.assertNotIn('password', data)
        self.assertIn('role_details', data)
        self.assertEqual(data['role_details']['name'], 'test_role')


class NetworkSerializersTest(TestCase):
    def setUp(self):
        # Create test device
        self.device = NetworkDevice.objects.create(
            ip='192.168.1.1',
            mac='00:11:22:33:44:55',
            hostname='test-device',
            label='Test Device',
            type='router'
        )
    
    def test_network_device_serializer(self):
        """Test network device serialization"""
        serializer = NetworkDeviceSerializer(instance=self.device)
        data = serializer.data
        
        self.assertEqual(data['ip'], '192.168.1.1')
        self.assertEqual(data['mac'], '00:11:22:33:44:55')
        self.assertEqual(data['hostname'], 'test-device')
        self.assertEqual(data['label'], 'Test Device')
        self.assertEqual(data['type'], 'router')


class NotificationSerializersTest(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        
        # Create test notification
        self.notification = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            message='This is a test notification',
            type='info',
            is_system=False,
            source='test'
        )
    
    def test_notification_serializer(self):
        """Test notification serialization"""
        serializer = NotificationSerializer(instance=self.notification)
        data = serializer.data
        
        self.assertEqual(data['title'], 'Test Notification')
        self.assertEqual(data['message'], 'This is a test notification')
        self.assertEqual(data['type'], 'info')
        self.assertEqual(data['source'], 'test')
        self.assertIn('timestamp', data)
        self.assertIn('read', data)  # Should be renamed from is_read by to_representation
