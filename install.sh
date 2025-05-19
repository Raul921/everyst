#!/bin/bash
set -euo pipefail

# everyst Production Installation Script
echo "========================================="
echo "  everyst - Server Monitoring Dashboard  "
echo "        Production Installation Script     "
echo "========================================="

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Check if script was run with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run with sudo: sudo ./install.sh"
  exit 1
fi

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for curl
echo -e "\nChecking prerequisites..."
if ! command_exists curl; then
  echo "curl is not installed. It is required for some installation steps (e.g., Node.js)."
  echo "Please install curl (e.g., sudo apt install curl) and re-run this script."
  exit 1
else
  echo "curl found."
fi

# Check for OpenSSL
echo -e "\nChecking for OpenSSL..."
if ! command_exists openssl; then
  echo "OpenSSL is not installed. It is required for generating SSL certificates."
  read -p "Would you like to install OpenSSL now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command_exists apt-get; then
      apt-get update
      apt-get install -y openssl
    elif command_exists dnf; then
      dnf install -y openssl
    elif command_exists yum; then
      yum install -y openssl
    elif command_exists pacman; then
      pacman -Sy openssl
    else
      echo "Couldn't determine package manager. Please install OpenSSL manually."
      exit 1
    fi
  else
    echo "OpenSSL is required. Please install it manually."
    exit 1
  fi
else
  echo "OpenSSL found."
fi

# Check for Python 3.10+
echo -e "\n[1/13] Checking for Python 3.10+..."
if command_exists python3; then
  python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
  if [ "$(echo -e "$python_version\n3.10" | sort -V | head -n1)" != "3.10" ]; then
    echo "Python version is $python_version, which is below the required 3.10"
    read -p "Would you like to install Python 3.10+ now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      if command_exists apt-get; then
        apt-get update
        apt-get install -y python3.10 python3.10-venv python3-pip
      elif command_exists dnf; then
        dnf install -y python3.10 python3-pip
      elif command_exists yum; then
        yum install -y python3.10 python3-pip
      elif command_exists pacman; then
        pacman -Sy python python-pip
      else
        echo "Couldn't determine package manager. Please install Python 3.10+ manually."
        exit 1
      fi
    else
      echo "Python 3.10+ is required. Please install it manually."
      exit 1
    fi
  else
    echo "Python $python_version found. Requirement met."
  fi
else
  echo "Python 3 not found"
  read -p "Would you like to install Python 3.10+ now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command_exists apt-get; then
      apt-get update
      apt-get install -y python3.10 python3.10-venv python3-pip
    elif command_exists dnf; then
      dnf install -y python3.10 python3-pip
    elif command_exists yum; then
      yum install -y python3.10 python3-pip
    elif command_exists pacman; then
      pacman -Sy python python-pip
    else
      echo "Couldn't determine package manager. Please install Python 3.10+ manually."
      exit 1
    fi
  else
    echo "Python 3.10+ is required. Please install it manually."
    exit 1
  fi
fi

# Check for Node.js 18+
echo -e "\n[2/13] Checking for Node.js 18+..."
if command_exists node; then
  node_version=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
  if [ "$node_version" -lt 18 ]; then
    echo "Node.js version is $node_version, which is below the required 18"
    read -p "Would you like to install Node.js 18+ now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      if command_exists apt-get; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
      elif command_exists dnf; then
        dnf module install -y nodejs:18
      elif command_exists yum; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
      elif command_exists pacman; then
        pacman -Sy nodejs npm
      else
        echo "Couldn't determine package manager. Please install Node.js 18+ manually."
        exit 1
      fi
    else
      echo "Node.js 18+ is required. Please install it manually."
      exit 1
    fi
  else
    echo "Node.js v$node_version found. Requirement met."
  fi
else
  echo "Node.js not found"
  read -p "Would you like to install Node.js 18+ now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command_exists apt-get; then
      curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
      apt-get install -y nodejs
    elif command_exists dnf; then
      dnf module install -y nodejs:18
    elif command_exists yum; then
      curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
      yum install -y nodejs
    elif command_exists pacman; then
      pacman -Sy nodejs npm
    else
      echo "Couldn't determine package manager. Please install Node.js 18+ manually."
      exit 1
    fi
  else
    echo "Node.js 18+ is required. Please install it manually."
    exit 1
  fi
fi

