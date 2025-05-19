# Everyst API Documentation

This document provides a comprehensive overview of the Everyst API endpoints, their functionality, required parameters, and response formats.

## Authentication Endpoints

### Register User
- **Endpoint:** `/api/auth/register/`
- **Method:** POST
- **Description:** Creates a new user account
- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string"
  }
  ```
- **Response:** User object with token
- **Status Codes:**
  - 201: User created
  - 400: Invalid request

### Login
- **Endpoint:** `/api/auth/login/`
- **Method:** POST
- **Description:** Authenticates a user and returns JWT tokens
- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "access": "string",
    "refresh": "string"
  }
  ```
- **Status Codes:**
  - 200: Success
  - 401: Invalid credentials

### Refresh Token
- **Endpoint:** `/api/auth/refresh/`
- **Method:** POST
- **Description:** Refreshes an expired JWT token
- **Request Body:**
  ```json
  {
    "refresh": "string"
  }
  ```
- **Response:**
  ```json
  {
    "access": "string"
  }
  ```
- **Status Codes:**
  - 200: Success
  - 401: Invalid token

### Check Users Exist
- **Endpoint:** `/api/auth/check-users/`
- **Method:** GET
- **Description:** Checks if any users exist in the system (useful for first-run setup)
- **Response:**
  ```json
  {
    "exists": "boolean"
  }
  ```
- **Status Codes:**
  - 200: Success

## User Management

### Users
- **Base URL:** `/api/users/`
- **Methods:** GET, POST, PUT, PATCH, DELETE
- **Description:** CRUD operations for user accounts
- **Endpoints:**
  - List users: GET `/api/users/`
  - Create user: POST `/api/users/`
  - Get user: GET `/api/users/{id}/`
  - Update user: PUT/PATCH `/api/users/{id}/`
  - Delete user: DELETE `/api/users/{id}/`

### User Roles
- **Base URL:** `/api/roles/`
- **Methods:** GET, POST, PUT, PATCH, DELETE
- **Description:** CRUD operations for user roles
- **Endpoints:**
  - List roles: GET `/api/roles/`
  - Create role: POST `/api/roles/`
  - Get role: GET `/api/roles/{id}/`
  - Update role: PUT/PATCH `/api/roles/{id}/`
  - Delete role: DELETE `/api/roles/{id}/`

## Network Management

### Network Devices
- **Base URL:** `/api/network/devices/`
- **Methods:** GET, POST, PUT, PATCH, DELETE
- **Description:** CRUD operations for network devices
- **Endpoints:**
  - List devices: GET `/api/network/devices/`
  - Create device: POST `/api/network/devices/`
  - Get device: GET `/api/network/devices/{id}/`
  - Update device: PUT/PATCH `/api/network/devices/{id}/`
  - Delete device: DELETE `/api/network/devices/{id}/`

### Network Connections
- **Base URL:** `/api/network/connections/`
- **Methods:** GET, POST, PUT, PATCH, DELETE
- **Description:** CRUD operations for connections between network devices
- **Endpoints:**
  - List connections: GET `/api/network/connections/`
  - Create connection: POST `/api/network/connections/`
  - Get connection: GET `/api/network/connections/{id}/`
  - Update connection: PUT/PATCH `/api/network/connections/{id}/`
  - Delete connection: DELETE `/api/network/connections/{id}/`

### Network Scans
- **Base URL:** `/api/network/scans/`
- **Methods:** GET, POST
- **Description:** Manage network scans
- **Endpoints:**
  - List scans: GET `/api/network/scans/`
  - Create scan: POST `/api/network/scans/`
  - Get scan: GET `/api/network/scans/{id}/`

### Network Topology
- **Endpoint:** `/api/network/topology/`
- **Method:** GET
- **Description:** Get the current network topology representation
- **Response:** Object containing devices and connections

## System Monitoring

### System Metrics
- **Base URL:** `/api/metrics/`
- **Methods:** GET, POST
- **Description:** System performance metrics
- **Endpoints:**
  - List metrics: GET `/api/metrics/`
  - Get specific metric: GET `/api/metrics/{id}/`

