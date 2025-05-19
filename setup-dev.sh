#!/bin/bash
set -euo pipefail

# everyst Development Environment Setup Script
echo "========================================="
echo "  everyst - Development Setup Script     "
echo "========================================="

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# We require sudo privileges for package installations, but we want
# to ensure all created files are owned by the regular user
if [ "$EUID" -eq 0 ] && [ -z "${SUDO_USER:-}" ]; then
  echo "Please run this script with sudo (not as root directly)."
  echo "This ensures all files remain owned by your user account."
  exit 1
fi

# Set the DEV_USER variable early to use throughout the script
DEV_USER=${SUDO_USER:-$(whoami)} # Fallback to current user if not run with sudo
DEV_GROUP=$(id -g -n "$DEV_USER" 2>/dev/null || echo "$DEV_USER")

# Helper function to set correct ownership on a path
ensure_user_ownership() {
  local path="$1"
  local is_recursive=${2:-true}
  
  if [ "$is_recursive" = true ]; then
    chown -R "$DEV_USER":"$DEV_GROUP" "$path"
  else
    chown "$DEV_USER":"$DEV_GROUP" "$path"
  fi
}

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# --- Prerequisite Checks ---
echo -e "\\nChecking prerequisites..."

# Check for OpenSSL
if ! command_exists openssl; then
  echo "openssl is not installed. It is required for generating SSL certificates."
  read -p "Would you like to install openssl now? (y/n) " -n 1 -r; echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command_exists apt-get; then sudo apt-get update && sudo apt-get install -y openssl;
    elif command_exists dnf; then sudo dnf install -y openssl;
    elif command_exists yum; then sudo yum install -y openssl;
    elif command_exists pacman; then sudo pacman -Sy openssl --noconfirm;
    else echo "Couldn't determine package manager. Please install openssl manually."; exit 1; fi
  else echo "openssl is required for SSL certificates. Please install it manually."; exit 1; fi
else
  echo "openssl found."
fi

# Check for curl
if ! command_exists curl; then
  echo "curl is not installed. It is required for some installation steps (e.g., Node.js)."
  read -p "Would you like to install curl now? (y/n) " -n 1 -r; echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command_exists apt-get; then sudo apt-get update && sudo apt-get install -y curl;
    elif command_exists dnf; then sudo dnf install -y curl;
    elif command_exists yum; then sudo yum install -y curl;
    elif command_exists pacman; then sudo pacman -Sy curl --noconfirm;
    else echo "Couldn't determine package manager. Please install curl manually."; exit 1; fi
  else echo "curl is required. Please install it manually."; exit 1; fi
else
  echo "curl found."
fi

# Check for Python 3.10+
echo -e "\\n[1/5] Checking for Python 3.10+..."
if command_exists python3; then
  python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
  if [ "$(echo -e "$python_version\\n3.10" | sort -V | head -n1)" != "3.10" ]; then
    echo "Python version is $python_version, which is below the required 3.10"
    read -p "Would you like to install Python 3.10+ now? (y/n) " -n 1 -r; echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      if command_exists apt-get; then sudo apt-get update && sudo apt-get install -y python3.10 python3.10-venv python3-pip;
      elif command_exists dnf; then sudo dnf install -y python3.10 python3-pip;
      elif command_exists yum; then sudo yum install -y python3.10 python3-pip;
      elif command_exists pacman; then sudo pacman -Sy python python-pip --noconfirm;
      else echo "Couldn't determine package manager. Please install Python 3.10+ manually."; exit 1; fi
    else echo "Python 3.10+ is required. Please install it manually."; exit 1; fi
  else echo "Python $python_version found. Requirement met."; fi
else
  echo "Python 3 not found"
  read -p "Would you like to install Python 3.10+ now? (y/n) " -n 1 -r; echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command_exists apt-get; then sudo apt-get update && sudo apt-get install -y python3.10 python3.10-venv python3-pip;
    elif command_exists dnf; then sudo dnf install -y python3.10 python3-pip;
    elif command_exists yum; then sudo yum install -y python3.10 python3-pip;
    elif command_exists pacman; then sudo pacman -Sy python python-pip --noconfirm;
    else echo "Couldn't determine package manager. Please install Python 3.10+ manually."; exit 1; fi
  else echo "Python 3.10+ is required. Please install it manually."; exit 1; fi
