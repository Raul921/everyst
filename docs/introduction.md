# Introduction to Everyst

## What is Everyst?

Everyst is a modern server monitoring and security management platform built with React, TypeScript, and Django. It provides a clean, responsive interface for monitoring system metrics, visualizing network topology, and managing security settings.

The project aims to create a lightweight yet powerful alternative to traditional server management dashboards, focusing on speed, usability, and modern web technologies.

## Key Features

Everyst currently offers the following core features:

### Summit Dashboard
- Real-time system metrics monitoring (CPU, memory, disk, network)
- Server information display (hostname, OS, kernel, uptime)
- Overview of system status and health

### Glacier Network Visualization
- Interactive network topology map
- Device discovery and fingerprinting
- Connection visualization between devices
- Network scan capabilities

### GearRoom Network Tools
- Suite of network diagnostic tools
- Ping, traceroute, DNS lookup, and more
- Advanced terminal interface
- Network connection analysis

### Basecamp Service Integrations
- Integration with third-party security services
- Communication service connections
- Monitoring service connections
- Authentication service connections

### Climbers User Management
- User accounts and authentication
- Role-based access control
- User permission management

## System Requirements

### Server Requirements
- Operating System: Linux (recommended)
- Python 3.10+
- Node.js 18+
- Network interface for scanning
- Sufficient permissions for network operations

### Client Requirements
- Modern web browser with JavaScript enabled
- Chrome, Firefox, Safari, or Edge (latest versions)
- Minimum screen resolution of 1280x720

## Technical Foundation

### Frontend
- React + TypeScript
- Vite build system
- Tailwind CSS for styling
- Framer Motion for animations
- ReactFlow for network visualization
- Socket.IO client for real-time updates

### Backend
- Django (Python web framework)
- Socket.IO for WebSockets
- SQLite database (default)
- Network scanning libraries: python-nmap, scapy

## Project Status

Everyst is currently in **Alpha** stage. Core functionality is implemented and usable, but the project is still under active development. Features may change, and some planned components are not yet fully implemented.