# Check for npm/yarn
echo -e "\n[3/13] Checking for npm..."
if ! command_exists npm; then
  echo "npm not found"
  read -p "Would you like to install npm now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command_exists apt-get; then
      apt-get install -y npm
    elif command_exists dnf; then
      dnf install -y npm
    elif command_exists yum; then
      yum install -y npm
    elif command_exists pacman; then
      pacman -Sy npm
    else
      echo "Couldn't determine package manager. Please install npm manually."
      exit 1
    fi
  else
    echo "npm is required. Please install it manually."
    exit 1
  fi
else
  echo "npm found. Requirement met."
fi

# Create 'everyst' system user
echo -e "\n[4/13] Creating 'everyst' system user..."
if id "everyst" &>/dev/null; then
    echo "User 'everyst' already exists. Skipping creation."
else
    useradd --system --no-create-home --shell /bin/false everyst
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create 'everyst' user."
        exit 1
    fi
    echo "System user 'everyst' created successfully."
fi

# Create Python virtual environment if it doesn't exist
echo -e "\n[5/13] Creating Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create virtual environment."
        exit 1
    fi
    echo "Virtual environment created successfully."
else
    echo "Virtual environment already exists. Skipping creation."
fi

# Activate virtual environment
echo -e "\n[6/13] Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "Error: Failed to activate virtual environment."
    exit 1
fi
echo "Virtual environment activated."

# Install Python dependencies
echo -e "\n[7/13] Installing backend dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error: Failed to install Python dependencies."
    exit 1
fi
echo "Backend dependencies installed successfully."

# Run Django migrations
echo -e "\n[8/13] Creating and running database migrations..."
cd backend

# First run makemigrations
echo "Creating migrations with makemigrations..."
../venv/bin/python manage.py makemigrations
if [ $? -ne 0 ]; then
    echo "Error: Failed to create Django migrations."
    # Deactivate virtual environment before exiting
    deactivate
    exit 1
fi

# Then run migrations
echo "Applying migrations with migrate..."
../venv/bin/python manage.py migrate
if [ $? -ne 0 ]; then
    echo "Error: Failed to apply Django migrations."
    # Deactivate virtual environment before exiting
    deactivate
    exit 1
fi
echo "Database migrations completed successfully."
cd ..

# Install frontend dependencies
echo -e "\n[9/13] Installing frontend dependencies (for build process)..."
NPM_COMMAND="install"
if [ -f "package-lock.json" ]; then
  echo "Found package-lock.json, using 'npm ci' for cleaner install."
  NPM_COMMAND="ci"
else
  echo "No package-lock.json found, using 'npm install'."
fi

# Switch to non-root user if available
if [ -n "$SUDO_USER" ]; then
    chown -R $SUDO_USER:$SUDO_USER node_modules 2>/dev/null || true # Allow failure if node_modules doesn't exist yet
    su -c "npm $NPM_COMMAND" $SUDO_USER
else
    npm $NPM_COMMAND
fi
if [ $? -ne 0 ]; then
    echo "Error: Failed to install frontend dependencies."
    deactivate || true
    exit 1
fi
echo "Frontend dependencies installed successfully."

# Build frontend for production
echo -e "\n[10/13] Building frontend for production..."
# Determine user for build process. Prefer SUDO_USER if available.
BUILD_USER=${SUDO_USER:-root}

if [ "$BUILD_USER" != "root" ]; then
    echo "Running 'npm run build' as user $BUILD_USER..."
    # Ensure node_modules is accessible if it was created by root earlier in a mixed sudo/su case
    # And ensure the output directory can be written to by SUDO_USER
    mkdir -p "$SCRIPT_DIR/dist" # Vite typically builds to 'dist'
    chown -R "$BUILD_USER":"$(id -g -n "$BUILD_USER")" "$SCRIPT_DIR/node_modules" 2>/dev/null || true
    chown -R "$BUILD_USER":"$(id -g -n "$BUILD_USER")" "$SCRIPT_DIR/dist" 2>/dev/null || true

    if su -c "cd '$SCRIPT_DIR' && npm run build" "$BUILD_USER"; then
        echo "Frontend built successfully by $BUILD_USER."
    else
        echo "Error: Failed to build frontend as $BUILD_USER. Attempting as root..."
        if npm run build; then # This will run in $SCRIPT_DIR
            echo "Frontend built successfully by root after $BUILD_USER attempt failed."
        else 
            echo "Error: Failed to build frontend as root."
            deactivate || true
            exit 1
        fi
    fi
