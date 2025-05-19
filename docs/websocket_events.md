# Everyst WebSocket Events Documentation

This document provides details about the WebSocket events supported by the Everyst platform, including event names, parameters, and response formats.

## Connection and Authentication

### Authentication Flow

1. Connect to the WebSocket server with authentication token in the connection parameters
2. Socket.IO authenticates based on the token
3. If authentication succeeds, the connection is established
4. If authentication fails, the connection is rejected with an error

## System Events

### Connection Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Server → Client | Emitted when the connection is established |
| `disconnect` | Server → Client | Emitted when the connection is closed |
| `error` | Server → Client | Emitted when an error occurs |
| `reconnect` | Server → Client | Emitted when reconnection succeeds |
| `reconnect_attempt` | Server → Client | Emitted before a reconnection attempt |
| `reconnect_error` | Server → Client | Emitted when a reconnection attempt fails |

## User and Authentication Events

### authenticate
- **Direction:** Client → Server
- **Description:** Authenticate with the WebSocket server
- **Parameters:**
  ```json
  {
    "token": "JWT_TOKEN_STRING"
  }
  ```
- **Response:**
  ```json
  {
    "status": "success|error",
    "user_id": "string",
    "message": "string"
  }
  ```

### get_user_info
- **Direction:** Client → Server
- **Description:** Get current user information
- **Parameters:** None
- **Response:**
  ```json
  {
    "status": "success|error",
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "is_active": "boolean",
      "is_staff": "boolean",
      "roles": ["string"]
    }
  }
  ```

## Notification Events

### notification
- **Direction:** Server → Client
- **Description:** Receive a notification
- **Payload:**
  ```json
  {
    "id": "string",
    "title": "string",
    "message": "string",
    "type": "info|success|warning|error",
    "is_read": "boolean",
    "is_system": "boolean",
    "created_at": "ISO datetime",
    "duration": "number",
    "source": "string"
  }
  ```

### send_notification
- **Direction:** Client → Server
- **Description:** Send a notification to a user
- **Parameters:**
  ```json
  {
    "user_id": "string",
    "title": "string",
    "message": "string",
    "type": "info|success|warning|error",
    "duration": "number",
    "source": "string"
  }
  ```
- **Response:**
  ```json
  {
    "status": "success|error",
    "message": "string"
  }
  ```

## Network Events

### get_network_map
- **Direction:** Client → Server
- **Description:** Get the current network map
- **Parameters:** None or filter parameters
- **Response:**
  ```json
  {
    "status": "success|error",
    "devices": [
      {
        "id": "string",
        "label": "string",
        "ip_address": "string",
        "mac_address": "string",
        "device_type": "string",
        "is_online": "boolean",
        "details": {
          "vendor": "string",
          "hostname": "string",
          "os": "string",
          "last_seen": "ISO datetime",
          "ports": [
            {
              "port": "number",
              "protocol": "string",
              "service": "string",
              "state": "string"
            }
          ],
          "icon": "string"
        }
      }
    ],
    "connections": [
      {
        "id": "string",
        "source_id": "string",
        "target_id": "string",
        "connection_type": "string",
        "strength": "number",
        "is_active": "boolean"
      }
    ]
  }
  ```

### start_network_scan
- **Direction:** Client → Server
- **Description:** Start a network scan
- **Parameters:**
  ```json
  {
    "scan_type": "discovery|full|targeted|ports",
    "target": "string",
    "options": {
      "timeout": "number",
      "parallel": "boolean",
      "ports": "string",
      "scan_intensity": "light|normal|aggressive"
    }
  }
  ```
- **Response:**
  ```json
  {
    "status": "success|error",
    "scan_id": "string",
    "message": "string"
  }
  ```

### cancel_network_scan
- **Direction:** Client → Server
- **Description:** Cancel an ongoing network scan
- **Parameters:**
  ```json
  {
    "scan_id": "string"
  }
  ```
- **Response:**
  ```json
  {
    "status": "success|error",
    "message": "string"
  }
  ```

