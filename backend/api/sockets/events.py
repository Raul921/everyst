"""
Common Socket.IO event handlers.

This module handles general purpose event handlers that don't fit into
more specialized categories like auth, network, or metrics.
"""

import logging
import asyncio
from typing import Dict, Any, Optional
from django.contrib.auth import get_user_model
from django.db import close_old_connections
from asgiref.sync import sync_to_async
from api.models.notification import Notification
from .server import sio, user_sessions, session_users

# Set up logging
logger = logging.getLogger('socket_server.events')

User = get_user_model()


@sio.event
async def send_notification(sid: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send a notification to a specific user.
    
    Args:
        sid: Socket.IO session ID of the sender
        data: Notification data including:
            - user_id: Target user ID
            - title: Notification title
            - message: Notification message (optional)
            - type: Notification type (info, success, warning, error)
            - duration: Duration to display (in ms, default 5000)
            - source: Source of the notification (default 'user')
            
    Returns:
        Dict: Result with status and message
    """
    try:
        # Extract notification data
        user_id = data.get('user_id')
        title = data.get('title', '')
        message = data.get('message', '')
        notification_type = data.get('type', 'info')
        duration = data.get('duration', 5000)
        source = data.get('source', 'user')
        
        if not user_id or not title:
            return {'status': 'error', 'message': 'Missing required fields (user_id, title)'}
        
        # Verify the notification type
        if notification_type not in ['info', 'success', 'warning', 'error']:
            notification_type = 'info'  # Default to info if invalid type
        
        # Create notification in database
        @sync_to_async
        def create_notification():
            close_old_connections()
            user = User.objects.filter(id=user_id).first()
            if not user:
                return None
                
            return Notification.objects.create(
                user=user,
                title=title,
                message=message,
                type=notification_type,
                is_system=False,
                source=source
            )
        
        db_notification = await create_notification()
        
        if not db_notification:
            return {'status': 'error', 'message': f'User {user_id} not found'}
            
        # Convert to dict for socket transmission
        @sync_to_async
        def notification_to_dict(notification):
            return notification.to_dict()
            
        notification = await notification_to_dict(db_notification)
        
        # Add duration for the toast
        notification['duration'] = duration
        
        # Send via websocket if user is connected
        if user_id in user_sessions:
            target_sid = user_sessions[user_id]
            await sio.emit('notification', notification, room=target_sid)
            logger.info(f"Notification sent to user {user_id}")
            return {'status': 'success', 'message': 'Notification sent'}
        else:
            logger.info(f"User {user_id} not connected, notification stored in database only")
            return {'status': 'success', 'message': 'Notification stored in database (user not connected)'}
    except Exception as e:
        logger.error(f"Failed to send notification: {e}")
        return {'status': 'error', 'message': str(e)}


@sio.event
async def get_notifications(sid: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get notifications for a user.
    
    Args:
        sid: Socket.IO session ID of the requester
        data: Request data including:
            - limit: Maximum number of notifications to retrieve (default 10)
            - offset: Pagination offset (default 0)
            
    Returns:
        Dict: Result with status, notifications list, and count
    """
    try:
        if sid not in session_users:
            return {'status': 'error', 'message': 'Unauthenticated user'}
            
        user_id = session_users[sid]
        limit = data.get('limit', 10)
        offset = data.get('offset', 0)
        
        # Validate and limit parameter values
        try:
            limit = min(max(int(limit), 1), 100)  # Between 1 and 100
            offset = max(int(offset), 0)  # Non-negative
        except (ValueError, TypeError):
            limit = 10
            offset = 0
        
        @sync_to_async
        def fetch_notifications():
            close_old_connections()
            user = User.objects.filter(id=user_id).first()
            if not user:
                return [], 0
                
            # Get system notifications and user notifications
            notifications = list(Notification.objects.filter(
                user=user
            ).order_by('-timestamp')[offset:offset+limit])
            
            # Get the total count
            total_count = Notification.objects.filter(user=user).count()
            
            # Convert to dicts
            notification_dicts = [notification.to_dict() for notification in notifications]
            
            return notification_dicts, total_count
        
        notifications, total_count = await fetch_notifications()
        
        return {
            'status': 'success',
            'notifications': notifications,
            'count': total_count
        }
    except Exception as e:
        logger.error(f"Failed to get notifications: {e}")
        return {'status': 'error', 'message': str(e)}


@sio.event
async def mark_notification_read(sid: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mark a notification as read.
    
    Args:
        sid: Socket.IO session ID of the requester
        data: Request data including:
            - notification_id: ID of the notification to mark as read
            
    Returns:
        Dict: Result with status and message
    """
    try:
        if sid not in session_users:
            return {'status': 'error', 'message': 'Unauthenticated user'}
            
        user_id = session_users[sid]
        notification_id = data.get('notification_id')
        
        if not notification_id:
            return {'status': 'error', 'message': 'Missing notification_id'}
            
        @sync_to_async
        def update_notification():
            close_old_connections()
            # Ensure user can only mark their own notifications as read
            notification = Notification.objects.filter(
                id=notification_id,
                user__id=user_id
            ).first()
            
            if not notification:
                return False
                
            notification.is_read = True
            notification.save()
            return True
            
        success = await update_notification()
        
        if success:
            return {'status': 'success', 'message': 'Notification marked as read'}
        else:
            return {'status': 'error', 'message': 'Notification not found'}
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {e}")
        return {'status': 'error', 'message': str(e)}