else # Running as root directly
    echo "Running 'npm run build' as root..."
    if npm run build; then # This will run in $SCRIPT_DIR
        echo "Frontend built successfully by root."
    else
        echo "Error: Failed to build frontend as root."
        deactivate || true
        exit 1
    fi
fi

# Set production permissions (after build)
echo -e "\n[11/13] Setting production file permissions for 'everyst' user..."

DB_PATH_PROD="$SCRIPT_DIR/backend/db.sqlite3"
MEDIA_PATH_PROD="$SCRIPT_DIR/backend/media"
BUILD_OUTPUT_DIR="$SCRIPT_DIR/dist" # Common for Vite projects

# Ownership and permissions for application files and directories
# Grant 'everyst' ownership of necessary files/dirs
chown -R everyst:everyst "$SCRIPT_DIR/venv"
chown -R everyst:everyst "$SCRIPT_DIR/backend"
# src and public are not directly served in prod if backend serves all, but good to secure
chown -R everyst:everyst "$SCRIPT_DIR/src" 2>/dev/null || true 
chown -R everyst:everyst "$SCRIPT_DIR/public" 2>/dev/null || true
if [ -d "$BUILD_OUTPUT_DIR" ]; then
    chown -R everyst:everyst "$BUILD_OUTPUT_DIR"
else
    echo "Warning: Build output directory '$BUILD_OUTPUT_DIR' not found. Static files might not be served correctly."
fi

# Readable by 'everyst', executable if a directory or script
chmod -R u=rX,g=rX,o-rwx "$SCRIPT_DIR/venv"
chmod -R u=rX,g=rX,o-rwx "$SCRIPT_DIR/backend" # everyst needs to execute manage.py, run_server.py
chmod -R u=rX,g=rX,o-rwx "$SCRIPT_DIR/src" 2>/dev/null || true
chmod -R u=rX,g=rX,o-rwx "$SCRIPT_DIR/public" 2>/dev/null || true
if [ -d "$BUILD_OUTPUT_DIR" ]; then
    chmod -R u=rX,g=rX,o-rwx "$BUILD_OUTPUT_DIR" # everyst (via Django) needs to read these
fi

# Root project files that might be needed (e.g. manage.py at root if it were there, or config files)
# For now, primarily ensuring backend scripts are executable by everyst
chmod u+x "$SCRIPT_DIR/backend/manage.py" "$SCRIPT_DIR/backend/run_server.py" 2>/dev/null || true

# Database permissions for 'everyst' user
if [ -f "$DB_PATH_PROD" ]; then
  chown everyst:everyst "$DB_PATH_PROD"
  chmod 600 "$DB_PATH_PROD" # Owner (everyst) can read/write, no one else
  echo "Database file '$DB_PATH_PROD' ownership set to 'everyst' with rw------- permissions."
else
  echo "Warning: Database file not found at $DB_PATH_PROD. Migrations should have created it."
fi

# Media directory permissions for 'everyst' user
if [ ! -d "$MEDIA_PATH_PROD" ]; then
  mkdir -p "$MEDIA_PATH_PROD"
  echo "Created media directory: $MEDIA_PATH_PROD"
fi
chown -R everyst:everyst "$MEDIA_PATH_PROD"
chmod -R u=rwX,g=rX,o-rwx "$MEDIA_PATH_PROD" # everyst:rwx, group:rx, others no access
echo "Media directory '$MEDIA_PATH_PROD' ownership and permissions set for 'everyst' user."

echo "General application file permissions configured for production."

# Generate SSL certificates
echo -e "\n[12/13] Generating self-signed SSL certificates..."
CERTS_DIR="$SCRIPT_DIR/certs"

# Remove existing certificates directory if it exists
if [ -d "$CERTS_DIR" ]; then
  echo "Removing existing certificates directory..."
  rm -rf "$CERTS_DIR"
fi

# Create new certificates directory
echo "Creating certificates directory..."
mkdir -p "$CERTS_DIR"

# Generate self-signed certificates
echo "Generating self-signed SSL certificates..."
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout "$CERTS_DIR/key.pem" \
  -out "$CERTS_DIR/cert.pem" \
  -days 365 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

