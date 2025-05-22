import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Panel, 
  StatusPill, 
  Button
} from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { 
  MessageSquare, 
  Bell,
  Cloud,
  CloudCog,
  Laptop,
  Check,
  AlertTriangle,
  ExternalLink,
  Loader,
  ToggleRight,
  Settings,
  Lock,
  User,
  Clock,
  CheckCircle
} from 'lucide-react';

// Import SMTP service
import { fetchActiveSMTPConfig, saveSMTPConfig, testSMTPConnection as testSMTP, type SMTPConfig as SMTPConfigType } from '../../services/integrations/smtpService';

// Updated types for our integrations to focus on identity and notification integrations
interface ServiceConnection {
  id: string;
  name: string;
  type: 'communication' | 'notification' | 'cloud' | 'authentication';
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastConnected: string | null;
  icon: React.ReactNode;
  connectedAccount?: string;
  workspaces?: string[];
  description?: string;
  comingSoon?: boolean;
  config?: unknown;
}

// Predefined services by category
const predefinedServices = {
  authentication: [
    { id: 'github', name: 'GitHub', provider: 'GitHub', icon: <User size={24} />, description: 'GitHub SSO authentication', comingSoon: true },
    { id: 'azure-ad', name: 'Azure AD', provider: 'Microsoft', icon: <User size={24} />, description: 'Microsoft identity services', comingSoon: true },
    { id: 'google', name: 'Google', provider: 'Google', icon: <User size={24} />, description: 'Google account authentication', comingSoon: true },
    { id: 'okta', name: 'Okta', provider: 'Okta', icon: <Lock size={24} />, description: 'Enterprise identity management', comingSoon: true }
  ],
  communication: [
    { id: 'ms-teams', name: 'Microsoft Teams', provider: 'Microsoft', icon: <MessageSquare size={24} />, description: 'Team collaboration and messaging', comingSoon: true },
    { id: 'slack', name: 'Slack', provider: 'Slack', icon: <MessageSquare size={24} />, description: 'Channel-based messaging platform', comingSoon: true },
    { id: 'discord', name: 'Discord', provider: 'Discord', icon: <MessageSquare size={24} />, description: 'Voice and text chat', comingSoon: true }
  ],
  notification: [
    { id: 'email', name: 'Email Notifications', provider: 'SMTP', icon: <Bell size={24} />, description: 'Email alerts and notifications', comingSoon: false },
    { id: 'sms', name: 'SMS', provider: 'Twilio', icon: <Bell size={24} />, description: 'Text message alerts', comingSoon: true },
    { id: 'push', name: 'Push Notifications', provider: 'Web Push', icon: <Bell size={24} />, description: 'Browser and mobile notifications', comingSoon: true }
  ],
  cloud: [
    { id: 'aws', name: 'AWS', provider: 'Amazon', icon: <Cloud size={24} />, description: 'Amazon Web Services integration', comingSoon: true },
    { id: 'azure', name: 'Azure', provider: 'Microsoft', icon: <CloudCog size={24} />, description: 'Microsoft Azure cloud services', comingSoon: true },
    { id: 'gcp', name: 'Google Cloud', provider: 'Google', icon: <Cloud size={24} />, description: 'Google Cloud Platform', comingSoon: true }
  ]
};

// Custom Coming Soon Banner component
const ComingSoonBanner: React.FC = () => {
  return (
    <div className="absolute top-0 right-0 z-20" style={{ transform: 'translateY(-40%) translateX(30%) rotate(32deg)' }}>
      <div className="flex items-center gap-1 bg-[#2EAAE1] text-white font-bold py-1 px-8 shadow-lg rounded-md border border-white/10"
        style={{ minWidth: 160, boxShadow: '0 2px 8px 0 rgba(46,170,225,0.15)', borderTopLeftRadius: 6, borderTopRightRadius: 12, borderBottomRightRadius: 6, borderBottomLeftRadius: 12 }}>
        <Clock size={12} className="opacity-80 mr-1" />
        <span className="text-[10px] tracking-wider uppercase">Coming Soon</span>
      </div>
    </div>
  );
};

