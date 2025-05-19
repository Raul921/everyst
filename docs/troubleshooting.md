# Troubleshooting

This guide helps you diagnose and resolve common issues with Everyst.

## Installation Issues

### Python Environment Problems

**Issue:** Error when installing Python dependencies

**Solution:**
```bash
# Upgrade pip and reinstall
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

**Issue:** "Command not found" errors

**Solution:** Ensure the virtual environment is activated:
```bash
source venv/bin/activate
```

### Node.js and NPM Issues

**Issue:** Error installing Node.js dependencies

**Solution:**
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Issue:** Vite build errors

**Solution:** Check for TypeScript errors and resolve them:
```bash
npm run typecheck
```

### Database Migration Issues

**Issue:** Migration errors during setup

**Solution:** Reset the database (for development only):
```bash
cd backend
rm -f db.sqlite3
python manage.py makemigrations api
python manage.py migrate
python manage.py createsuperuser
```

## Connection Issues

### API Connection Failures

**Issue:** Frontend can't connect to the backend API

**Solutions:**
1. Check that the backend server is running
2. Verify API URL in `.env` matches the running server
3. Check browser console for specific errors
4. Ensure CORS is properly configured in backend settings

### WebSocket Connection Issues

**Issue:** "WebSocket connection failed" errors

**Solutions:**
1. Verify the Socket.IO server is running
2. Check CORS settings in backend configuration
3. Ensure authentication token is valid
4. Check for network issues (firewalls, proxies)

**Issue:** WebSocket reconnection loops

**Solution:** Increase reconnection attempts and timeout in WebSocketContext:
```typescript
// src/context/WebSocketContext.tsx
const socket = io(SOCKET_URL, {
  reconnectionAttempts: 10,
  reconnectionDelay: 3000,
  timeout: 20000
});
```

## Authentication Problems

### Login Issues

**Issue:** Login fails with "Invalid credentials"

**Solutions:**
1. Verify username and password are correct
2. Check if the user account is active
3. Ensure the database contains the user record
4. Reset password if necessary

**Issue:** "JWT token invalid" errors

**Solutions:**
1. Clear browser storage and reload:
```javascript
localStorage.clear();
window.location.reload();
```
2. Check if token expiration is too short in backend settings

### Permission Issues

**Issue:** "Permission denied" errors

**Solutions:**
1. Verify user role has necessary permissions
2. Check permission configuration in the backend
3. Log out and log back in to refresh permissions
4. Review user role assignment

## Network Scanning Issues

### Scan Failures

**Issue:** Network scanning fails

**Solutions:**
1. Ensure the backend has sufficient permissions:
```bash
sudo setcap cap_net_raw,cap_net_admin=eip /path/to/venv/bin/python3
```
2. Check that required tools (nmap) are installed
3. Verify network interface configuration
4. Increase scan timeout in settings

**Issue:** Incomplete scanning results

**Solutions:**
1. Try different scan types (basic, intense, full)
2. Check for firewalls blocking scanning traffic
3. Verify target devices are online

## System Monitoring Issues

### Missing Metrics

**Issue:** System metrics not displaying

**Solutions:**
1. Check WebSocket connection status
2. Verify metrics collection service is running
3. Increase metrics collection interval
4. Check for Python `psutil` installation issues

**Issue:** Inaccurate system metrics

**Solution:** Verify metric collection code and system access:
```bash
cd backend
python manage.py shell
import psutil
print(psutil.cpu_percent())
print(psutil.virtual_memory())
```

## Frontend Display Issues

### UI Rendering Problems

**Issue:** Components not rendering correctly

**Solutions:**
1. Clear browser cache and reload
2. Check for JavaScript errors in browser console
3. Verify CSS is loading properly
4. Test in different browsers

**Issue:** Responsive design issues on mobile

**Solution:** Test with browser device emulation and fix media queries

### Performance Issues

**Issue:** Dashboard is slow to update

**Solutions:**
1. Increase metric update interval
2. Optimize React component renders
3. Use React.memo for components that don't need frequent re-renders
4. Check browser performance tools for bottlenecks

## Logging and Debugging

### Enabling Extended Logs

For more detailed backend logs:

1. Edit `backend/everyst_api/settings.py`:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'DEBUG',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
            'level': 'DEBUG',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'DEBUG',
    },
}
```

2. Restart the server to apply changes

### Frontend Debug Mode

Enable React developer tools and detailed logging:

```jsx
// In src/context/WebSocketContext.tsx
const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  debug: true
});
```

## Common Error Messages

### "No such table" Database Error

**Issue:** Django reports missing database tables

**Solution:** Run migrations:
```bash
cd backend
python manage.py migrate
```

### "Network is unreachable" in Network Scanner

**Issue:** Network scanner can't reach target networks

**Solutions:**
1. Check network interface configuration
2. Verify routing table
3. Test basic connectivity with ping
4. Check firewall rules

### "Module not found" in Frontend

**Issue:** JavaScript module import errors

**Solution:** Install missing dependencies:
```bash
npm install missing-package
```

## Recovery Procedures

### Reset User Password

To reset an admin user's password:

```bash
cd backend
python manage.py changepassword username
```

Or use the shell:

```bash
cd backend
python manage.py shell
```

```python
from api.models import User
user = User.objects.get(username='admin')
user.set_password('new_password')
user.save()
```

### Reset Database

For a clean start (development only):

```bash
cd backend
rm -f db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Reset Frontend State

To clear all frontend state:

1. Clear local storage in browser developer tools
2. Clear browser cache and cookies
3. Reload the application

## Getting Help

If you continue to experience issues:

1. Check the [GitHub Issues](https://github.com/Jordonh18/Everyst/issues) for similar problems
2. Search the documentation for answers
3. Create a new issue with detailed information about your problem