if [ $? -eq 0 ]; then
  echo "SSL certificates generated successfully."
  # Set proper permissions for the everyst user
  chown -R everyst:everyst "$CERTS_DIR"
  chmod -R u=rX,g=,o= "$CERTS_DIR" # Only everyst can read
  echo "Certificate permissions set for 'everyst' user."
else
  echo "Error: Failed to generate SSL certificates."
  exit 1
fi

# Function to create systemd service file
create_systemd_service() {
  echo -e "\n[13/13] Optional: Create systemd service for everyst..."
  read -p "Would you like to create a systemd service file for everyst? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    SERVICE_FILE_PATH="/etc/systemd/system/everyst.service"

    echo "Creating systemd service file at $SERVICE_FILE_PATH..."
    # Ensure run_server.py is executable by everyst
    chmod u+x "$SCRIPT_DIR/backend/run_server.py"

    # Note: For a true production setup, run_server.py should ideally start a robust WSGI/ASGI server like Gunicorn or Daphne.
    # The ExecStart command below assumes run_server.py handles this or is a simple Django runserver (not ideal for prod load).
    cat << EOF > "$SERVICE_FILE_PATH"
[Unit]
Description=everyst Server Monitoring Dashboard
After=network.target

[Service]
User=everyst
Group=everyst
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/venv/bin/python $SCRIPT_DIR/backend/run_server.py
Restart=always
RestartSec=3
Environment="PYTHONUNBUFFERED=1"

[Install]
WantedBy=multi-user.target
EOF

    if [ $? -eq 0 ]; then
      echo "Systemd service file created successfully: $SERVICE_FILE_PATH"
      echo "To enable and start the service, run the following commands:"
      echo "  sudo systemctl daemon-reload"
      echo "  sudo systemctl enable everyst.service"
      echo "  sudo systemctl start everyst.service"
      echo "To check the status: sudo systemctl status everyst.service"
      echo "To see logs: sudo journalctl -u everyst.service"
    else
      echo "Error: Failed to create systemd service file."
      echo "Please check permissions or try creating it manually."
    fi
  else
    echo "Skipping systemd service file creation."
    echo "You can run the backend server manually using:"
    echo "  sudo -u everyst $SCRIPT_DIR/venv/bin/python $SCRIPT_DIR/backend/run_server.py"
  fi
}

# Call the function to offer systemd service creation
create_systemd_service

# Deactivate virtual environment if still active (should be)
deactivate || true

echo -e "\n========================================="
echo "  Production Installation Completed!     "
echo "========================================="
echo -e "\nA system user 'everyst' has been created and configured."
echo -e "The frontend application has been built for production."
echo -e "File permissions have been set for the 'everyst' user."

if [ -f "/etc/systemd/system/everyst.service" ] && [[ $(cat /etc/systemd/system/everyst.service 2>/dev/null) ]]; then
  echo -e "\nTo manage the everyst application service:"
  echo -e "  Start:   sudo systemctl start everyst.service"
  echo -e "  Stop:    sudo systemctl stop everyst.service"
  echo -e "  Restart: sudo systemctl restart everyst.service"
  echo -e "  Status:  sudo systemctl status everyst.service"
  echo -e "  Enable on boot: sudo systemctl enable everyst.service"
  echo -e "  Disable on boot: sudo systemctl disable everyst.service"
  echo -e "  View logs: sudo journalctl -u everyst.service -f"
else
  echo -e "\nSystemd service was not created."
  echo -e "To run the backend server manually as the 'everyst' user (for testing, not recommended for prod):
"
  echo -e "  sudo -u everyst $SCRIPT_DIR/venv/bin/python $SCRIPT_DIR/backend/run_server.py"
fi

echo -e "\nEnsure your Django settings (backend/everyst_api/settings.py) are configured for production:"
echo -e "  - DEBUG = False"
echo -e "  - ALLOWED_HOSTS = [your_server_ip_or_domain]"
echo -e "  - Static files configured to be served (Django typically collects them, or a web server like Nginx does)."
  echo -e "    (This script assumes run_server.py or your WSGI/ASGI server handles static files from the '$BUILD_OUTPUT_DIR' directory if DEBUG is False)"
echo -e "\nIt is highly recommended to use a robust WSGI/ASGI server (like Gunicorn or Daphne) and potentially a reverse proxy (like Nginx)"
echo -e "in front of the Django application for a true production deployment."