export const BasecampIntegrations: React.FC = () => {
  // State for service connections
  const [connections, setConnections] = useState<ServiceConnection[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Modal state for service configuration
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<Partial<ServiceConnection> | null>(null);
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // SMTP configuration state
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfigType>({
    host: '',
    port: 587,
    username: '',
    password: '',
    use_tls: true,
    from_email: '',
    from_name: '',
    is_active: true
  });
  
  // Test email state
  const [testEmail, setTestEmail] = useState<string>('');
  const [testingEmail, setTestingEmail] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // SMTP modal Save/Test button enable/disable logic
  const smtpRequiredFields = smtpConfig.host && smtpConfig.port && smtpConfig.from_email;
  const isSmtpSaveDisabled = !smtpRequiredFields || isLoading;
  const isSmtpTestDisabled = !smtpRequiredFields || testingEmail || !testEmail;

  // Validation state
  const [smtpValidationError, setSmtpValidationError] = useState<string | null>(null);

  // Handle SMTP form input changes
  const handleSMTPChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSmtpValidationError(null);
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setSmtpConfig(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setSmtpConfig(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? parseInt(value, 10) || 0 : value 
      }));
    }
  };

  // Handle SMTP test connection
  const handleTestSMTPConnection = async () => {
    if (!smtpConfig.id || !testEmail) return;
    setTestingEmail(true);
    setTestResult(null);
    try {
      const result = await testSMTP(smtpConfig.id, testEmail);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setTestingEmail(false);
    }
  };

  // Handle saving SMTP configuration
  const handleSaveSMTPConfig = async () => {
    if (!smtpRequiredFields) {
      setSmtpValidationError('Please fill in SMTP server, port, and from email.');
      return;
    }
    setIsLoading(true);
    try {
      const savedConfig = await saveSMTPConfig(smtpConfig);
      setSmtpConfig(savedConfig);
      // Update or add connection
      const existingConnectionIndex = connections.findIndex(
        conn => conn.id === `email-${savedConfig.id}`
      );
      if (existingConnectionIndex >= 0) {
        const updatedConnections = [...connections];
        updatedConnections[existingConnectionIndex] = {
          ...updatedConnections[existingConnectionIndex],
          status: 'connected',
          lastConnected: new Date().toISOString(),
          config: savedConfig
        };
        setConnections(updatedConnections);
      } else {
        setConnections(prev => [
          ...prev,
          {
            id: `email-${savedConfig.id}`,
            name: 'Email Notifications',
            type: 'notification',
            provider: 'SMTP',
            status: 'connected',
            lastConnected: new Date().toISOString(),
            icon: <Bell size={24} />,
            description: 'Email alerts and notifications',
            config: savedConfig
          }
        ]);
      }
      setShowAddModal(false);
    } catch (error) {
      setSmtpValidationError('Failed to save SMTP configuration. Please check your input.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data - this would come from API in a real app
  useEffect(() => {
    // Simulate API delay
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch SMTP configuration if it exists
        const config = await fetchActiveSMTPConfig();
        
        if (config) {
          // Update SMTP configuration
          setSmtpConfig(config);
          
          // Add to connections list
          setConnections([
            {
              id: `email-${config.id}`,
              name: 'Email Notifications',
              type: 'notification',
              provider: 'SMTP',
              status: 'connected',
              lastConnected: config.updated_at || null,
              icon: <Bell size={24} />,
              description: 'Email alerts and notifications',
              config: config
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching SMTP configuration:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Get counts for the overview
  const connectedCount = connections.filter(c => c.status === 'connected').length;
  const errorCount = connections.filter(c => c.status === 'error').length;
  const pendingCount = connections.filter(c => c.status === 'pending').length;
  
  
  // Updated filter buttons to match the new integration types
  const filterButtons = [
    { id: null, label: 'All' },
    { id: 'communication', label: 'Communication' },
    { id: 'notification', label: 'Notifications' },
    { id: 'cloud', label: 'Cloud' },
    { id: 'authentication', label: 'Authentication' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Page header with breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Basecamp</h1>
          <p className="text-[rgb(var(--color-text-secondary))]">Manage your identity and collaboration tool integrations</p>
        </div>
      </div>

      {/* Overview panel */}
      <Panel 
        title="Connections Overview" 
        description="Status of your identity and notification integrations"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[rgba(var(--color-primary),0.05)]">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-[rgb(var(--color-text-secondary))]">Total Connections</div>
                <div className="text-2xl font-semibold">{connections.length}</div>
              </div>
              <div className="p-2 bg-[rgba(var(--color-primary),0.1)] rounded-full text-[rgb(var(--color-primary))]">
                <Laptop size={20} />
              </div>
            </div>
          </Card>
          
          <Card className="bg-[rgba(var(--color-success),0.05)]">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-[rgb(var(--color-text-secondary))]">Connected</div>
                <div className="text-2xl font-semibold">{connectedCount}</div>
              </div>
              <div className="p-2 bg-[rgba(var(--color-success),0.1)] rounded-full text-[rgb(var(--color-success))]">
                <Check size={20} />
              </div>
            </div>
          </Card>
          
          <Card className="bg-[rgba(var(--color-error),0.05)]">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-[rgb(var(--color-text-secondary))]">Connection Errors</div>
                <div className="text-2xl font-semibold">{errorCount}</div>
              </div>
              <div className="p-2 bg-[rgba(var(--color-error),0.1)] rounded-full text-[rgb(var(--color-error))]">
                <AlertTriangle size={20} />
              </div>
            </div>
          </Card>
          
          <Card className="bg-[rgba(var(--color-warning),0.05)]">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-[rgb(var(--color-text-secondary))]">Pending</div>
                <div className="text-2xl font-semibold">{pendingCount}</div>
              </div>
              <div className="p-2 bg-[rgba(var(--color-warning),0.1)] rounded-full text-[rgb(var(--color-warning))]">
                <Loader size={20} />
              </div>
            </div>
          </Card>
        </div>
      </Panel>
      
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map(button => (
          <Button
            key={button.id === null ? 'all' : button.id}
            onClick={() => setActiveFilter(button.id)}
            variant={activeFilter === button.id ? 'primary' : 'outline'}
            size="sm"
            className={activeFilter === button.id ? '' : 'bg-[rgba(var(--color-primary),0.1)]'}
          >
            {button.label}
          </Button>
        ))}
      </div>

      {/* If filtered view is active */}
      {activeFilter && (
        <Panel title={`${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Services`}>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[rgba(var(--color-card-muted),0.7)] rounded-lg"></div>
                      <div>
                        <div className="h-5 w-24 bg-[rgba(var(--color-card-muted),0.7)] rounded mb-2"></div>
                        <div className="h-4 w-16 bg-[rgba(var(--color-card-muted),0.7)] rounded"></div>
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-[rgba(var(--color-card-muted),0.7)] rounded-full"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predefinedServices[activeFilter as keyof typeof predefinedServices].map((service) => {
                  // Check if this service is already connected
                  const existingConnection = connections.find(conn => conn.id.startsWith(service.id));
                  
                  return (
                    <Card 
                      key={service.id}
                      className={`hover:border-[rgb(var(--color-primary-light))] transition-colors duration-300 flex flex-col relative`}
                    >
                      {service.comingSoon && <ComingSoonBanner />}
                      <div className="flex justify-between items-start relative z-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 p-3 bg-[rgba(var(--color-primary),0.1)] rounded-lg text-[rgb(var(--color-primary))]">
                            {service.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            <div className="text-xs text-[rgb(var(--color-text-secondary))]">
                              {service.provider}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {existingConnection && (
                            <StatusPill 
                              status={
                                existingConnection.status === 'connected' ? 'success' : 
                                existingConnection.status === 'pending' ? 'warning' : 
                                existingConnection.status === 'error' ? 'error' : 'warning'
                              } 
                              text={existingConnection.status} 
                              size="sm"
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-[rgb(var(--color-text-secondary))] flex-grow">
                        {service.description}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-[rgb(var(--color-border))]">
                        <Button 
                          onClick={() => {
                            if (!service.comingSoon) {
                              setSelectedService({
                                ...service,
                                type: activeFilter as 'communication' | 'notification' | 'cloud' | 'authentication',
                                status: 'disconnected',
                                lastConnected: null
                              });
                              setShowAddModal(true);
                            }
                          }}
                          variant={existingConnection ? "outline" : "primary"}
                          size="sm"
                          fullWidth
                          disabled={service.comingSoon}
                          leftIcon={existingConnection ? <Settings size={14} /> : <ExternalLink size={14} />}
                        >
                          {existingConnection ? 'Configure' : 'Connect'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
          )}
        </Panel>
      )}

      {/* Group by category when no filter is selected */}
      {!activeFilter && (
        <>
          {/* Authentication Services */}
          <Panel 
            title="Authentication Services" 
            description="Identity providers for SSO and authentication"
            defaultExpanded={true}
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-20 w-full bg-[rgba(var(--color-card-muted),0.3)] rounded"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predefinedServices.authentication.map((service) => {
                  // Check if this service is already connected
                  const existingConnection = connections.find(conn => conn.id.startsWith(service.id));
                  
                  return (
                    <Card 
                      key={service.id}
                      className={`hover:border-[rgb(var(--color-primary-light))] transition-colors duration-300 flex flex-col relative`}
                    >
                      {service.comingSoon && <ComingSoonBanner />}
                      <div className="flex justify-between items-start relative z-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 p-3 bg-[rgba(var(--color-primary),0.1)] rounded-lg text-[rgb(var(--color-primary))]">
                            {service.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            <div className="text-xs text-[rgb(var(--color-text-secondary))]">
                              {service.provider}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {existingConnection && (
                            <StatusPill 
                              status={
                                existingConnection.status === 'connected' ? 'success' : 
                                existingConnection.status === 'pending' ? 'warning' : 
                                existingConnection.status === 'error' ? 'error' : 'warning'
                              } 
                              text={existingConnection.status} 
                              size="sm"
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-[rgb(var(--color-text-secondary))] flex-grow">
                        {service.description}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-[rgb(var(--color-border))]">
                        <Button 
                          onClick={() => {
                            if (!service.comingSoon) {
                              setSelectedService({
                                ...service,
                                type: 'authentication',
                                status: 'disconnected',
                                lastConnected: null
                              });
                              setShowAddModal(true);
                            }
                          }}
                          variant={existingConnection ? "outline" : "primary"}
                          size="sm"
                          fullWidth
                          disabled={service.comingSoon}
                          leftIcon={existingConnection ? <Settings size={14} /> : <ExternalLink size={14} />}
                        >
                          {existingConnection ? 'Configure' : 'Connect'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Panel>
          
          {/* Communication Services */}
          <Panel 
            title="Communication Services" 
            description="Team collaboration tools and notification channels"
            defaultExpanded={true}
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-20 w-full bg-[rgba(var(--color-card-muted),0.3)] rounded"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predefinedServices.communication.map((service) => {
                  // Check if this service is already connected
                  const existingConnection = connections.find(conn => conn.id.startsWith(service.id));
                  
                  return (
                    <Card 
                      key={service.id}
                      className={`hover:border-[rgb(var(--color-primary-light))] transition-colors duration-300 flex flex-col relative`}
                    >
                      {service.comingSoon && <ComingSoonBanner />}
                      <div className="flex justify-between items-start relative z-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 p-3 bg-[rgba(var(--color-primary),0.1)] rounded-lg text-[rgb(var(--color-primary))]">
                            {service.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            <div className="text-xs text-[rgb(var(--color-text-secondary))]">
                              {service.provider}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {existingConnection && (
                            <StatusPill 
                              status={
                                existingConnection.status === 'connected' ? 'success' : 
                                existingConnection.status === 'pending' ? 'warning' : 
                                existingConnection.status === 'error' ? 'error' : 'warning'
                              } 
                              text={existingConnection.status} 
                              size="sm"
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-[rgb(var(--color-text-secondary))] flex-grow">
                        {service.description}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-[rgb(var(--color-border))]">
                        <Button 
                          onClick={() => {
                            if (!service.comingSoon) {
                              setSelectedService({
                                ...service,
                                type: 'communication',
                                status: 'disconnected',
                                lastConnected: null
                              });
                              setShowAddModal(true);
                            }
                          }}
                          variant={existingConnection ? "outline" : "primary"}
                          size="sm"
                          fullWidth
                          disabled={service.comingSoon}
                          leftIcon={existingConnection ? <Settings size={14} /> : <ExternalLink size={14} />}
                        >
                          {existingConnection ? 'Configure' : 'Connect'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Panel>
          
          {/* Notification Services */}
          <Panel 
            title="Notification Services" 
            description="Alert channels and notification delivery"
            defaultExpanded={true}
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-20 w-full bg-[rgba(var(--color-card-muted),0.3)] rounded"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predefinedServices.notification.map((service) => {
                  // Check if this service is already connected
                  const existingConnection = connections.find(conn => conn.id.startsWith(service.id));
                  
                  return (
                    <Card 
                      key={service.id}
                      className={`hover:border-[rgb(var(--color-primary-light))] transition-colors duration-300 flex flex-col relative`}
                    >
                      {service.comingSoon && <ComingSoonBanner />}
                      <div className="flex justify-between items-start relative z-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 p-3 bg-[rgba(var(--color-primary),0.1)] rounded-lg text-[rgb(var(--color-primary))]">
                            {service.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            <div className="text-xs text-[rgb(var(--color-text-secondary))]">
                              {service.provider}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {existingConnection && (
                            <StatusPill 
                              status={
                                existingConnection.status === 'connected' ? 'success' : 
                                existingConnection.status === 'pending' ? 'warning' : 
                                existingConnection.status === 'error' ? 'error' : 'warning'
                              } 
                              text={existingConnection.status} 
                              size="sm"
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-[rgb(var(--color-text-secondary))] flex-grow">
                        {service.description}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-[rgb(var(--color-border))]">
                        <Button 
                          onClick={() => {
                            if (!service.comingSoon) {
                              setSelectedService({
                                ...service,
                                type: 'notification',
                                status: 'disconnected',
                                lastConnected: null
                              });
                              setShowAddModal(true);
                            }
                          }}
                          variant={existingConnection ? "outline" : "primary"}
                          size="sm"
                          fullWidth
                          disabled={service.comingSoon}
                          leftIcon={existingConnection ? <Settings size={14} /> : <ExternalLink size={14} />}
                        >
                          {existingConnection ? 'Configure' : 'Connect'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Panel>
          
          {/* Cloud Services */}
          <Panel 
            title="Cloud Services" 
            description="Cloud provider integrations"
            defaultExpanded={true}
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-20 w-full bg-[rgba(var(--color-card-muted),0.3)] rounded"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predefinedServices.cloud.map((service) => {
                  // Check if this service is already connected
                  const existingConnection = connections.find(conn => conn.id.startsWith(service.id));
                  
                  return (
                    <Card 
                      key={service.id}
                      className={`hover:border-[rgb(var(--color-primary-light))] transition-colors duration-300 flex flex-col relative`}
                    >
                      {service.comingSoon && <ComingSoonBanner />}
                      <div className="flex justify-between items-start relative z-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 p-3 bg-[rgba(var(--color-primary),0.1)] rounded-lg text-[rgb(var(--color-primary))]">
                            {service.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            <div className="text-xs text-[rgb(var(--color-text-secondary))]">
                              {service.provider}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {existingConnection && (
                            <StatusPill 
                              status={
                                existingConnection.status === 'connected' ? 'success' : 
                                existingConnection.status === 'pending' ? 'warning' : 
                                existingConnection.status === 'error' ? 'error' : 'warning'
                              } 
                              text={existingConnection.status} 
                              size="sm"
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-[rgb(var(--color-text-secondary))] flex-grow">
                        {service.description}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-[rgb(var(--color-border))]">
                        <Button 
                          onClick={() => {
                            if (!service.comingSoon) {
                              setSelectedService({
                                ...service,
                                type: 'cloud',
                                status: 'disconnected',
                                lastConnected: null
                              });
                              setShowAddModal(true);
                            }
                          }}
                          variant={existingConnection ? "outline" : "primary"}
                          size="sm"
                          fullWidth
                          disabled={service.comingSoon}
                          leftIcon={existingConnection ? <Settings size={14} /> : <ExternalLink size={14} />}
                        >
                          {existingConnection ? 'Configure' : 'Connect'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Panel>
        </>
      )}
      
      {/* Advanced Settings Panel */}
      <Panel 
        title="Connection Settings" 
        description="Global integration preferences"
        defaultExpanded={false}
      >
        <div className="space-y-4">
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Auto-Reconnect</h3>
                <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                  Automatically attempt reconnection when services disconnect
                </p>
              </div>
              <Button 
                variant="ghost" 
                className="text-[rgb(var(--color-primary))]"
                aria-label="Toggle auto-reconnect"
              >
                <ToggleRight size={24} />
              </Button>
            </div>
          </Card>
          
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Integration Notifications</h3>
                <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                  Receive alerts when integration status changes
                </p>
              </div>
              <Button 
                variant="ghost" 
                className="text-[rgb(var(--color-primary))]"
                aria-label="Toggle integration notifications"
              >
                <ToggleRight size={24} />
              </Button>
            </div>
          </Card>
          
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">OAuth Security Level</h3>
                <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                  Enhanced security for OAuth connection tokens
                </p>
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-sm text-[rgb(var(--color-text-secondary))]">High</span>
                <Lock size={18} className="text-[rgb(var(--color-success))]" />
              </div>
            </div>
          </Card>
        </div>
      </Panel>
      
      {/* Add Integration Modal */}
      {showAddModal && selectedService && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[rgba(var(--color-primary),0.1)] rounded-lg text-[rgb(var(--color-primary))]">
                {selectedService.icon}
              </div>
              <div>
                <span>{selectedService.name}</span>
                <p className="text-sm text-[rgb(var(--color-text-secondary))]">{selectedService.provider}</p>
              </div>
            </div>
          }
          footerContent={
            <div className="flex flex-col gap-2">
              {smtpValidationError && (
                <div className="p-2 rounded text-sm bg-[rgba(var(--color-error),0.1)] text-[rgb(var(--color-error))] flex items-center">
                  <AlertTriangle size={16} className="mr-2" />
                  {smtpValidationError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveSMTPConfig}
                  disabled={isSmtpSaveDisabled}
                  isLoading={isLoading}
                >
                  {smtpConfig.id ? 'Update' : 'Connect'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Configuration Settings</h3>
              <p className="text-sm text-[rgb(var(--color-text-secondary))] mb-4">
                Configure your {selectedService.name} integration
              </p>
            </div>
            
            {/* Configuration fields */}
            <div className="space-y-4">
              {selectedService.type === 'authentication' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">Client ID</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                      placeholder="Enter client ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">Client Secret</label>
                    <input
                      type="password"
                      className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                      placeholder="Enter client secret"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">Redirect URI</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-[rgb(var(--color-border))] bg-[rgba(var(--color-card-muted),0.3)] rounded-md text-[rgb(var(--color-text))]"
                      value="https://app.everyst.com/auth/callback"
                      disabled
                    />
                    <p className="mt-1 text-xs text-[rgb(var(--color-text-secondary))]">
                      Use this URL in your {selectedService.name} application settings
                    </p>
                  </div>
                </>
              )}
              
              {selectedService.type === 'communication' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">Webhook URL</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                      placeholder="Enter webhook URL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">API Key</label>
                    <input
                      type="password"
                      className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                      placeholder="Enter API key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">Channel</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                      placeholder="Enter channel name"
                    />
                  </div>
                </>
              )}
              
              {selectedService.type === 'notification' && selectedService.id === 'email' && (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">SMTP Server</label>
                      <input
                        type="text"
                        name="host"
                        value={smtpConfig.host}
                        onChange={handleSMTPChange}
                        className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">Port</label>
                        <input
                          type="number"
                          name="port"
                          value={smtpConfig.port}
                          onChange={handleSMTPChange}
                          className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                          placeholder="587"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">Security</label>
                        <select
                          name="use_tls"
                          value={smtpConfig.use_tls ? "tls" : "none"}
                          onChange={(e) => setSmtpConfig(prev => ({
                            ...prev,
                            use_tls: e.target.value === "tls"
                          }))}
                          className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                        >
                          <option value="tls">TLS</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">Username</label>
                      <input
                        type="text"
                        name="username"
                        value={smtpConfig.username}
                        onChange={handleSMTPChange}
                        className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                        placeholder="username@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={smtpConfig.password}
                        onChange={handleSMTPChange}
                        className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                        placeholder="••••••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">From Email</label>
                      <input
                        type="email"
                        name="from_email"
                        value={smtpConfig.from_email}
                        onChange={handleSMTPChange}
                        className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                        placeholder="notifications@yourcompany.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">From Name (Optional)</label>
                      <input
                        type="text"
                        name="from_name"
                        value={smtpConfig.from_name}
                        onChange={handleSMTPChange}
                        className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                        placeholder="Everyst Notifications"
                      />
                    </div>
                    <div className="pt-2 border-t border-[rgb(var(--color-border))] mt-4">
                      <p className="text-sm text-[rgb(var(--color-text-secondary))] mb-3">
                        Test your SMTP configuration by sending a test email:
                      </p>
                      <div className="flex space-x-2">
                        <input
                          type="email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          className="flex-1 p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                          placeholder="Enter test email address"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTestSMTPConnection}
                          disabled={isSmtpTestDisabled}
                        >
                          {testingEmail ? <Loader size={16} className="animate-spin" /> : "Send Test"}
                        </Button>
                      </div>
                      {testResult && (
                        <div className={`mt-2 p-2 rounded text-sm ${testResult.success ? 'bg-[rgba(var(--color-success),0.1)] text-[rgb(var(--color-success))]' : 'bg-[rgba(var(--color-error),0.1)] text-[rgb(var(--color-error))]'}`}>
                          {testResult.success ? (
                            <div className="flex items-center">
                              <Check size={16} className="mr-2" />
                              {testResult.message}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <AlertTriangle size={16} className="mr-2" />
                              {testResult.message}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center pt-2">
                      <input 
                        type="checkbox" 
                        id="make-default"
                        name="is_active"
                        checked={smtpConfig.is_active}
                        onChange={handleSMTPChange}
                        className="mr-2 w-4 h-4 text-[rgb(var(--color-primary))]" 
                      />
                      <label htmlFor="make-default" className="text-sm">Set as default email configuration</label>
                    </div>
                    {smtpValidationError && (
                      <div className="mt-2 p-2 rounded text-sm bg-[rgba(var(--color-error),0.1)] text-[rgb(var(--color-error))]">
                        <div className="flex items-center">
                          <AlertTriangle size={16} className="mr-2" />
                          {smtpValidationError}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {selectedService.type === 'notification' && selectedService.id !== 'email' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">Notification Endpoint</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                      placeholder="Enter endpoint URL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">API Key</label>
                    <input
                      type="password"
                      className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                      placeholder="Enter API key"
                    />
                  </div>
                </>
              )}
              
              {selectedService.type === 'cloud' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">Access Key</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                      placeholder="Enter access key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">Secret Key</label>
                    <input
                      type="password"
                      className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                      placeholder="Enter secret key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">Region</label>
                    <select
                      className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                    >
                      <option value="">Select region</option>
                      <option value="us-east-1">US East (N. Virginia)</option>
                      <option value="us-west-1">US West (N. California)</option>
                      <option value="eu-west-1">EU (Ireland)</option>
                      <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="pt-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2 w-4 h-4 text-[rgb(var(--color-primary))]" 
                  />
                  <span className="text-sm">Enable notifications from this integration</span>
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};