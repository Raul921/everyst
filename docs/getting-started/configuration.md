# Configuration

This guide covers the configuration options available for customizing your Everyst installation.

## Configuration Files

Everyst uses several configuration files to control its behavior:

### Backend Configuration

The main backend settings are located in:
- `backend/everyst_api/settings.py` - Django settings

### Frontend Configuration

Frontend configuration files include:
- `vite.config.ts` - Vite build configuration (includes HTTPS configuration)
- `tailwind.config.js` - Tailwind CSS configuration
- `certs/` - Contains SSL certificates for HTTPS (self-signed certificates for development)

## Environment Variables

Everyst uses environment variables stored in a `.env` file at the root of the project directory for configuration. This provides a centralized way to manage settings for both backend and frontend.

For detailed information about available environment variables, see the [Environment Variables Guide](./environment-variables.md).

### Setting Up Environment Variables

1. Copy the example file to create your own environment configuration:

```bash
cp .env.example .env
```

2. Edit the `.env` file with your desired settings:

```bash
nano .env
```

## Backend Configuration Options

### Django Settings

Key settings in `settings.py` that are configured via environment variables:

- `DEBUG`: Controls Django's debug mode (set via `DEBUG` environment variable)
- `ALLOWED_HOSTS`: List of hostnames the server can serve (set via `ALLOWED_HOSTS` environment variable)
- `SECRET_KEY`: Used for cryptographic signing (set via `SECRET_KEY` environment variable)
- `CORS`: Cross-Origin Resource Sharing settings (set via CORS_* environment variables)
- `JWT`: JSON Web Token settings for authentication (set via JWT_* environment variables)
- `REDIS`: Redis connection settings for WebSockets (set via REDIS_* environment variables)
- `LOGGING`: Logging configuration including log levels (set via METRICS_LOG_LEVEL)