### Current Metrics
- **Endpoint:** `/api/system/metrics/current/`
- **Method:** GET
- **Description:** Get the current system metrics
- **Response:** Object containing current CPU, memory, disk, and network metrics

### Alerts
- **Base URL:** `/api/alerts/`
- **Methods:** GET, POST, PUT, PATCH, DELETE
- **Description:** System and network alert management
- **Endpoints:**
  - List alerts: GET `/api/alerts/`
  - Create alert: POST `/api/alerts/`
  - Get alert: GET `/api/alerts/{id}/`
  - Update alert: PUT/PATCH `/api/alerts/{id}/`
  - Delete alert: DELETE `/api/alerts/{id}/`

### Security Status
- **Base URL:** `/api/security/`
- **Methods:** GET, POST
- **Description:** System security status monitoring
- **Endpoints:**
  - Get security status: GET `/api/security/`
  - Get specific status: GET `/api/security/{id}/`

## Notifications

### Notifications
- **Base URL:** `/api/notifications/`
- **Methods:** GET, POST, DELETE
- **Description:** User notification management
- **Endpoints:**
  - List notifications: GET `/api/notifications/`
  - Create notification: POST `/api/notifications/`
  - Get notification: GET `/api/notifications/{id}/`
  - Delete notification: DELETE `/api/notifications/{id}/`
  - Mark as read: POST `/api/notifications/{id}/read/`

## Network Tools

### Ping Tool
- **Endpoint:** `/api/tools/ping/`
- **Method:** POST
- **Description:** Ping a host
- **Request Body:**
  ```json
  {
    "target": "string",
    "count": "integer",
    "timeout": "integer"
  }
  ```

### Nmap Tool
- **Endpoint:** `/api/tools/nmap/`
- **Method:** POST
- **Description:** Run nmap scan on target
- **Request Body:**
  ```json
  {
    "target": "string",
    "options": "string"
  }
  ```

### Dig Tool
- **Endpoint:** `/api/tools/dig/`
- **Method:** POST
- **Description:** DNS lookup using dig
- **Request Body:**
  ```json
  {
    "target": "string",
    "query_type": "string"
  }
  ```

### NSLookup Tool
- **Endpoint:** `/api/tools/nslookup/`
- **Method:** POST
- **Description:** DNS lookup using nslookup
- **Request Body:**
  ```json
  {
    "target": "string"
  }
  ```

### Traceroute Tool
- **Endpoint:** `/api/tools/traceroute/`
- **Method:** POST
- **Description:** Trace route to host
- **Request Body:**
  ```json
  {
    "target": "string"
  }
  ```

### Whois Tool
- **Endpoint:** `/api/tools/whois/`
- **Method:** POST
- **Description:** Domain whois lookup
- **Request Body:**
  ```json
  {
    "target": "string"
  }
  ```

### SSL Check Tool
- **Endpoint:** `/api/tools/ssl-check/`
- **Method:** POST
- **Description:** Check SSL certificate information
- **Request Body:**
  ```json
  {
    "target": "string",
    "port": "integer"
  }
  ```

### Netstat Tool
- **Endpoint:** `/api/tools/netstat/`
- **Method:** POST
- **Description:** Show network statistics
- **Request Body:**
  ```json
  {
    "options": "string"
  }
  ```

### IP Route Tool
- **Endpoint:** `/api/tools/ip-route/`
- **Method:** POST
- **Description:** Display routing table information
- **Request Body:**
  ```json
  {
    "options": "string"
  }
  ```

### TCPDump Tool
- **Endpoint:** `/api/tools/tcpdump/`
- **Method:** POST
- **Description:** Capture network packets
- **Request Body:**
  ```json
  {
    "interface": "string",
    "options": "string",
    "duration": "integer"
  }
  ```

## Health Check

### Health Check
- **Endpoint:** `/api/health/`
- **Method:** GET
- **Description:** Check API service health
- **Response:**
  ```json
  {
    "status": "string",
    "version": "string",
    "uptime": "string"
  }
  ```
- **Status Codes:**
  - 200: Service is healthy
  - 503: Service unhealthy
