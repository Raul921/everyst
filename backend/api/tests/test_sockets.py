"""
Tests for the Socket.IO implementation.
"""

import pytest
import socketio
import jwt
import time
import asyncio
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.conf import settings
from api.models.network import NetworkDevice, NetworkConnection, NetworkScan
from api.models.notification import Notification

User = get_user_model()


class TestSocketServer:
    """Test the Socket.IO server core functionality."""
    
    @pytest.mark.asyncio
    async def test_server_creation(self):
        """Test that the Socket.IO server is created correctly."""
        from api.sockets import sio, create_socket_app
        
        assert sio is not None, "Socket.IO server should be created"
        
        app = create_socket_app()
        assert app is not None, "Socket.IO ASGI app should be created"


class TestAuthEvents:
    """Test authentication-related Socket.IO events."""
    
    @pytest.fixture
    def mock_user(self):
        """Create a mock user for testing."""
        user = MagicMock()
        user.id = "test-user-id"
        user.email = "test@example.com"
        user.is_active = True
        return user
        
    @pytest.mark.asyncio
    @patch('api.sockets.auth.get_user_from_token')
    async def test_authenticate_success(self, mock_get_user, mock_user):
        """Test successful authentication."""
        from api.sockets.auth import authenticate
        from api.sockets.server import user_sessions, session_users
        
        # Setup mock
        mock_get_user.return_value = mock_user
        
        # Clear session tracking for test
        user_sessions.clear()
        session_users.clear()
        
        sid = "test-sid"
        data = {"token": "valid-token"}
        
        # Test authentication
        with patch('api.sockets.auth.sync_to_async', side_effect=lambda f: lambda *args, **kwargs: 0):
            result = await authenticate(sid, data)
            
        assert result["status"] == "success", "Authentication should succeed"
        assert result["user_id"] == str(mock_user.id), "User ID should match"
        assert sid in session_users, "Session should be registered"
        
    @pytest.mark.asyncio
    @patch('api.sockets.auth.get_user_from_token')
    async def test_authenticate_invalid_token(self, mock_get_user):
        """Test authentication with invalid token."""
        from api.sockets.auth import authenticate
        
        # Setup mock
        mock_get_user.return_value = None
        
        sid = "test-sid"
        data = {"token": "invalid-token"}
        
        # Test authentication
        result = await authenticate(sid, data)
        
        assert result["status"] == "error", "Authentication should fail"
        assert "Invalid token" in result["message"], "Error message should indicate invalid token"


class TestMetricsEvents:
    """Test metrics-related Socket.IO functionality."""
    
    @pytest.mark.asyncio
    @patch('api.sockets.metrics.get_system_metrics')
    @patch('api.sockets.metrics.sio.emit')
    async def test_initial_metrics(self, mock_emit, mock_get_metrics):
        """Test that initial metrics are sent on connection."""
        from api.sockets.metrics import connect
        
        # Setup mock
        metrics = {"cpu_usage": 10, "memory_usage": 20}
        mock_get_metrics.return_value = metrics
        
        # Test initial metrics
        await connect("test-sid", {})
        
        mock_emit.assert_called_once_with('metrics_update', metrics, room="test-sid")


class TestNetworkEvents:
    """Test network-related Socket.IO events."""
    
    @pytest.mark.asyncio
    @patch('api.sockets.network.get_user_from_sid')
    async def test_get_network_map_authenticated(self, mock_get_user):
        """Test getting the network map when authenticated."""
        from api.sockets.network import get_network_map
        
        # Setup mock
        mock_user = MagicMock()
        mock_get_user.return_value = ("user-id", mock_user)
        
        # Patch the database operation
        with patch('api.sockets.network.sync_to_async', 
                  side_effect=lambda f: lambda *args, **kwargs: ([], [])):
            result = await get_network_map("test-sid")
        
        assert result["status"] == "success", "Should succeed for authenticated user"
        assert "devices" in result, "Should include devices list"
        assert "connections" in result, "Should include connections list"
        
    @pytest.mark.asyncio
    @patch('api.sockets.network.get_user_from_sid')
    async def test_get_network_map_unauthenticated(self, mock_get_user):
        """Test getting the network map when not authenticated."""
        from api.sockets.network import get_network_map
        
        # Setup mock for unauthenticated user
        mock_get_user.return_value = (None, None)
        
        result = await get_network_map("test-sid")
        
        assert result["status"] == "error", "Should fail for unauthenticated user"
        assert "Authentication required" in result["message"], "Error message should indicate auth required"


# Main test runner for manual testing
if __name__ == "__main__":
    print("This test module should be run with pytest")
