"""
Network tools API endpoints for the GearRoom feature.
This module provides real-world network diagnostics through API endpoints.
"""
import subprocess
import re
import socket
import ssl
import json
import ipaddress
import time
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.utils import timezone

# Maximum command execution time in seconds
MAX_EXECUTION_TIME = 30

def sanitize_input(input_str):
    """
    Sanitize user input to prevent command injection.
    Remove special characters and limit to alphanumeric, dots, hyphens, and slashes.
    """
    # Allow alphanumeric, dots, hyphens, underscores, colons and limited special chars
    sanitized = re.sub(r'[^\w\.\-:/]', '', input_str)
    return sanitized

def execute_command(command, timeout=MAX_EXECUTION_TIME):
    """
    Execute a system command safely and return the output.
    """
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False  # Avoid shell injection
        )
        
        if result.returncode == 0:
            return {
                'output': result.stdout,
                'status': 'success',
                'timestamp': timezone.now().isoformat()
            }
        else:
            return {
                'output': f"Error: {result.stderr}",
                'status': 'error',
                'timestamp': timezone.now().isoformat()
            }
    except subprocess.TimeoutExpired:
        return {
            'output': f"Command timed out after {timeout} seconds",
            'status': 'error',
            'timestamp': timezone.now().isoformat()
        }
    except Exception as e:
        return {
            'output': f"Failed to execute command: {str(e)}",
            'status': 'error',
            'timestamp': timezone.now().isoformat()
        }

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ping_tool(request):
    """Execute ping command to test connectivity to a host"""
    target = request.data.get('target')
    
    if not target:
        return Response(
            {'error': 'Target host is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Sanitize input
    target = sanitize_input(target)
    
    # Run ping command with limited options for security
    command = ['ping', '-c', '4', target]
    result = execute_command(command)
    
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def nmap_tool(request):
    """Execute port scan using nmap"""
    target = request.data.get('target')
    
    if not target:
        return Response(
            {'error': 'Target host is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Sanitize input
    target = sanitize_input(target)
    
    # Run nmap with basic options (safe scan)
    command = ['nmap', '-sT', '-T3', '--top-ports', '100', target]
    result = execute_command(command)
    
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dig_tool(request):
    """Execute DNS lookup using dig"""
    target = request.data.get('target')
    record_type = request.data.get('record_type', 'A')
    
    if not target:
        return Response(
            {'error': 'Target domain is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Sanitize input
    target = sanitize_input(target)
    record_type = sanitize_input(record_type)
    
    # Run dig command
    command = ['dig', target, record_type]
    result = execute_command(command)
    
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def nslookup_tool(request):
    """Execute reverse DNS lookup using nslookup"""
    target = request.data.get('target')
    
    if not target:
        return Response(
            {'error': 'Target host is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Sanitize input
    target = sanitize_input(target)
    
    # Run nslookup command
    command = ['nslookup', target]
    result = execute_command(command)
    
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def traceroute_tool(request):
    """Execute traceroute to map the network path to a host"""
    target = request.data.get('target')
    
    if not target:
        return Response(
            {'error': 'Target host is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Sanitize input
    target = sanitize_input(target)
    
    # Run traceroute command
    command = ['traceroute', '-m', '15', target]
    result = execute_command(command)
    
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def whois_tool(request):
    """Execute whois lookup for domain information"""
    target = request.data.get('target')
    
    if not target:
        return Response(
            {'error': 'Target domain or IP is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Sanitize input
    target = sanitize_input(target)
    
    # Run whois command
    command = ['whois', target]
    result = execute_command(command)
    
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ssl_check_tool(request):
    """Check SSL certificate information for a domain"""
    target = request.data.get('target')
    
    if not target:
        return Response(
            {'error': 'Target domain is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Sanitize input
    target = sanitize_input(target)
    
    # Remove any protocol prefix if present
    target = re.sub(r'^https?://', '', target)
    
    # Use OpenSSL to get certificate info
    command = ['openssl', 's_client', '-connect', f"{target}:443", '-servername', target, '-showcerts']
    result = execute_command(command)
    
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def netstat_tool(request):
    """Get network connection information using netstat"""
    options = request.data.get('options', '')
    
    # Sanitize input - only allow specific flags
    valid_options = {'n', 't', 'u', 'l', 'p', 'a'}
    sanitized_options = ''.join(opt for opt in options if opt in valid_options)
    
    # Run netstat command with validated options
    command = ['netstat']
    if sanitized_options:
        command.append(f'-{sanitized_options}')
    
    result = execute_command(command)
    
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ip_route_tool(request):
    """Get routing table information"""
    # No user input needed for basic usage
    command = ['ip', 'route', 'show']
    result = execute_command(command)
    
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tcpdump_tool(request):
    """Capture network packets using tcpdump"""
    interface = request.data.get('interface', 'any')
    filter_expr = request.data.get('filter', '')
    count = request.data.get('count', 25)  # Limit to 25 packets for safety
    
    # Sanitize inputs
    interface = sanitize_input(interface)
    filter_expr = sanitize_input(filter_expr)
    
    # Ensure count is reasonable
    try:
        count = int(count)
        count = min(max(1, count), 100)  # Between 1 and 100
    except (ValueError, TypeError):
        count = 25  # Default if invalid
    
    # Build command with safe options
    command = ['tcpdump', '-i', interface, '-c', str(count), '-n']
    
    if filter_expr:
        command.extend(filter_expr.split())
    
    result = execute_command(command)
    
    return Response(result)
