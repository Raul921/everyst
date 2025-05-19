# Release Notes

This document provides information about Everyst's version history and current status.

## Current Status

**Current Version**: Alpha 1.0

Everyst is currently in **Alpha** stage, which means:
- Core functionality is implemented and usable
- The project is under active development
- Features may change, and some planned components are not yet fully implemented
- Not recommended for production environments
- Early feedback is welcome to guide development

## Version History

### Alpha 1.0 (Current)

**Release Date**: 2025-05-15

**Core Features**:

- **Summit Dashboard**
  - Real-time system metrics display (CPU, memory, disk, network)
  - Server information overview
  - Status indicators

- **Glacier Network Map**
  - Interactive network visualization
  - Device discovery and scanning
  - Connection visualization
  - Basic network topology management

- **GearRoom Tools**
  - Network diagnostic tools
  - System terminal interface
  - Security analysis tools

- **Basecamp Integrations**
  - Service integration framework
  - Security service connections
  - Communication service connections
  - Monitoring service connections

- **Climbers User Management**
  - User account management
  - Role-based access control
  - Permission management

- **System Infrastructure**
  - Authentication system
  - WebSocket real-time updates
  - API endpoints
  - Network scanning engine

**Known Issues**:

- Network scanner may require elevated permissions for certain operations
- Some UI elements are not fully responsive on mobile devices
- WebSocket reconnection can be unstable in certain network conditions
- Limited browser compatibility (best with Chrome, Firefox, Edge)
- Documentation is still being expanded

**Limitations**:

- SQLite database only (PostgreSQL support planned)
- Limited to a single server monitoring configuration
- No built-in backup/restore functionality
- No automated update mechanism

## Planned Features

The following features are planned for future releases:

### Coming in Alpha 2.0

- **IceWall Security Module**
  - Firewall management
  - Security policy configuration
  - Vulnerability assessment

- **TrekLog Log Viewer**
  - Centralized log collection
  - Log search and filtering
  - Log analysis tools

- **Altitude Metrics**
  - Extended system metrics
  - Metric history and trends
  - Performance benchmarking

- **Avalanche Alerts**
  - Alert configuration
  - Alert history
  - Notification rules

- **Infrastructure Improvements**
  - PostgreSQL database support
  - Backup and restore functionality
  - Installation improvements

### Future Roadmap

- Multi-server monitoring
- Container monitoring
- Advanced authentication options
- Advanced reporting

## Changes and Improvements

### Refactoring Updates

A significant refactoring was completed before the Alpha 1.0 release:

- **Models Refactoring**: Organized models into domain-specific files
- **Socket.IO Refactoring**: Modular Socket.IO implementation
- **Network Scanner Service**: Improved scanning reliability
- **Views and Serializers**: Reorganized for better maintainability
- **ASGI Integration**: Unified server handling
- **Documentation**: Expanded for all components

## Installation Notes

### System Requirements

- **Operating System**: Linux (recommended)
- **Python**: 3.10+
- **Node.js**: 18.0+
- **Network**: Interface for scanning
- **Permissions**: Network capabilities for scanning

### Installation Process

See the [Installation Guide](./getting-started/installation.md) for detailed instructions.

## Upgrade Notes

As this is the initial Alpha release, there are no upgrade notes yet. Future releases will include upgrade instructions.

## Feedback and Bug Reports

We welcome feedback and bug reports to improve Everyst:

1. Use the GitHub issue tracker to report bugs
2. Include detailed information about your environment
3. Provide steps to reproduce any issues
4. Suggest improvements or features

## Support Resources

- [Documentation](./README.md): Comprehensive guides and references
- [Troubleshooting Guide](./troubleshooting.md): Solutions for common issues
- GitHub Issues: For bug reports and feature requests

## Acknowledgements

- **Logo Design**: Katie McKinlay
- **Contributors**: All who have contributed to making Everyst better
