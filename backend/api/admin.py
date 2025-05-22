from django.contrib import admin
from .models import SystemMetrics, Alert, SecurityStatus, NetworkDevice, NetworkConnection, NetworkScan, Notification, User, SMTPConfiguration

@admin.register(SystemMetrics)
class SystemMetricsAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'cpu_usage', 'memory_usage', 'disk_usage')
    readonly_fields = ('timestamp',)
    list_filter = ('timestamp',)

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'title', 'severity', 'status', 'source')
    list_filter = ('severity', 'status', 'source')
    search_fields = ('title', 'message')

@admin.register(SecurityStatus)
class SecurityStatusAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'security_score', 'vulnerabilities_count', 'last_scan_date', 'firewall_status')
    readonly_fields = ('timestamp',)
    list_filter = ('firewall_status',)

@admin.register(NetworkDevice)
class NetworkDeviceAdmin(admin.ModelAdmin):
    list_display = ('label', 'type', 'ip', 'hostname', 'status', 'last_seen', 'is_manually_added')
    list_filter = ('type', 'status', 'is_manually_added', 'is_ignored')
    search_fields = ('label', 'ip', 'hostname', 'mac')
    readonly_fields = ('id', 'created_at', 'updated_at')

@admin.register(NetworkConnection)
class NetworkConnectionAdmin(admin.ModelAdmin):
    list_display = ('source', 'target', 'type', 'status', 'bandwidth', 'latency')
    list_filter = ('type', 'status')
    readonly_fields = ('id', 'created_at', 'updated_at')

@admin.register(NetworkScan)
class NetworkScanAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'status', 'discovered_devices', 'duration', 'scan_method')
    list_filter = ('status', 'scan_method')
    readonly_fields = ('id', 'timestamp')

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_active', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    readonly_fields = ('date_joined',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'type', 'timestamp', 'is_read', 'is_system')
    list_filter = ('type', 'is_read', 'is_system')
    search_fields = ('title', 'message')
    readonly_fields = ('timestamp',)

@admin.register(SMTPConfiguration)
class SMTPConfigurationAdmin(admin.ModelAdmin):
    list_display = ('host', 'port', 'username', 'from_email', 'is_active', 'last_tested')
    list_filter = ('is_active', 'use_tls')
    search_fields = ('host', 'username', 'from_email')
    readonly_fields = ('created_at', 'updated_at', 'last_tested')
