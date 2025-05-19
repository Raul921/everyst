# First Run Setup

This guide covers the initial setup process after installing Everyst.

## Initial Setup

When you first access Everyst, you'll need to complete a setup process to configure the system and create the first admin user.

### 1. Access the Setup Page

After installation, access the application at:

- https://localhost:5173 

You may need to accept the security warning for the self-signed certificate.

If no users exist in the database, you'll automatically be redirected to the setup page.

### 2. Create Administrator Account

The first screen will prompt you to create an administrator account:

1. Fill in the following information:
   - Username
   - Email address
   - Password (must meet strength requirements)
   - First name
   - Last name

2. Click "Create Account"

This account will have the "Owner" role with full system access.

### 3. System Configuration

Next, you'll be prompted to configure basic system settings:

1. **Server Identification**:
   - Server name
   - Environment (Production, Testing, Development)
   - Timezone

2. **Network Scanning Settings**:
   - Default scan type
   - Network interfaces to use
   - Auto-discovery settings

3. **Email Settings** (optional):
   - SMTP server
   - Port
   - Username
   - Password
   - From address

### 4. Initial Scan

After the basic configuration, you'll be asked if you want to run an initial network scan:

1. Choose scan type:
   - Quick Discovery (fastest)
   - Standard Scan (recommended)
   - Full Scan (most thorough but slower)

2. Select network(s) to scan:
   - Auto-detect local networks
   - Manually specify network ranges

3. Click "Begin Scan"

This initial scan will populate the network map in the Glacier module. You can skip this step and run it later if preferred.

## Post-Installation Tasks

After completing the initial setup wizard, there are a few recommended tasks to fully configure your Everyst installation:

### 1. Explore the Dashboard

Familiarize yourself with the Summit dashboard, which provides an overview of your system:

- System metrics (CPU, memory, disk, network)
- Server information
- Recent alerts
- Status indicators

### 2. User Management

Visit the Climbers page to manage users:

1. Create additional user accounts
2. Assign appropriate roles
3. Configure user permissions

### 3. Network Management

Configure the Glacier network visualization:

1. Verify discovered devices
2. Add missing devices manually
3. Organize devices with tags
4. Configure device details

### 4. Tool Configuration

Configure the network diagnostic tools in GearRoom:

1. Set default parameters for common tools
2. Configure access permissions for sensitive tools
3. Test the tools against your network

### 5. Service Integrations

Set up service integrations in Basecamp:

1. Review available integrations
2. Configure essential security services
3. Set up monitoring connections

### 6. Security Hardening

Review security settings:

1. Check default permissions
2. Configure network scan restrictions
3. Review access logs
4. Set up notification rules for security events

## Regular Maintenance

After the initial setup, establish a regular maintenance schedule:

1. **Software Updates**:
   ```bash
   git pull
   source venv/bin/activate
   pip install -r requirements.txt
   npm install
   cd backend
   python manage.py migrate
   cd ..
   ```

2. **Database Backups**:
   ```bash
   # For SQLite (default)
   cp backend/db.sqlite3 backup/db.sqlite3.$(date +%Y%m%d)
   
   # For PostgreSQL
   pg_dump -U username dbname > backup/everest_backup_$(date +%Y%m%d).sql
   ```

3. **Log Rotation**:
   Ensure logs are properly rotated to prevent disk space issues.

4. **Network Rescans**:
   Schedule regular network scans to keep your network map up to date.

## Troubleshooting First Run Issues

### API Connection Issues

If the frontend can't connect to the backend:

1. Check that the backend server is running
2. Verify that the API URL in `.env` is correct
3. Check for CORS issues in browser console
4. Verify network connectivity between frontend and backend

### Network Scanning Issues

If network scanning fails:

1. Check that the user has sufficient permissions
2. Verify that required tools (nmap) are installed
3. Check firewall settings that might block scanning
4. Ensure network interfaces are properly detected

### Database Initialization Issues

If database setup fails:

1. Check database connection settings
2. Run migrations manually:
   ```bash
   cd backend
   python manage.py migrate
   ```
3. Check for database permission issues

## Next Steps

Once you've completed the initial setup and configuration:

1. Review the [User Guide](../user-guide/README.md) for detailed information on using Everyst
2. Explore the [API Reference](../api/README.md) if you plan to integrate with other systems
3. Consider contributing to the project by reviewing the [Developer Guide](../developer/README.md)
