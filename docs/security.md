# Security

This document outlines the security aspects of Everyst, including best practices, authentication, and permission management.

## Security Architecture

Everyst implements multiple layers of security:

1. **Authentication** - User identity verification
2. **Authorization** - Permission-based access control
3. **Data Protection** - Secure data storage and transmission
4. **Network Security** - Secure communication channels
5. **System Security** - Protection of the host system

## Authentication System

### JWT Authentication

Everyst uses JSON Web Tokens (JWT) for authentication:

- **Access Tokens**: Short-lived tokens for API access
- **Refresh Tokens**: Longer-lived tokens for refreshing access
- **Token Storage**: Tokens stored in browser localStorage
- **Token Validation**: Server-side validation on each request

### Authentication Flow

1. User submits credentials to `/api/auth/login/`
2. Server validates credentials and generates JWT tokens
3. Tokens are returned to the client
4. Client includes the access token in subsequent requests
5. When the access token expires, the refresh token is used to obtain a new one

### Multi-Factor Authentication

MFA support is planned for future releases and will include:
- Time-based One-Time Password (TOTP)
- Email verification codes
- Integration with external MFA providers

## Permission System

### Role-Based Access Control

The permission system is based on user roles:

1. **Owner**: Complete system access (one per installation)
2. **Administrator**: System management capabilities
3. **User**: Standard functionality access
4. **Viewer**: Read-only access

### Permission Implementation

Permissions are implemented at multiple levels:

1. **API Level**: Django permissions classes
2. **Object Level**: Object-specific permissions
3. **Frontend Level**: UI elements conditionally rendered
4. **WebSocket Level**: Event access control

### Custom Permissions

Custom permissions are stored in the `UserRole` model as a JSON field:

```json
{
  "dashboard": {
    "view": true,
    "manage": false
  },
  "network": {
    "view": true,
    "scan": false,
    "manage": false
  },
  "users": {
    "view": true,
    "manage": false
  }
}
```

## Data Protection

### Sensitive Data Handling

Everyst implements the following practices for sensitive data:

1. **Password Storage**: Passwords are hashed using Django's PBKDF2 algorithm
2. **API Keys**: Third-party API keys are encrypted before storage
3. **PII Handling**: Personal identifiable information is minimized

### Data Encryption

1. **In Transit**: All communication uses TLS/HTTPS
2. **Authentication**: JWT tokens are signed to prevent tampering
3. **Database**: Sensitive fields can be encrypted using field-level encryption

## Network Security

### API Security

REST API security measures include:

1. **HTTPS**: All API traffic is encrypted
2. **CORS**: Cross-Origin Resource Sharing restrictions
3. **Rate Limiting**: Protection against brute force attacks
4. **Input Validation**: All inputs are validated and sanitized

### WebSocket Security

WebSocket connections are secured by:

1. **Authentication**: JWT token verification
2. **Message Validation**: All incoming messages are validated
3. **Connection Limits**: Protection against DoS attacks

## Network Scanning Security

The network scanning functionality has security restrictions:

1. **Permission Control**: Only authorized users can initiate scans
2. **Scan Limits**: Rate limiting on scan frequency
3. **Scope Restriction**: Scanning limited to configured networks
4. **Audit Logging**: All scan activity is logged

## System Security

### Running with Least Privilege

For production deployments, Everyst should run with limited privileges:

1. **Dedicated User**: Create a dedicated system user for Everyst
2. **Limited Permissions**: Grant only necessary permissions
3. **Capability-based Access**: Use Linux capabilities for specific operations

Example setup for network scanning capabilities:

```bash
# Grant only necessary capabilities to the Python interpreter
sudo setcap cap_net_raw,cap_net_admin=eip /path/to/venv/bin/python3
```

### Secure Configuration

Follow these guidelines for secure configuration:

1. **Disable Debug Mode**: Set `DEBUG=False` in production
2. **Secret Key**: Use a strong, unique secret key
3. **ALLOWED_HOSTS**: Restrict to specific hosts
4. **CSRF Protection**: Ensure CSRF protection is enabled
5. **Secure Cookies**: Enable secure and HTTP-only cookies

Example secure settings:

```python
DEBUG = False
SECRET_KEY = 'generate_a_strong_random_key'
ALLOWED_HOSTS = ['Everyst.example.com']
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True
```

## Audit and Monitoring

### Security Logging

Everyst logs security events:

1. **Authentication Events**: Login attempts, password changes
2. **Permission Changes**: Role and permission modifications
3. **Network Scanning**: Scan initiation and results
4. **System Changes**: Configuration modifications

### Monitoring Capabilities

Security events are monitored through:

1. **Dashboard Alerts**: Security incidents shown in the UI
2. **Log Analysis**: Backend log processing
3. **Integration**: Optional forwarding to external SIEM systems

## Security Best Practices

### For Administrators

1. **Regular Updates**: Keep Everyst and its dependencies updated
2. **Strong Passwords**: Enforce strong password policies
3. **Principle of Least Privilege**: Grant minimal necessary permissions
4. **Network Isolation**: Run Everyst in a controlled network environment
5. **Backup Strategy**: Regularly backup configuration and data

### For Users

1. **Password Management**: Use strong, unique passwords
2. **Session Security**: Log out after use, especially on shared computers
3. **Access Control**: Only use features necessary for your role
4. **Report Incidents**: Report any suspicious behavior

## Security Roadmap

Future security enhancements planned for Everyst:

1. **Multi-Factor Authentication**: Additional authentication factors
2. **Advanced Audit Logging**: More detailed security event tracking
3. **Vulnerability Scanning**: Integrated vulnerability assessment
4. **Security Notifications**: Automated security alerts
5. **API Key Management**: Enhanced handling of third-party credentials

## Security Vulnerability Reporting

If you discover a security vulnerability in Everyst:

1. Do NOT disclose it publicly in issues or forums
2. Email the vulnerability details to the maintainers
3. Allow time for the issue to be addressed before disclosure
4. Provide sufficient information to reproduce and fix the issue