fi

# Check for Node.js 18+
echo -e "\\n[2/5] Checking for Node.js 18+..."
if command_exists node; then
  node_version_major=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
  if [ "$node_version_major" -lt 18 ]; then
    echo "Node.js version is v$(node -v), which is below the required v18"
    read -p "Would you like to install Node.js 18+ now? (y/n) " -n 1 -r; echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      if command_exists apt-get; then curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs;
      elif command_exists dnf; then sudo dnf module install -y nodejs:18/common;
      elif command_exists yum; then curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash - && sudo yum install -y nodejs;
      elif command_exists pacman; then sudo pacman -Sy nodejs npm --noconfirm;
      else echo "Couldn't determine package manager. Please install Node.js 18+ manually."; exit 1; fi
    else echo "Node.js 18+ is required. Please install it manually."; exit 1; fi
  else echo "Node.js v$(node -v) found. Requirement met."; fi
else
  echo "Node.js not found"
  read -p "Would you like to install Node.js 18+ now? (y/n) " -n 1 -r; echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command_exists apt-get; then curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs;
    elif command_exists dnf; then sudo dnf module install -y nodejs:18/common;
    elif command_exists yum; then curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash - && sudo yum install -y nodejs;
    elif command_exists pacman; then sudo pacman -Sy nodejs npm --noconfirm;
    else echo "Couldn't determine package manager. Please install Node.js 18+ manually."; exit 1; fi
  else echo "Node.js 18+ is required. Please install it manually."; exit 1; fi
fi

# Check for npm
echo -e "\\n[3/5] Checking for npm..."
if ! command_exists npm; then
  echo "npm not found"
  read -p "Would you like to install npm now? (y/n) " -n 1 -r; echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command_exists apt-get; then sudo apt-get install -y npm;
    elif command_exists dnf; then sudo dnf install -y npm; # Usually installed with nodejs
    elif command_exists yum; then sudo yum install -y npm; # Usually installed with nodejs
    elif command_exists pacman; then sudo pacman -Sy npm --noconfirm; # Usually installed with nodejs
    else echo "Couldn't determine package manager. Please install npm manually."; exit 1; fi
    echo "npm installed."
  else echo "npm is required. Please install it manually."; exit 1; fi
else
  echo "npm found. Requirement met."
fi

# --- Setup Steps ---

# Create Python virtual environment
echo -e "\\n[4/5] Setting up Python virtual environment..."

# Create venv directory as user (not as root)
if [ ! -d "$SCRIPT_DIR/venv" ]; then
    echo "Creating virtual environment directory and setting ownership to $DEV_USER:$DEV_GROUP..."
    # Create the directory first
    mkdir -p "$SCRIPT_DIR/venv"
    # Set proper ownership
    ensure_user_ownership "$SCRIPT_DIR/venv"
    
    # Create the virtual environment as the actual user (not as root)
    if [ -n "$SUDO_USER" ]; then
        echo "Creating virtual environment as user $DEV_USER..."
        su -c "python3 -m venv '$SCRIPT_DIR/venv'" "$DEV_USER"
    else
        python3 -m venv "$SCRIPT_DIR/venv"
    fi
    echo "Virtual environment created successfully at $SCRIPT_DIR/venv."
else
    echo "Virtual environment already exists at $SCRIPT_DIR/venv. Setting ownership to $DEV_USER:$DEV_GROUP..."
    ensure_user_ownership "$SCRIPT_DIR/venv"
fi

# Activate virtual environment and install Python dependencies
echo "Activating virtual environment and installing backend dependencies..."
# Install Python dependencies as the actual user
if [ -n "$SUDO_USER" ]; then
    echo "Installing backend dependencies as user $DEV_USER..."
    su -c "source '$SCRIPT_DIR/venv/bin/activate' && pip install -r '$SCRIPT_DIR/requirements.txt'" "$DEV_USER"
else
    source "$SCRIPT_DIR/venv/bin/activate"
    pip install -r "$SCRIPT_DIR/requirements.txt"
fi

if [ $? -eq 0 ]; then
    echo "Backend dependencies installed successfully."
