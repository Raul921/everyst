import React, { useState, useEffect, useMemo } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui';
import { 
  Search, 
  Filter,
  RefreshCw,
  Clock,
  AlertCircle,
  Download,
  FileDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotificationsManager } from '../../hooks/state/useNotificationsManager';
import PermissionGate from '../../components/auth/PermissionGate';

// Helper function to get API URL
const getApiUrl = () => {
  return '/api';
};

// Activity log entry type
interface ActivityLog {
  id: string;
  timestamp: string;
  user: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
  } | null;
  action: string;
  resource_type: string;
  resource_id?: string;
  description: string;
  ip_address: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  metadata?: Record<string, any>;
}

// Level badge with appropriate color based on log level
const LevelBadge: React.FC<{ level: string }> = ({ level }) => {
  const levelStyles: Record<string, { bg: string, text: string }> = {
    'INFO': { 
      bg: 'bg-[rgb(var(--color-status-info-bg))]', 
      text: 'text-[rgb(var(--color-status-info-text))]' 
    },
    'WARNING': { 
      bg: 'bg-[rgb(var(--color-status-warning-bg))]', 
      text: 'text-[rgb(var(--color-status-warning-text))]' 
    },
    'ERROR': { 
      bg: 'bg-[rgb(var(--color-status-error-bg))]', 
      text: 'text-[rgb(var(--color-status-error-text))]' 
    },
    'DEBUG': { 
      bg: 'bg-[rgb(var(--color-status-inactive-bg))]', 
      text: 'text-[rgb(var(--color-status-inactive-text))]' 
    }
  };

  const { bg, text } = levelStyles[level] || levelStyles['INFO'];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {level}
    </span>
  );
};

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  }).format(date);
};

