# Security Hardening Guide

This document provides guidelines for hardening the security of your Everyst deployment in production environments.

## Table of Contents
- [Production Configuration](#production-configuration)
- [Authentication](#authentication)
- [Database Security](#database-security)
- [Network Security](#network-security)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Regular Maintenance](#regular-maintenance)

## Production Configuration

When deploying Everyst in a production environment, ensure the following settings in your `.env` file:

```
# Set to False in production
DEBUG=False
DEBUG_MODE=False

# Restrict allowed hosts to your domain(s)
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Use a strong, unique secret key
SECRET_KEY=<generate-a-strong-random-key>

# Enforce HTTPS
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Set appropriate CORS restrictions
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

## Authentication

### Password Policy
Everyst includes a customizable password policy. Consider these settings for production:

```
# Minimum password length (default: 10)
# Set higher (12-14) for more security
PASSWORD_MIN_LENGTH=12

# Password expiration in days (default: 90)
# Set to 0 to disable expiration
PASSWORD_EXPIRY_DAYS=90

# Number of previous passwords to check (default: 10)
PASSWORD_HISTORY_LENGTH=10

# Maximum login attempts before account lockout (default: 5)
MAX_LOGIN_ATTEMPTS=5

# Account lockout duration in minutes (default: 15)
ACCOUNT_LOCKOUT_DURATION=30
```

### JWT Token Configuration
For JWT token security:

```
# Shorter access token lifetime increases security
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15

# Balance security with user experience for refresh tokens
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# Enable token rotation
JWT_ROTATE_REFRESH_TOKENS=True
```

## Database Security

### Database Connection
If using PostgreSQL (recommended for production):

```
# Use environment variables for database credentials
DB_ENGINE=django.db.backends.postgresql
DB_NAME=everyst_db
DB_USER=<db-user>
DB_PASSWORD=<strong-password>
DB_HOST=localhost
DB_PORT=5432
```

### Database Backup
Implement regular database backups:

1. Set up automated daily backups
2. Store backups in a secure, encrypted location
3. Test restoration procedures regularly
4. Retain backups according to your data retention policy

## Network Security

### HTTPS Configuration
Always use HTTPS in production with properly configured certificates:

1. Obtain SSL certificates from a trusted certificate authority
2. Configure your web server (Nginx/Apache) for HTTPS
3. Implement HTTP to HTTPS redirection
4. Use HTTP Strict Transport Security (HSTS)
5. Keep certificates up-to-date (use automated renewal with Let's Encrypt)

### Firewall Configuration
Implement network firewall rules:

1. Only expose necessary ports (typically 80/443)
2. Restrict SSH access to trusted IP addresses
3. Use a Web Application Firewall (WAF) for additional protection
4. Implement rate limiting to prevent brute force attacks

## Monitoring and Alerting

### Security Monitoring
Enable comprehensive security monitoring:

1. Configure the built-in Everyst security activity logs
2. Set up alerts for suspicious activities:
   - Failed login attempts
   - Password changes
   - Permission changes
   - User creation/deletion
3. Implement centralized logging for all system components

### Performance Monitoring
Monitor system performance:

1. Track server resource utilization
2. Set up alerts for abnormal resource usage
3. Monitor API request rates and response times
4. Track database performance metrics

## Regular Maintenance

### Updates and Patches
Maintain system security with regular updates:

1. Keep the Everyst application updated to the latest version
2. Apply security patches to your OS and all dependencies
3. Subscribe to security mailing lists for components you use
4. Regularly update your SSL certificates

### Security Audits
Perform periodic security reviews:

1. Conduct regular security assessments
2. Review user access permissions
3. Audit security logs for suspicious activity
4. Test backup and recovery procedures
5. Perform penetration testing annually

By following these guidelines, you can significantly enhance the security posture of your Everyst deployment. Adapt these recommendations based on your specific environment, risk tolerance, and compliance requirements.