else
    echo "Error: Failed to install Python dependencies."
    deactivate || true
    exit 1
fi

# Run Django migrations
echo "Running database migrations..."
cd "$SCRIPT_DIR/backend"

# Ensure the migrations directory exists and is owned by the user
mkdir -p "$SCRIPT_DIR/backend/api/migrations"
ensure_user_ownership "$SCRIPT_DIR/backend/api/migrations"

# Run migrations as the actual user, not as root
if [ -n "$SUDO_USER" ]; then
    echo "Creating migrations with makemigrations as user $DEV_USER..."
    su -c "'$SCRIPT_DIR/venv/bin/python' manage.py makemigrations" "$DEV_USER"
    MAKEMIGRATIONS_STATUS=$?
    
    if [ $MAKEMIGRATIONS_STATUS -eq 0 ]; then
        echo "Migrations created successfully."
        # Ensure migration files are owned by the user
        ensure_user_ownership "$SCRIPT_DIR/backend/api/migrations"
        
        echo "Applying migrations with migrate as user $DEV_USER..."
        su -c "'$SCRIPT_DIR/venv/bin/python' manage.py migrate" "$DEV_USER"
        MIGRATION_STATUS=$?
    else
        echo "Error: Failed to create Django migrations."
        cd "$SCRIPT_DIR"
        deactivate || true
        exit 1
    fi
else
    echo "Creating migrations with makemigrations..."
    ../venv/bin/python manage.py makemigrations
    MAKEMIGRATIONS_STATUS=$?
    
    if [ $MAKEMIGRATIONS_STATUS -eq 0 ]; then
        echo "Migrations created successfully."
        echo "Applying migrations with migrate..."
        ../venv/bin/python manage.py migrate
        MIGRATION_STATUS=$?
    else
        echo "Error: Failed to create Django migrations."
        cd "$SCRIPT_DIR"
        deactivate || true
        exit 1
    fi
fi

if [ $MIGRATION_STATUS -eq 0 ]; then
    echo "Database migrations applied successfully."
    # Ensure database file is owned by the user
    if [ -f "$SCRIPT_DIR/backend/db.sqlite3" ]; then
        ensure_user_ownership "$SCRIPT_DIR/backend/db.sqlite3" false
    fi
else
    echo "Error: Failed to apply Django migrations."
    cd "$SCRIPT_DIR"
    deactivate || true
    exit 1
fi
cd "$SCRIPT_DIR"

# Install frontend dependencies
echo -e "\\n[5/5] Installing frontend dependencies..."
NPM_COMMAND="install"
if [ -f "$SCRIPT_DIR/package-lock.json" ]; then
  echo "Found package-lock.json, using 'npm ci' for cleaner install."
  NPM_COMMAND="ci"
else
  echo "No package-lock.json found, using 'npm install'."
fi

# Ensure user owns node_modules before running npm install
# Create node_modules if it doesn't exist, then set ownership
mkdir -p "$SCRIPT_DIR/node_modules"
ensure_user_ownership "$SCRIPT_DIR/node_modules"

if [ -n "$SUDO_USER" ]; then
    echo "Running 'npm $NPM_COMMAND' as user $SUDO_USER..."
    if su -c "cd '$SCRIPT_DIR' && npm $NPM_COMMAND" "$SUDO_USER"; then
        echo "Frontend dependencies installed successfully."
    else
        echo "Error: Failed to install frontend dependencies as $SUDO_USER."
        deactivate || true
        exit 1
    fi
else
    echo "Running 'npm $NPM_COMMAND'..."
    if npm $NPM_COMMAND; then
        echo "Frontend dependencies installed successfully."
    else
        echo "Error: Failed to install frontend dependencies."
        deactivate || true
        exit 1
    fi
fi

# Ensure all created files are owned by the user
echo "Setting ownership of npm dependencies to $DEV_USER:$DEV_GROUP..."
ensure_user_ownership "$SCRIPT_DIR/node_modules"

# --- Set Development Permissions ---
echo -e "\\nSetting up development permissions..."

DB_PATH_DEV="$SCRIPT_DIR/backend/db.sqlite3"
MEDIA_PATH_DEV="$SCRIPT_DIR/backend/media"

