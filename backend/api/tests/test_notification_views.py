"""
Test suite for notification API views and serializers.
"""
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from api.models.role import UserRole
from api.models.notification import Notification
from api.serializers.notification import NotificationSerializer

User = get_user_model()

class NotificationViewsTest(TestCase):
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
        
        # Create test notifications
        self.notification1 = Notification.objects.create(
            user=self.user,
            title="Test Notification 1",
            message="This is test notification 1",
            level="info",
            read=False
        )
        
        self.notification2 = Notification.objects.create(
            user=self.user,
            title="Test Notification 2",
            message="This is test notification 2",
            level="warning",
            read=False
        )
        
        # Authenticate
        self.client.force_authenticate(user=self.user)
    
    def test_list_notifications(self):
        """Test retrieving a list of notifications"""
        url = reverse('notification-list')
        response = self.client.get(url)
        
        # Assert response status code is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Assert correct number of notifications returned
        self.assertEqual(len(response.data), 2)
        
        # Verify notification data
        notification_ids = [item['id'] for item in response.data]
        self.assertIn(self.notification1.id, notification_ids)
        self.assertIn(self.notification2.id, notification_ids)
    
    def test_create_notification(self):
        """Test creating a notification"""
        url = reverse('notification-list')
        data = {
            'title': 'New Test Notification',
            'message': 'This is a new test notification',
            'level': 'success',
            'read': False
        }
        
        response = self.client.post(url, data, format='json')
        
        # Assert response status code is 201 Created
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify notification was created with correct data
        self.assertEqual(response.data['title'], data['title'])
        self.assertEqual(response.data['message'], data['message'])
        self.assertEqual(response.data['level'], data['level'])
        
        # Check that it was saved to database
        self.assertTrue(Notification.objects.filter(title=data['title']).exists())
    
    def test_retrieve_notification(self):
        """Test retrieving a single notification"""
        url = reverse('notification-detail', args=[self.notification1.id])
        response = self.client.get(url)
        
        # Assert response status code is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify notification data
        self.assertEqual(response.data['id'], self.notification1.id)
        self.assertEqual(response.data['title'], self.notification1.title)
        self.assertEqual(response.data['message'], self.notification1.message)
    
    def test_mark_notification_as_read(self):
        """Test marking a notification as read"""
        url = reverse('notification-detail', args=[self.notification1.id])
        data = {'read': True}
        
        response = self.client.patch(url, data, format='json')
        
        # Assert response status code is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify notification was updated
        self.assertEqual(response.data['read'], True)
        
        # Refresh from database and check
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.read)
    
    def test_delete_notification(self):
        """Test deleting a notification"""
        url = reverse('notification-detail', args=[self.notification1.id])
        response = self.client.delete(url)
        
        # Assert response status code is 204 No Content
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify notification was deleted
        self.assertFalse(Notification.objects.filter(id=self.notification1.id).exists())
    
    def test_mark_all_as_read(self):
        """Test mark all notifications as read endpoint"""
        url = reverse('mark-all-notifications-read')
        response = self.client.post(url)
        
        # Assert response status code is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check all notifications are marked as read
        self.notification1.refresh_from_db()
        self.notification2.refresh_from_db()
        self.assertTrue(self.notification1.read)
        self.assertTrue(self.notification2.read)
