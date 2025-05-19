"""
Test suite for ASGI configuration and middleware integration.
"""

import pytest
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from channels.testing import HttpCommunicator
from everyst_api.asgi import application

@pytest.mark.asyncio
async def test_asgi_http_request():
    """Test basic HTTP request through ASGI application"""
    # Create a test communicator
    communicator = HttpCommunicator(application, "GET", "/api/health/")
    
    # Get the response
    response = await communicator.get_response()
    
    # Check the response
    assert response["status"] == 200
    assert b"everyst API is running" in response["body"]
    
    # Check that CORS headers are present
    headers = dict(response["headers"])
    assert b"Access-Control-Allow-Origin" in headers
    
@pytest.mark.asyncio
async def test_asgi_http_options_request():
    """Test OPTIONS request for CORS preflight"""
    # Create a test communicator
    communicator = HttpCommunicator(
        application, 
        "OPTIONS", 
        "/api/health/",
        headers=[
            (b"origin", b"http://localhost:3000"),
            (b"access-control-request-method", b"GET"),
        ]
    )
    
    # Get the response
    response = await communicator.get_response()
    
    # Check the response has status 200 for OPTIONS
    assert response["status"] == 200
    
    # Check that CORS headers are present
    headers = dict(response["headers"])
    assert b"Access-Control-Allow-Origin" in headers
    assert b"Access-Control-Allow-Methods" in headers
    assert b"Access-Control-Allow-Headers" in headers
    
@pytest.mark.django_db
@override_settings(CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}})
class TestASGIIntegration:
    """Test the integration of Django, Channels, and Socket.IO"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_django_endpoints_accessible(self):
        """Test that Django endpoints are accessible through the ASGI app"""
        response = self.client.get(reverse('health'))
        assert response.status_code == status.HTTP_200_OK
        
        # Check unauthorized access is blocked for protected endpoints
        response = self.client.get(reverse('user-list'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