# Database permissions
if [ -f "$DB_PATH_DEV" ]; then
    echo "Setting ownership of '$DB_PATH_DEV' to $DEV_USER:$DEV_GROUP"
    ensure_user_ownership "$DB_PATH_DEV" false
    chmod u+rw,g+r,o-rwx "$DB_PATH_DEV" # Dev user rw, group r, others no access
    echo "Permissions for '$DB_PATH_DEV' set for $DEV_USER (u=rw,g=r)."
else
    echo "Database file '$DB_PATH_DEV' not found. Migrations might create it. If so, $DEV_USER should own it."
fi

# Media directory permissions
if [ ! -d "$MEDIA_PATH_DEV" ]; then
    echo "Creating media directory: $MEDIA_PATH_DEV"
    mkdir -p "$MEDIA_PATH_DEV"
fi
echo "Setting ownership of '$MEDIA_PATH_DEV' and its contents to $DEV_USER:$DEV_GROUP"
ensure_user_ownership "$MEDIA_PATH_DEV"
find "$MEDIA_PATH_DEV" -type d -exec chmod u+rwx,g+rx,o-rwx {} \; # Dev user rwx, group rx
find "$MEDIA_PATH_DEV" -type f -exec chmod u+rw,g+r,o-rwx {} \;  # Dev user rw, group r
echo "Permissions for '$MEDIA_PATH_DEV' set for $DEV_USER."

# --- Generate SSL Certificates ---
echo -e "\\n[6/6] Generating self-signed SSL certificates..."
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
  # Set proper permissions for the development user
  ensure_user_ownership "$CERTS_DIR"
  find "$CERTS_DIR" -type d -exec chmod u+rwx,g+rx,o-rwx {} \; # User rwx, group rx
  find "$CERTS_DIR" -type f -exec chmod u+rw,g+r,o-rwx {} \;   # User rw, group r
  echo "Certificate permissions set for '$DEV_USER' user with full write access."
else
  echo "Error: Failed to generate SSL certificates."
  exit 1
fi

# Deactivate virtual environment if it's active
if [ -n "${VIRTUAL_ENV:-}" ] || type deactivate >/dev/null 2>&1; then
    deactivate || true
    echo "Virtual environment deactivated."
else
    echo "Virtual environment not active, no need to deactivate."
fi

# Final check for any remaining permission issues
echo -e "\\nPerforming final permission check to ensure all files are accessible..."
# Add explicit handling for commonly used directories
find "$SCRIPT_DIR/venv" -type d 2>/dev/null | xargs chmod u+rwx,g+rx,o-rwx 2>/dev/null || true
find "$SCRIPT_DIR/venv" -type f 2>/dev/null | xargs chmod u+rw,g+r,o-rwx 2>/dev/null || true
find "$SCRIPT_DIR/certs" -type d 2>/dev/null | xargs chmod u+rwx,g+rx,o-rwx 2>/dev/null || true
find "$SCRIPT_DIR/certs" -type f 2>/dev/null | xargs chmod u+rw,g+r,o-rwx 2>/dev/null || true
find "$SCRIPT_DIR/node_modules" -type d 2>/dev/null | xargs chmod u+rwx,g+rx,o-rwx 2>/dev/null || true
find "$SCRIPT_DIR/node_modules" -type f -not -path "*/\.*" 2>/dev/null | xargs chmod u+rw,g+r,o-rwx 2>/dev/null || true

if [ -n "$SUDO_USER" ]; then
  echo "Setting ownership of all project files to $DEV_USER:$DEV_GROUP..."
  chown -R "$DEV_USER":"$DEV_GROUP" "$SCRIPT_DIR"
fi
echo "Permission check complete."

echo -e "\\n========================================="
echo "  Development Setup Completed!           "
echo "========================================="

echo -e "\\nTo start developing:"
echo -e "1. Activate the virtual environment: source venv/bin/activate"
echo -e "2. Start the development server: npm run dev (from the project root: $SCRIPT_DIR)"
echo -e "   The application should be available at https://localhost:5173"
echo -e "\\nYour user ($DEV_USER) should have write access to '$DB_PATH_DEV' and '$MEDIA_PATH_DEV'."
echo -e "Self-signed SSL certificates have been generated in the 'certs' directory."
echo "All dependencies installed."