### get_network_scan_status
- **Direction:** Client → Server
- **Description:** Get the status of network scans
- **Parameters:** None or filter by scan ID
- **Response:**
  ```json
  {
    "status": "success|error",
    "active_scans": [
      {
        "scan_id": "string",
        "scan_type": "string",
        "target": "string",
        "status": "string",
        "progress": "number",
        "started_at": "ISO datetime",
        "message": "string"
      }
    ],
    "completed_scans": [
      {
        "scan_id": "string",
        "scan_type": "string",
        "target": "string",
        "status": "string",
        "completed_at": "ISO datetime",
        "result_summary": "string"
      }
    ]
  }
  ```

### scan_progress
- **Direction:** Server → Client
- **Description:** Notification of scan progress
- **Payload:**
  ```json
  {
    "scan_id": "string",
    "progress": "number",
    "status": "string",
    "message": "string",
    "discovered_devices": "number",
    "discovered_ports": "number",
    "discovered_services": "number",
    "elapsed_time": "string"
  }
  ```

### scan_complete
- **Direction:** Server → Client
- **Description:** Notification that scan is complete
- **Payload:**
  ```json
  {
    "scan_id": "string",
    "status": "string",
    "message": "string",
    "total_devices": "number",
    "total_ports": "number",
    "total_services": "number",
    "elapsed_time": "string",
    "completed_at": "ISO datetime"
  }
  ```

### device_status_change
- **Direction:** Server → Client
- **Description:** Notification of device status change
- **Payload:**
  ```json
  {
    "device_id": "string",
    "is_online": "boolean",
    "last_seen": "ISO datetime",
    "status_change": "string"
  }
  ```

### device_discovered
- **Direction:** Server → Client
- **Description:** Notification of newly discovered device
- **Payload:**
  ```json
  {
    "device": {
      "id": "string",
      "label": "string",
      "ip_address": "string",
      "mac_address": "string",
      "device_type": "string",
      "is_online": "boolean",
      "details": {
        "vendor": "string",
        "hostname": "string",
        "os": "string",
        "last_seen": "ISO datetime",
        "ports": [],
        "icon": "string"
      }
    }
  }
  ```

## System Metrics Events

### get_current_metrics
- **Direction:** Client → Server
- **Description:** Get current system metrics
- **Parameters:** None
- **Response:**
  ```json
  {
    "status": "success|error",
    "metrics": {
      "cpu": {
        "usage_percent": "number",
        "temperature": "number",
        "load": [
          "number",
          "number",
          "number"
        ]
      },
      "memory": {
        "total": "number",
        "used": "number",
        "free": "number",
        "usage_percent": "number"
      },
      "disk": {
        "total": "number",
        "used": "number",
        "free": "number",
        "usage_percent": "number"
      },
      "network": {
        "bytes_sent": "number",
        "bytes_received": "number",
        "packets_sent": "number",
        "packets_received": "number"
      },
      "timestamp": "ISO datetime"
    }
  }
  ```

### metrics_update
- **Direction:** Server → Client
- **Description:** System metrics update
- **Payload:**
  ```json
  {
    "metrics": {
      "cpu": {
        "usage_percent": "number",
        "temperature": "number",
        "load": [
          "number",
          "number",
          "number"
        ]
      },
      "memory": {
        "total": "number",
        "used": "number",
        "free": "number",
        "usage_percent": "number"
      },
      "disk": {
        "total": "number",
        "used": "number",
        "free": "number",
        "usage_percent": "number"
      },
      "network": {
        "bytes_sent": "number",
        "bytes_received": "number",
        "packets_sent": "number",
        "packets_received": "number"
      },
      "timestamp": "ISO datetime"
    }
  }
  ```

### set_metrics_interval
- **Direction:** Client → Server
- **Description:** Set the interval for metrics updates
- **Parameters:**
  ```json
  {
    "interval": "number"
  }
  ```
- **Response:**
  ```json
  {
    "status": "success|error",
    "message": "string",
    "interval": "number"
  }
  ```

### alert
- **Direction:** Server → Client
- **Description:** System or network alert
- **Payload:**
  ```json
  {
    "id": "string",
    "title": "string",
    "message": "string",
    "alert_type": "system|network|security",
    "severity": "info|warning|critical",
    "source": "string",
    "created_at": "ISO datetime"
  }
  ```

## Other Notes

For all events:
- Authentication is required for most events
- Events without proper authentication will return an error with status "error" and message "Authentication required"
- For errors in event handling, the response will include a status "error" and a message explaining the error
