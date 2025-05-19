/**
 * Network Visualization Types
 */

// Basic network device/node
export interface NetworkDevice {
  id: string;
  label: string;
  type: 'server' | 'workstation' | 'router' | 'switch' | 'firewall' | 'other';
  ip?: string;
  mac?: string;
  hostname?: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  lastSeen?: string; // ISO date string
  metadata?: Record<string, any>; // Additional properties
  tags?: string[];
  icon?: string; // Icon identifier
}

// Connection between devices
export interface NetworkConnection {
  id: string;
  source: string; // Device ID
  target: string; // Device ID
  label?: string;
  type?: 'wired' | 'wireless' | 'vpn' | 'other';
  status: 'active' | 'inactive' | 'warning' | 'error';
  bandwidth?: number; // In Mbps
  latency?: number; // In ms
  packetLoss?: number; // Percentage
  traffic?: number; // Current traffic in Mbps
  metadata?: Record<string, any>; // Additional properties
}

// Scan result
export interface NetworkScan {
  id: string;
  timestamp: string; // ISO date string
  status: 'in-progress' | 'completed' | 'failed';
  discoveredDevices: number;
  duration?: number; // In seconds
  errorMessage?: string; // Error message if status is 'failed'
  isStale?: boolean; // True if the scan might be outdated (e.g., after server restart)
}

// Network topology
export interface NetworkTopology {
  devices: NetworkDevice[];
  connections: NetworkConnection[];
  lastScan?: NetworkScan;
  activeScanInProgress?: boolean;
}
