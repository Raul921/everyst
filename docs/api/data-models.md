# Data Models

This document describes the core data models used throughout the Everyst API.

## Base Model

The `BaseModel` serves as the foundation for all other models in the system.

```python
class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
```

## User Models

### User

The `User` model extends Django's AbstractUser to add custom fields.

```python
class User(AbstractUser, BaseModel):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    role = models.ForeignKey('UserRole', on_delete=models.SET_NULL, null=True, related_name='users')
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    objects = UserManager()
    
    def __str__(self):
        return self.username
```

### UserRole

The `UserRole` model defines role-based access control.

```python
class UserRole(BaseModel):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=dict)
    is_system_role = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name
```

## Network Models

### NetworkDevice

The `NetworkDevice` model represents a device on the network.

```python
class NetworkDevice(BaseModel):
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    mac_address = models.CharField(max_length=17, null=True, blank=True)
    device_type = models.CharField(max_length=50, default='unknown')
    operating_system = models.CharField(max_length=100, null=True, blank=True)
    vendor = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, default='unknown')
    is_active = models.BooleanField(default=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    hostname = models.CharField(max_length=100, null=True, blank=True)
    open_ports = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.ip_address or 'No IP'})"
```

### NetworkConnection

The `NetworkConnection` model represents a connection between two devices.

```python
class NetworkConnection(BaseModel):
    source = models.ForeignKey(NetworkDevice, on_delete=models.CASCADE, related_name='outgoing_connections')
    target = models.ForeignKey(NetworkDevice, on_delete=models.CASCADE, related_name='incoming_connections')
    connection_type = models.CharField(max_length=50, default='ethernet')
    status = models.CharField(max_length=20, default='active')
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        unique_together = ('source', 'target', 'connection_type')
        
    def __str__(self):
        return f"{self.source} → {self.target} ({self.connection_type})"
```

### NetworkScan

The `NetworkScan` model stores information about network scans.

```python
class NetworkScan(BaseModel):
    scan_type = models.CharField(max_length=20, default='basic')
    status = models.CharField(max_length=20, default='pending')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    target_range = models.CharField(max_length=100, null=True, blank=True)
    initiated_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='scans')
    results = models.JSONField(default=dict, blank=True)
    devices_found = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Scan {self.id} - {self.scan_type} ({self.status})"
```

## System Models

### SystemMetrics

The `SystemMetrics` model stores system performance data.

```python
class SystemMetrics(BaseModel):
    timestamp = models.DateTimeField(auto_now_add=True)
    cpu_usage = models.FloatField(default=0.0)
    memory_used = models.FloatField(default=0.0)
    memory_total = models.FloatField(default=0.0)
    disk_used = models.FloatField(default=0.0)
    disk_total = models.FloatField(default=0.0)
    network_rx = models.FloatField(default=0.0)
    network_tx = models.FloatField(default=0.0)
    cpu_temperature = models.FloatField(null=True, blank=True)
    boot_time = models.DateTimeField(null=True, blank=True)
    load_average = models.JSONField(default=list, blank=True)
    process_count = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Metrics at {self.timestamp}"
```

### Alert

The `Alert` model represents system alerts.

```python
class Alert(BaseModel):
    severity = models.CharField(max_length=20)
    message = models.TextField()
    source = models.CharField(max_length=100)
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='resolved_alerts')
    metadata = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        status = "Resolved" if self.is_resolved else "Active"
        return f"{self.severity.upper()} Alert: {self.message} ({status})"
```

### SecurityStatus

The `SecurityStatus` model tracks system security status.

```python
class SecurityStatus(BaseModel):
    status = models.CharField(max_length=20, default='unknown')
    last_updated = models.DateTimeField(auto_now=True)
    firewall_status = models.CharField(max_length=20, default='unknown')
    updates_pending = models.IntegerField(default=0)
    security_incidents = models.IntegerField(default=0)
    last_scan = models.DateTimeField(null=True, blank=True)
    vulnerabilities = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"Security Status: {self.status} (Updated: {self.last_updated})"
```

## Notification Model

### Notification

The `Notification` model stores user notifications.

```python
class Notification(BaseModel):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    title = models.CharField(max_length=100)
    message = models.TextField()
    type = models.CharField(max_length=20, default='info')
    is_read = models.BooleanField(default=False)
    is_system = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    source = models.CharField(max_length=50, blank=True, default='system')
    metadata = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.title} ({self.type})"
```

## Relationships Between Models

The following diagram illustrates the relationships between the core models:

```
                  ┌───────────────┐
                  │   UserRole    │
                  └───────┬───────┘
                          │
                          │ 1:N
                          ▼
┌─────────────┐      ┌────────┐      ┌────────────────┐
│ Notification│◄─────┤  User  │─────►│  NetworkScan   │
└─────────────┘      └────┬───┘      └────────────────┘
                          │
                          │ 1:N
                          ▼
                    ┌───────────┐
                    │   Alert   │
                    └───────────┘

┌────────────────┐      ┌────────────────┐
│ NetworkDevice  │◄────►│NetworkConnection│
└────────────────┘      └────────────────┘

┌────────────────┐      ┌────────────────┐
│ SystemMetrics  │      │ SecurityStatus │
└────────────────┘      └────────────────┘
```

## Model Field Descriptions

### User Fields

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| username | String | Login username |
| email | String | Email address |
| password | String | Hashed password |
| first_name | String | First name |
| last_name | String | Last name |
| is_active | Boolean | Account status |
| is_staff | Boolean | Admin access status |
| role | Foreign Key | User role reference |
| last_login | DateTime | Last login timestamp |
| last_login_ip | IP Address | Last login IP |

### NetworkDevice Fields

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| name | String | Device name |
| ip_address | IP Address | Device IP address |
| mac_address | String | MAC address |
| device_type | String | Type of device |
| operating_system | String | OS information |
| vendor | String | Device manufacturer |
| status | String | Current status |
| is_active | Boolean | Whether device is active |
| last_seen | DateTime | Last detected timestamp |
| metadata | JSON | Additional device data |
| hostname | String | Device hostname |
| open_ports | JSON Array | List of open ports |
| tags | JSON Array | Device tags |

### SystemMetrics Fields

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| timestamp | DateTime | Collection timestamp |
| cpu_usage | Float | CPU usage percentage |
| memory_used | Float | Memory used in GB |
| memory_total | Float | Total memory in GB |
| disk_used | Float | Disk used in GB |
| disk_total | Float | Total disk in GB |
| network_rx | Float | Network received in MB/s |
| network_tx | Float | Network transmitted in MB/s |
| cpu_temperature | Float | CPU temperature in °C |
| boot_time | DateTime | System boot time |
| load_average | JSON Array | Load averages [1m, 5m, 15m] |
| process_count | Integer | Number of running processes |
