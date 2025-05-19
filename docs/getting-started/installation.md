# Installation Guide

This guide provides step-by-step instructions to install Everyst on your server.

## Prerequisites

Before installing Everyst, ensure your system meets the following requirements:

- **Operating System**: Linux (recommended)
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher
- **npm**: Latest version
- **Virtual environment**: Python venv (recommended)
- **curl**: For downloading installation scripts

## Installation Options

### Option 1: Development Setup (Recommended for Contributors)

This method sets up Everyst for development and testing:

1. Clone the repository:
   ```bash
   git clone https://github.com/Jordonh18/Everyst.git
   cd Everyst
   ```

2. Run the development setup script:
   ```bash
   ./setup-dev.sh
   ```

   The script performs the following actions:
   - Creates a Python virtual environment
   - Installs Python dependencies from requirements.txt
   - Installs Node.js dependencies
   - Sets up the database with initial migrations
   - Creates a development configuration file

3. After the script completes, activate the virtual environment:

   ```bash
   source venv/bin/activate
   ```

4. Start the development server:

   ```bash
   sudo npm run dev
   ```

   This single command will start both the backend and frontend servers simultaneously.

4. Access the application:
   - Frontend: https://localhost:5173
   - Backend API: https://localhost:8000/api
   - Admin interface: https://localhost:8000/admin
   
   Note: Since the development environment uses self-signed SSL certificates, you may need to accept security warnings in your browser.

### Option 2: Production Setup (Not Recommended)

**IMPORTANT**: As Everyst is currently in **Alpha** stage, production deployments are **not recommended**. The production setup script is still under development and not ready for use. The development setup above is the recommended way to install and test Everyst at this time.

## Manual Installation

If you prefer to install manually or the automated scripts don't work for your environment:

1. Clone the repository:
   ```bash
   git clone https://github.com/Jordonh18/Everyst.git
   cd Everyst
   ```

2. Set up the Python environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. Set up the database:
   ```bash
   cd backend
   python manage.py migrate
   python manage.py createsuperuser
   cd ..
   ```

4. Install frontend dependencies:
   ```bash
   npm install
   ```

5. After the virtual environment is activated, start the development server:
   ```bash
   sudo npm run dev
   ```

   This single command will start both the frontend and backend servers simultaneously. Since Everyst is in an alpha stage, this is the recommended way to run the application.

## Installation Verification

To verify that your installation is working correctly:

1. The application should be accessible at https://localhost:5173
   
   Note: Since the development environment uses self-signed SSL certificates, you may need to accept security warnings in your browser.
2. You should be able to log in with the superuser credentials you created
3. The dashboard should display system information
4. WebSocket connections should establish successfully (visible in browser console)

## Common Installation Issues

### Python Dependencies

If you encounter issues with Python dependencies:
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Node.js Dependencies

If you encounter issues with Node.js dependencies:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Database Migration Issues

If database migrations fail:
```bash
cd backend
rm -f db.sqlite3
python manage.py makemigrations api
python manage.py migrate
```

### Permission Issues

For network scanning functionality, the application may require elevated permissions:

```bash
# For network scanning capabilities
sudo setcap cap_net_raw,cap_net_admin=eip /path/to/venv/bin/python3
```

## Next Steps

After installation:

1. Proceed to [Configuration](./configuration.md) to customize your Everyst installation
2. Follow the [First Run Setup](./first-run-setup.md) guide to initialize your system