// Convert action type to readable format
const formatActionType = (action: string): string => {
  return action
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Props for ActivityLogs component
type ActivityLogsProps = Record<string, never>;

const ActivityLogs: React.FC<ActivityLogsProps> = () => {
  const { user: currentUser, getAccessToken } = useAuth();
  const { sendUserNotification } = useNotificationsManager();
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);

  // Calculate date range options
  const dateRanges = {
    'all': { label: 'All Time' },
    '24h': { label: 'Last 24 hours', value: 24 * 60 * 60 * 1000 },
    '7d': { label: 'Last 7 days', value: 7 * 24 * 60 * 60 * 1000 },
    '30d': { label: 'Last 30 days', value: 30 * 24 * 60 * 60 * 1000 },
  };

  // Fetch activity logs
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = getAccessToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', page.toString());
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        if (levelFilter !== 'all') {
          params.append('level', levelFilter);
        }
        
        if (actionFilter !== 'all') {
          params.append('action', actionFilter);
        }
        
        if (dateFilter !== 'all') {
          const now = new Date();
          const pastDate = new Date(now.getTime() - (dateRanges[dateFilter as keyof typeof dateRanges]?.value || 0));
          params.append('timestamp_after', pastDate.toISOString());
        }
        
        const response = await fetch(`${getApiUrl()}/activity-logs/?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch activity logs');
        }
        
        const data = await response.json();
        console.log('Activity logs API response:', data);
        
        // Handle pagination data
        if (data && typeof data === 'object') {
          // If it's paginated response with results property
          if (Array.isArray(data.results)) {
            setLogs(data.results);
            setTotalPages(Math.ceil(data.count / 10)); // Assuming 10 items per page
          } else if (Array.isArray(data)) {
            // If it's a direct array
            setLogs(data);
            setTotalPages(1);
          } else {
            // Fallback to empty array
            setLogs([]);
            setTotalPages(1);
          }
        }
        
        // Extract unique action types for filtering
        const actionTypes = new Set<string>();
        
        if (Array.isArray(data.results)) {
          data.results.forEach((log: ActivityLog) => {
            if (log.action) {
              actionTypes.add(log.action);
            }
          });
        } else if (Array.isArray(data)) {
          data.forEach((log: ActivityLog) => {
            if (log.action) {
              actionTypes.add(log.action);
            }
          });
        }
        
        setUniqueActions(Array.from(actionTypes));
        setError(null);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Failed to load activity logs. Please try again.');
        sendUserNotification(
          currentUser?.id as string,
          'Error',
          'Failed to load activity logs data.',
          'error'
        );
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [getAccessToken, sendUserNotification, currentUser, page, searchTerm, levelFilter, actionFilter, dateFilter]);
  
  // Filtered logs based on search term (client-side filtering as backup)
  const filteredLogs = useMemo(() => {
    return logs;
  }, [logs]);
  
  // Handle resetting filters
  const resetFilters = () => {
    setSearchTerm('');
    setLevelFilter('all');
    setActionFilter('all');
    setDateFilter('all');
    setPage(1);
  };

  // Handle page navigation
  const handlePreviousPage = () => {
    setPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPage(prev => Math.min(prev + 1, totalPages));
  };

  // Export logs to CSV
  const exportToCsv = () => {
    try {
      if (logs.length === 0) {
        sendUserNotification(
          currentUser?.id as string,
          'Warning',
          'No logs to export.',
          'warning'
        );
        return;
      }
      
      // Define CSV headers
      const headers = ['ID', 'Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Description', 'IP Address', 'Level'];
      
      // Convert logs to CSV rows
      const csvRows = [headers.join(',')];
      
      logs.forEach(log => {
        const username = log.user ? log.user.username : 'System';
        const row = [
          log.id,
          log.timestamp,
          username,
          log.action,
          log.resource_type,
          log.resource_id || '',
          `"${log.description.replace(/"/g, '""')}"`, // Escape quotes in description
          log.ip_address,
          log.level
        ];
        csvRows.push(row.join(','));
      });
      
      // Create CSV content and trigger download
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `activity_logs_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      sendUserNotification(
        currentUser?.id as string,
        'Success',
        'Activity logs exported successfully.',
        'success'
      );
    } catch (err) {
      console.error('Error exporting logs:', err);
      sendUserNotification(
        currentUser?.id as string,
        'Error',
        'Failed to export activity logs.',
        'error'
      );
    }
  };
  
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Activity Logs</h1>
        <p className="text-[rgb(var(--color-text-secondary))] mt-1">
          View and search system activity logs and user actions
        </p>
      </header>
      
      <PermissionGate 
        permission="canViewLogs"
        fallback={
          <Panel className="bg-[rgb(var(--color-warning-bg))] border-[rgb(var(--color-warning-border))]">
            <div className="p-4 text-[rgb(var(--color-warning-text))]">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <h3 className="font-medium">Insufficient Permissions</h3>
              </div>
              <p className="mt-1 text-sm">
                You don't have permission to view activity logs. Contact your administrator for access.
              </p>
            </div>
          </Panel>
        }
      >
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgb(var(--color-text-secondary))]" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-input-bg))] text-[rgb(var(--color-text))]"
              />
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
              {/* Level Filter */}
              <div className="relative">
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-input-bg))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='rgb(var(--color-text-secondary))' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.7rem center',
                    backgroundSize: '0.7em'
                  }}
                >
                  <option value="all" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">All Levels</option>
                  <option value="INFO" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">Info</option>
                  <option value="WARNING" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">Warning</option>
                  <option value="ERROR" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">Error</option>
                  <option value="DEBUG" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">Debug</option>
                </select>
              </div>
              
              {/* Action Filter */}
              <div className="relative">
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-input-bg))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='rgb(var(--color-text-secondary))' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.7rem center',
                    backgroundSize: '0.7em'
                  }}
                >
                  <option value="all" className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]">All Actions</option>
                  {uniqueActions.map(action => (
                    <option 
                      key={action} 
                      value={action} 
                      className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]"
                    >
                      {formatActionType(action)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date Range Filter */}
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-input-bg))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='rgb(var(--color-text-secondary))' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.7rem center',
                    backgroundSize: '0.7em'
                  }}
                >
                  {Object.entries(dateRanges).map(([key, { label }]) => (
                    <option 
                      key={key} 
                      value={key} 
                      className="text-[rgb(var(--color-text))] bg-[rgb(var(--color-input-bg))]"
                    >
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Reset Filters Button */}
              <Button
                onClick={resetFilters}
                variant="ghost"
                className="py-2"
              >
                Reset
              </Button>
              
              {/* Refresh Button */}
              <Button 
                variant="outline" 
                aria-label="Refresh logs"
                title="Refresh logs"
                className="p-2"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 500); // Simulate refresh
                }}
              >
                <RefreshCw size={16} />
              </Button>
              
              {/* Export Button */}
              <Button
                onClick={exportToCsv}
                variant="primary"
                leftIcon={<FileDown className="h-4 w-4" />}
              >
                Export CSV
              </Button>
            </div>
          </div>
          
          {/* Logs Table */}
          <Panel>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[rgba(var(--color-bg),0.5)]">
                  <tr className="border-b border-[rgb(var(--color-border))]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider">Resource</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-secondary))] uppercase tracking-wider">Level</th>
                  </tr>
                </thead>
                
                <tbody className="bg-[rgb(var(--color-card))] divide-y divide-[rgb(var(--color-border))]">
                  {loading ? (
                    // Loading state
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={`loading-${index}`} className="animate-pulse">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="h-4 w-32 bg-[rgb(var(--color-border))] rounded"></div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-24 bg-[rgb(var(--color-border))] rounded"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-24 bg-[rgb(var(--color-border))] rounded"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-16 bg-[rgb(var(--color-border))] rounded"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-48 bg-[rgb(var(--color-border))] rounded"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-24 bg-[rgb(var(--color-border))] rounded"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-5 w-16 bg-[rgb(var(--color-border))] rounded-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : error ? (
                    // Error state
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-[rgb(var(--color-text-secondary))]">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2 text-[rgb(var(--color-error))]" />
                        <p>{error}</p>
                        <Button
                          onClick={() => window.location.reload()}
                          variant="ghost"
                          className="mt-2"
                        >
                          Try Again
                        </Button>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    // Empty state
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-[rgb(var(--color-text-secondary))]">
                        <Clock className="h-6 w-6 mx-auto mb-2" />
                        <p>No activity logs found matching your criteria</p>
                        {(searchTerm || levelFilter !== 'all' || actionFilter !== 'all' || dateFilter !== 'all') && (
                          <Button
                            onClick={resetFilters}
                            variant="ghost"
                            className="mt-1"
                          >
                            Clear Filters
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    // Log list
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[rgba(var(--color-bg),0.5)]">
                        <td className="px-4 py-3 text-sm text-[rgb(var(--color-text))]">
                          <div className="whitespace-nowrap">{formatDate(log.timestamp)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {log.user ? (
                              <>
                                <div className="h-7 w-7 rounded-full bg-[rgb(var(--color-primary))] text-white flex items-center justify-center uppercase font-medium text-xs">
                                  {log.user.first_name ? log.user.first_name[0] : log.user.username[0]}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-[rgb(var(--color-text))]">
                                    {log.user.first_name && log.user.last_name 
                                      ? `${log.user.first_name} ${log.user.last_name}` 
                                      : log.user.username}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <span className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">System</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[rgb(var(--color-text))]">
                          {formatActionType(log.action)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[rgb(var(--color-text))]">
                          <span className="whitespace-nowrap">{log.resource_type}</span>
                          {log.resource_id && (
                            <span className="ml-1 text-xs text-[rgb(var(--color-text-secondary))]">
                              #{log.resource_id}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[rgb(var(--color-text))]">
                          {log.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-[rgb(var(--color-text-secondary))]">
                          {log.ip_address}
                        </td>
                        <td className="px-4 py-3">
                          <LevelBadge level={log.level} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
          
          {/* Pagination */}
          {!loading && !error && filteredLogs.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                Page {page} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={handlePreviousPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={handleNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Panel className="p-4">
              <h3 className="text-lg font-medium text-[rgb(var(--color-text))]">Activity Summary</h3>
              <p className="text-3xl font-bold mt-2 text-[rgb(var(--color-text))]">{logs.length}</p>
              <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-1">
                Events in current view
              </p>
            </Panel>
            
            <Panel className="p-4">
              <h3 className="text-lg font-medium text-[rgb(var(--color-text))]">Level Distribution</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[rgb(var(--color-text))]">Info</span>
                  <span className="font-medium text-[rgb(var(--color-text))]">
                    {logs.filter(log => log.level === 'INFO').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[rgb(var(--color-text))]">Warning</span>
                  <span className="font-medium text-[rgb(var(--color-text))]">
                    {logs.filter(log => log.level === 'WARNING').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[rgb(var(--color-text))]">Error</span>
                  <span className="font-medium text-[rgb(var(--color-text))]">
                    {logs.filter(log => log.level === 'ERROR').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[rgb(var(--color-text))]">Debug</span>
                  <span className="font-medium text-[rgb(var(--color-text))]">
                    {logs.filter(log => log.level === 'DEBUG').length}
                  </span>
                </div>
              </div>
            </Panel>
            
            <Panel className="p-4">
              <h3 className="text-lg font-medium text-[rgb(var(--color-text))]">Recent Activity</h3>
              <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-2">
                Latest log: {
                  logs.length > 0 
                    ? formatDate(logs[0].timestamp)
                    : 'N/A'
                }
              </p>
            </Panel>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
};

export default ActivityLogs;
