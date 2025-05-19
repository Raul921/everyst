# Setting Up Development Environment

This guide will help you set up a development environment for Everyst.

## Prerequisites

Before starting, ensure you have the following installed:

- **Git**: For version control
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18.0 or latest version

## Building for Production

**Note**: Since Everyst is currently in alpha stage, production deployments are not recommended. The development setup is the preferred way to run the application.

However, if you want to test production-like builds for development purposes:

```bash
# This is for testing only and not recommended for actual deployments
# Build the frontend
npm run build

# Collect static files
cd backend
python manage.py collectstatic

# Note: Running with DEBUG=FALSE is not fully supported in the alpha stage
```
- **Virtual environment**: Python venv or similar

## Getting the Code

1. Fork the repository on GitHub (if you plan to contribute)
2. Clone the repository:
   ```bash
   git clone https://github.com/Jordonh18/Everyst.git
   # Or if you forked:
   git clone https://github.com/YOUR_USERNAME/Everyst.git
   cd Everyst
   ```

## Development Setup

### Automated Setup

The quickest way to get started is to use the included development setup script:

```bash
./setup-dev.sh
```

This script:
- Creates a Python virtual environment
- Installs backend dependencies
- Installs frontend dependencies
- Sets up the database with initial migrations
- Creates a development configuration file

### Manual Setup

If you prefer a manual setup or need more control:

#### Backend Setup

1. Create a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit the .env file with your preferred settings
   # For development, the defaults should work fine
   nano .env  # or use your preferred editor
   ```

4. Set up the database:
   ```bash
   cd backend
   python manage.py migrate
   ```

4. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

#### Frontend Setup

1. Install Node.js dependencies:
   ```bash
   cd .. # If you're in the backend directory
   npm install
   ```

## Running the Development Server

1. Activate the virtual environment (if not already active):
   ```bash
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Start the development server:
   ```bash
   sudo npm run dev
   ```

This single command will start both the backend and frontend servers simultaneously.

The application will be available at https://localhost:5173

Note: Since the development environment uses self-signed SSL certificates, you may need to accept security warnings in your browser.

### Alternative: Running Frontend and Backend Separately (Not Recommended)

While not recommended, if you want to run the servers separately:

```bash
# Run frontend only
npm run dev:frontend

# Run backend only (in another terminal)
source venv/bin/activate
npm run dev:backend
```

The frontend will be available at https://localhost:5173/

## Code Editors and IDE Setup

### Visual Studio Code

For VS Code, we recommend the following extensions:

- ESLint
- Prettier
- Python
- Django
- Tailwind CSS IntelliSense
- Python Test Explorer
- Git History
- GitLens

Recommended workspace settings (`settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### PyCharm

For PyCharm users:

1. Open the project folder
2. Set up the Python interpreter (point to the virtual environment)
3. Enable Django support in project settings
4. Configure ESLint and Prettier for the frontend code

## Environment Configuration

### Backend Configuration

Create a `.env` file in the `backend/everyst_api` directory:

```
DEBUG=True
SECRET_KEY=development_secret_key
ALLOWED_HOSTS=localhost,127.0.0.1
SOCKETIO_CORS_ALLOWED_ORIGINS=https://localhost:5173,https://localhost:8000
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### Frontend Configuration

Create a `.env` file in the root directory:

```
VITE_API_URL=https://localhost:8000/api
VITE_SOCKET_URL=https://localhost:8000
VITE_ENVIRONMENT=development
```

## Network Scanning Development

Network scanning requires elevated permissions for certain operations. For development purposes:

```bash
# Allow Python to use raw sockets (for ping, ARP scanning, etc.)
sudo setcap cap_net_raw,cap_net_admin=eip /path/to/venv/bin/python3
```

## Testing

### Backend Tests

Run Django tests:

```bash
cd backend
python manage.py test
```

Run specific tests:

```bash
python manage.py test api.tests.test_models
```

### Frontend Tests

Run Jest tests:

```bash
npm test
```

### End-to-End Tests

Coming soon with Cypress integration.

## Debugging

### Backend Debugging

Use Django's built-in debugging:

```python
import pdb; pdb.set_trace()
```

Or use the Python debugger in your IDE by setting breakpoints.

### Frontend Debugging

Use the browser's developer tools:
- React Developer Tools extension
- Redux DevTools extension (if using Redux)
- Chrome/Firefox debugging tools

## Linting and Code Quality

### Backend Linting

```bash
# Install linting tools
pip install black flake8

# Run linters
black backend/
flake8 backend/
```

### Frontend Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Type Checking

```bash
npm run typecheck
```

## Documentation

Generate backend API documentation:

```bash
# Install drf-spectacular
pip install drf-spectacular

# Generate OpenAPI schema
cd backend
python manage.py spectacular --file schema.yaml
```

## Database Management

### Django ORM

Access the Django shell:

```bash
cd backend
python manage.py shell
```

### Creating Migrations

After modifying models:

```bash
python manage.py makemigrations
python manage.py migrate
```

## Building for Production

To test a production build locally:

```bash
# Build the frontend
npm run build

# Collect static files
cd backend
python manage.py collectstatic

# Run with production-like settings
DEBUG=False python run_server.py
```

## Troubleshooting Common Development Issues

### Package Installation Issues

If you encounter issues with Python package installation:

```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Node Module Issues

If you encounter issues with Node.js dependencies:

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Socket.IO Connection Issues

If WebSocket connections fail:
1. Check that CORS settings are correct
2. Verify that the Socket.IO server is running
3. Check that the client is using the correct URL

### Database Reset

If you need to reset the database:

```bash
cd backend
rm -f db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```
