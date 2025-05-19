# Environment Variables Guide

Everyst uses environment variables for configuration management, allowing you to customize settings without modifying source code. This approach enhances security by keeping sensitive information like API keys and database credentials separate from your codebase.

## Setting Up Your Environment

1. Copy the `.env.example` file to create your own `.env` file:

```bash
cp .env.example .env
```

2. Edit the `.env` file to customize settings for your environment.
3. For production environments, ensure sensitive values are properly secured.

## Environment Variable Categories

### Django Core Settings

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `SECRET_KEY` | Django's secret key for cryptographic operations | Random key generated at startup | `django-insecure-example-key-for-development-only` |
| `DEBUG` | Enable Django debug mode | `True` | `False` |
| `ALLOWED_HOSTS` | Comma-separated list of hosts/domains Django can serve | `*` | `example.com,api.example.com` |

### Redis Configuration (for Channels)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `REDIS_HOST` | Redis server hostname | `127.0.0.1` | `redis.example.com` |
| `REDIS_PORT` | Redis server port | `6379` | `6380` |

### JWT Authentication

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `JWT_ACCESS_TOKEN_LIFETIME_HOURS` | Lifetime of JWT access tokens in hours | `1` | `24` |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Lifetime of JWT refresh tokens in days | `1` | `7` |

### CORS Settings

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `CORS_ALLOW_ALL_ORIGINS` | Allow requests from all origins | `True` | `False` |
| `CORS_ALLOW_CREDENTIALS` | Allow cookies in cross-origin requests | `True` | `False` |

### Server Settings

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `EVERYST_DEV` | Enable development mode features | `True` | `False` |
| `API_HOST` | Host address for the API server | `localhost` | `0.0.0.0` |
| `API_PORT` | Port number for the API server | `8000` | `8443` |

### Frontend Settings

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_API_URL` | URL for the backend API | `https://localhost:8000/api` | `https://api.example.com/api` |
| `VITE_SOCKET_URL` | URL for WebSocket connections | `https://localhost:8000` | `https://ws.example.com` |
| `VITE_ENVIRONMENT` | Current environment | `development` | `production` |

### Logging

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `METRICS_LOG_LEVEL` | Log level for metrics module | `WARNING` | `DEBUG` |

## Using Environment Variables in Code

### In Django (Backend)

Environment variables are loaded automatically when the Django application starts:

```python
# Using environment variables in Django
import os

debug_mode = os.environ.get('DEBUG', 'True').lower() == 'true'
allowed_hosts = os.environ.get('ALLOWED_HOSTS', '*').split(',')
```

### In React (Frontend)

In the frontend, Vite automatically exposes environment variables prefixed with `VITE_`:

```typescript
// Using environment variables in React
const apiUrl = import.meta.env.VITE_API_URL;
const socketUrl = import.meta.env.VITE_SOCKET_URL;
const environment = import.meta.env.VITE_ENVIRONMENT;
```

## Environment-Specific Considerations

### Development Environment

For local development:
- `DEBUG=True` is appropriate for detailed error information
- `ALLOWED_HOSTS=*` simplifies testing
- Self-signed SSL certificates are used for HTTPS

### Production Environment

For production deployment:
- Set `DEBUG=False` to hide detailed error information
- Specify exact hostnames in `ALLOWED_HOSTS`
- Use valid SSL certificates
- Consider increasing JWT token lifetimes
- Set `CORS_ALLOW_ALL_ORIGINS=False` and configure specific allowed origins

## Security Best Practices

1. **Never commit `.env` files to version control**
2. Use strong, unique values for `SECRET_KEY` in production
3. Limit `ALLOWED_HOSTS` to necessary domains in production
4. Set appropriate JWT token lifetimes based on security requirements
5. Configure CORS settings to allow only trusted origins in production

## Troubleshooting

If your application is not picking up environment variables:

1. Ensure the `.env` file is in the correct location (project root)
2. Verify the format of your variables (no spaces around `=`)
3. Check for syntax errors in the `.env` file
4. Restart the application after making changes to environment variables
