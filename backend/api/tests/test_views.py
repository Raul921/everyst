"""
Test suite for API views.
"""
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from api.models.role import UserRole
from api.models.network import NetworkDevice
from api.models.notification import Notification

User = get_user_model()

class AuthViewsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create a user role for testing
        self.role = UserRole.objects.create(
            name='test_role',
            description='Test Role',
            priority=50,
            can_manage_users=True,
            can_manage_system=True,
            can_manage_network=True,
            can_view_all_data=True
        )
    
    def test_health_check_view(self):
        """Test the health check endpoint"""
        response = self.client.get(reverse('health-check'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')
        self.assertIn('timestamp', response.data)
        self.assertEqual(response.data['service'], 'everyst API')
    
    def test_register_view(self):
        """Test user registration"""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpassword',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        response = self.client.post(reverse('register'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        # Verify user was created
        user = User.objects.get(username='testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')


class UserViewsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create roles
        UserRole.create_default_roles()
        self.owner_role = UserRole.objects.get(name='owner')
        self.user_role = UserRole.objects.get(name='user')
        
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass',
            role=self.owner_role,
            is_staff=True,
            is_superuser=True
        )
        
        self.regular_user = User.objects.create_user(
            username='regular',
            email='regular@example.com',
            password='regularpass',
            role=self.user_role
        )
    
    def test_me_endpoint(self):
        """Test the 'me' endpoint for retrieving current user info"""
        # Login as regular user
        self.client.force_authenticate(user=self.regular_user)
        
        response = self.client.get(reverse('user-me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'regular')
        self.assertEqual(response.data['email'], 'regular@example.com')
        
        # Test with admin user
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get(reverse('user-me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'admin')
        self.assertEqual(response.data['role_details']['name'], 'owner')


class NotificationViewsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass'
        )
        
        # Create notifications
        self.notification1 = Notification.objects.create(
            user=self.user,
            title='Notification 1',
            message='This is notification 1',
            type='info'
        )
        
        self.notification2 = Notification.objects.create(
            user=self.user,
            title='Notification 2',
            message='This is notification 2',
            type='warning'
        )
        
        self.system_notification = Notification.objects.create(
            title='System Notification',
            message='This is a system notification',
            type='system',
            is_system=True
        )
        
        # Authenticate
        self.client.force_authenticate(user=self.user)
    
    def test_list_notifications(self):
        """Test listing notifications for the current user"""
        response = self.client.get(reverse('notification-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)  # All notifications returned from the test database
    
    def test_mark_as_read(self):
        """Test marking notifications as read"""
        data = {'ids': [self.notification1.id]}
        response = self.client.post(reverse('notification-mark-as-read'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify notification is marked as read
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
