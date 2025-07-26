import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardEmptyState,
  Panel, 
  StatusPill, 
  IconButton,
  Button
} from '../../components/ui';
import { 
  Plus, 
  RefreshCw, 
  Shield,
  MessageSquare, 
  X, 
  Bell,
  Phone,
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
  GitBranch,
  AlertCircle,
  Terminal,
  FileDigit,
  FileBarChart,
  KeyRound,
  ShieldAlert,
  HardDrive
} from 'lucide-react';

// Updated types for our integrations to include security and monitoring categories
interface ServiceConnection {
  id: string;
  name: string;
  type: 'Безопастность' | 'Мониторинг' | 'Аутентификация';
  provider: string;
  status: 'подключено' | 'отключено' | 'ошибка' | 'ожидание';
  lastConnected: string | null;
  icon: React.ReactNode;
  connectedAccount?: string;
  workspaces?: string[];
  description?: string;
}

export const BasecampIntegrations: React.FC = () => {
  // State for service connections
  const [connections, setConnections] = useState<ServiceConnection[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  
  // Modal state for adding new integrations
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Sample data - this would come from API in a real app
  useEffect(() => {
    // Simulate API delay
    const fetchData = async () => {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const sampleConnections: ServiceConnection[] = [

        {
          id: 'datadog-1',
          name: 'Datadog',
          type: 'Мониторинг',
          provider: 'Datadog',
          status: 'Отключено',
          lastConnected: null,
          icon: <FileBarChart size={24} />,
          description: 'Мониторинг безопасности и соответствия требованиям'
        },
        {
          id: 'splunk-1',
          name: 'Splunk',
          type: 'Мониторинг',
          provider: 'Splunk',
          status: 'Отключено',
          lastConnected: null,
          icon: <FileDigit size={24} />,
          description: 'Интеграция SIEM для анализа журналов безопасности'
        },
        {
          id: 'crowdstrike-1',
          name: 'CrowdStrike',
          type: 'Безопастность',
          provider: 'CrowdStrike',
          status: 'Отключено',
          lastConnected: null,
          icon: <ShieldAlert size={24} />,
          description: 'Безопасность конечных точек и аналитика угроз'
        },
        {
          id: 'sentinelone-1',
          name: 'SentinelOne',
          type: 'Безопастность',
          provider: 'SentinelOne',
          status: 'Отключено',
          lastConnected: null,
          icon: <Shield size={24} />,
          description: 'Автономная защита конечных точек'
        },
        {
          id: 'okta-1',
          name: 'Okta',
          type: 'Аутентификация',
          provider: 'Okta',
          status: 'Отключено',
          lastConnected: null,
          icon: <User size={24} />,
          description: 'Управление идентификацией и единый вход'
        },
        {
          id: 'hashicorp-vault-1',
          name: 'HashiCorp Vault',
          type: 'Безопастность',
          provider: 'HashiCorp',
          status: 'Отключено',
          lastConnected: null,
          icon: <KeyRound size={24} />,
          description: 'Управление секретами и шифрование данных'
        },
        {
          id: 'cloudflare-1',
          name: 'Cloudflare',
          type: 'Безопастность',
          provider: 'Cloudflare',
          status: 'Отключено',
          lastConnected: null,
          icon: <Shield size={24} />,
          description: 'Защита от DDoS-атак и WAF'
        },
        {
          id: 'snyk-1',
          name: 'Snyk',
          type: 'Безопастность',
          provider: 'Snyk',
          status: 'Отключено',
          lastConnected: null,
          icon: <GitBranch size={24} />,
          description: 'Анализ состава программного обеспечения'
        },
        {
          id: 'sonarqube-1',
          name: 'SonarQube',
          type: 'Безопастность',
          provider: 'SonarSource',
          status: 'Отключено',
          lastConnected: null,
          icon: <Terminal size={24} />,
          description: 'Проверка качества кода и безопасности'
        }
      ];
      
      setConnections(sampleConnections);
      setIsLoading(false);
    };
    
    fetchData();
  }, []);
  
  // Function to refresh connections
  const refreshConnections = () => {
    setIsLoading(true);
    // Simulate fetch again
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };
  
  // Connect/disconnect a service
  const toggleConnection = (id: string) => {
    setIsConnecting(id);
    
    // Simulate API call delay
    setTimeout(() => {
      setConnections(prev => 
        prev.map(conn => {
          if (conn.id === id) {
            const newStatus = conn.status === 'Подключено' ? 'Отключено' : 'Подключено';
            // Only set lastConnected when connecting, keep null when disconnecting
            const newLastConnected = newStatus === 'Подключено' ? new Date().toISOString() : null;
            
            // For connected state, we'll just add placeholder text for account details
            // The actual implementation of connection details will be done later
            return {
              ...conn,
              status: newStatus,
              lastConnected: newLastConnected,
              connectedAccount: newStatus === 'Подключено' ? 'Настроить параметры подключения' : undefined,
              workspaces: newStatus === 'Подключено' ? ['Необходимые настройки'] : undefined
            };
          }
          return conn;
        })
      );
      setIsConnecting(null);
    }, 1500);
  };
  
  // Get counts for the overview
  const connectedCount = connections.filter(c => c.status === 'Подключено').length;
  const errorCount = connections.filter(c => c.status === 'Ошибка').length;
  const pendingCount = connections.filter(c => c.status === 'Ожидание').length;
  
  // Filter connections by type
  const filteredConnections = activeFilter 
    ? connections.filter(conn => conn.type === activeFilter)
    : connections;
  
  // Group connections by type
  const groupedConnections = {
    security: connections.filter(conn => conn.type === 'Безопастность'),
    monitoring: connections.filter(conn => conn.type === 'Мониторинг'),
    authentication: connections.filter(conn => conn.type === 'Аутентификация')
  };
  
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut" 
      }
    }),
    exit: { opacity: 0, y: -20 }
  };
  
  // Render a connection card
  const renderConnectionCard = (connection: ServiceConnection, index: number) => {
    // Fix the variable reference error here - use a direct comparison instead of assignment
    const isCurrentlyConnecting = isConnecting === connection.id;
    
    return (
      <motion.div
        key={connection.id}
        custom={index}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={cardVariants}
        layoutId={connection.id}
      >
        <Card 
          className="hover:border-[rgb(var(--color-primary-light))] transition-colors duration-300"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-2 bg-[rgba(var(--color-primary),0.1)] rounded-lg text-[rgb(var(--color-primary))]">
                {connection.icon}
              </div>
              <div>
                <h3 className="font-medium">{connection.name}</h3>
                <div className="text-xs text-[rgb(var(--color-text-secondary))]">
                  {connection.provider}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <StatusPill 
                status={
                  connection.status === 'Подключено' ? 'успешно' : 
                  connection.status === 'В ожидании' ? 'предупреждение' : 
                  connection.status === 'Ошибка' ? 'Ошибка' : 'Ожидание' // Default to 'warning' instead of 'none'
                } 
                text={connection.status} 
                size="sm"
              />
              <Button
                variant="ghost" 
                size="sm"
                aria-label="Configure"
                title="Configure"
                className="p-1"
              >
                <Settings size={16} />
              </Button>
            </div>
          </div>
          
          {connection.description && (
            <div className="mt-2 text-sm text-[rgb(var(--color-text-secondary))]">
              {connection.description}
            </div>
          )}
          
          {connection.status === 'Подключено' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-3 border-t border-[rgb(var(--color-border))]"
            >
              <div className="flex items-center justify-center p-3 bg-[rgba(var(--color-primary),0.05)] rounded-md text-sm">
                <Settings size={16} className="text-[rgb(var(--color-primary))] mr-2" />
                <span>Требуется настройка. Для завершения настройки перейдите в раздел настроек.</span>
              </div>
              
              {connection.lastConnected && (
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-[rgb(var(--color-text-secondary))]">Подключено:</span>
                  <span>{new Date(connection.lastConnected).toLocaleDateString()}</span>
                </div>
              )}
            </motion.div>
          )}
          
          {connection.status === 'Ошибка' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-3 bg-[rgba(var(--color-error),0.1)] rounded-md text-sm flex items-center"
            >
              <AlertTriangle size={16} className="text-[rgb(var(--color-error))] mr-2" />
              Срок действия токена аутентификации истёк. Пожалуйста, переподключитесь.
            </motion.div>
          )}
          
          <div className="mt-4 flex justify-end">
  <Button
    onClick={() => toggleConnection(connection.id)}
    disabled={isCurrentlyConnecting || connection.status === 'в ожидании'}
    variant="outline"
    size="sm"
    isLoading={isCurrentlyConnecting}
    leftIcon={
      isCurrentlyConnecting
        ? undefined
        : connection.status === 'Подключено'
        ? <X size={14} />             // крестик при "Отключить"
        : <ExternalLink size={14} /> // ссылка при "Подключить"
    }
    className={
      connection.status !== 'Подключено'
        ? 'text-[rgb(var(--color-error-light))] hover:bg-[rgba(var(--color-error),0.1)]'
        : ''
    }
  >
    {isCurrentlyConnecting
      ? 'Процесс...'
      : connection.status === 'Подключено'
      ? 'Отключить'
      : 'Подключить'}
  </Button>
</div>

        </Card>
      </motion.div>
    );
  };
  
  // Updated filter buttons to match the new integration types
  const filterButtons = [
    { id: null, label: 'Все' },
    { id: 'security', label: 'Безопастность' },
    { id: 'monitoring', label: 'Мониторинг' },
    { id: 'authentication', label: 'Аутентификация' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Page header with breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">FlowConnect</h1>
          <p className="text-[rgb(var(--color-text-secondary))]">Управляйте подключениями к службам безопасности</p>
        </div>
      </div>

      {/* Overview panel */}
      <Panel 
        title="Обзор подключений" 
        description="Состояние ваших интеграций безопасности"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[rgba(var(--color-primary),0.05)]">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-[rgb(var(--color-text-secondary))]">Всего подключений</div>
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
                <div className="text-sm text-[rgb(var(--color-text-secondary))]">Подключено</div>
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
                <div className="text-sm text-[rgb(var(--color-text-secondary))]">Ошибки подключения</div>
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
                <div className="text-sm text-[rgb(var(--color-text-secondary))]">В ожидании</div>
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
          ) : filteredConnections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConnections.map((connection, index) => renderConnectionCard(connection, index))}
            </div>
          ) : (
            <Card>
              <CardEmptyState                  message={`No ${activeFilter} integrations found`}
                  action={
                    <Button 
                      onClick={() => setShowAddModal(true)}
                      variant="primary"
                    >
                      Добавить интеграцию
                    </Button>
                  }
                />
            </Card>
          )}
        </Panel>
      )}

      {/* Group by category when no filter is selected */}
      {!activeFilter && (
        <>
          {/* Security Services */}
          <Panel 
            title="Услуги безопасности" 
            description="Инструменты безопасности и платформы анализа угроз"
            defaultExpanded={true}
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-20 w-full bg-[rgba(var(--color-card-muted),0.3)] rounded"></div>
                  </Card>
                ))}
              </div>
            ) : groupedConnections.security.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedConnections.security.map((connection, index) => 
                  renderConnectionCard(connection, index)
                )}
              </div>
            ) : (
              <Card>
                <CardEmptyState 
                  message="Службы безопасности не подключены"
                  action={
                    <Button 
                      onClick={() => {
                        setSelectedType('security');
                        setShowAddModal(true);
                      }}
                      variant="primary"
                    >
                      Подключить сервис
                    </Button>
                  }
                />
              </Card>
            )}
          </Panel>
          
        
          
          
          {/* Monitoring Services */}
          <Panel 
            title="Служба мониторинга" 
            description="Анализ журналов и мониторинг безопасности"
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
            ) : groupedConnections.monitoring.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedConnections.monitoring.map((connection, index) => 
                  renderConnectionCard(connection, index)
                )}
              </div>
            ) : (
              <Card>
                <CardEmptyState 
                  message="Службы мониторинга не подключены"
                  action={
                    <Button 
                      onClick={() => {
                        setSelectedType('monitoring');
                        setShowAddModal(true);
                      }}
                      variant="primary"
                    >
                      Подключить сервис
                    </Button>
                  }
                />
              </Card>
            )}
          </Panel>
          
          
          {/* Authentication Services */}
          <Panel 
            title="Службы аутентификации" 
            description="Управление идентификацией и доступом"
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
            ) : groupedConnections.authentication.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedConnections.authentication.map((connection, index) => 
                  renderConnectionCard(connection, index)
                )}
              </div>
            ) : (
              <Card>
                <CardEmptyState 
                  message="Службы аутентификации не подключены"
                  action={
                    <Button 
                      onClick={() => {
                        setSelectedType('authentication');
                        setShowAddModal(true);
                      }}
                      variant="primary"
                    >
                      Подключить сервис
                    </Button>
                  }
                />
              </Card>
            )}
          </Panel>
        </>
      )}
      
      {/* Advanced Settings Panel */}
      <Panel 
        title="Настройки подключения" 
        description="Глобальные настройки интеграции безопасности"
        defaultExpanded={false}
      >
        <div className="space-y-4">
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Автоматическое повторное подключение</h3>
                <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                  Автоматически пытаться повторно подключиться при отключении услуг
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
                <h3 className="font-medium">Критические оповещения</h3>
                <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                  Получайте немедленные оповещения о критических событиях безопасности
                </p>
              </div>
              <Button 
                variant="ghost" 
                className="text-[rgb(var(--color-primary))]"
                aria-label="Toggle critical alerts"
              >
                <ToggleRight size={24} />
              </Button>
            </div>
          </Card>
          
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Уровень безопасности OAuth</h3>
                <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                  Повышенная безопасность токенов подключения OAuth
                </p>
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-sm text-[rgb(var(--color-text-secondary))]">Высокий</span>
                <Lock size={18} className="text-[rgb(var(--color-success))]" />
              </div>
            </div>
          </Card>
        </div>
      </Panel>
      
      {/* Add Integration Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div 
              className="bg-[rgb(var(--color-card))] rounded-lg shadow-xl max-w-lg w-full"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-[rgb(var(--color-border))] p-4">
                <h2 className="text-xl font-semibold">Добавить интеграцию безопасности</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                  title="Close"
                  className="p-1"
                >
                  <X size={18} />
                </Button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium">
                    Тип интеграции
                  </label>
                  <select 
                    className="w-full p-2 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))]"
                    value={selectedType || ''}
                    onChange={(e) => setSelectedType(e.target.value || null)}
                  >
                    <option value="">Выберите тип...</option>
                    <option value="security">Безопасность</option>
                    <option value="monitoring">Мониторинг</option>
                    <option value="authentication">Аутентификация</option>
                  </select>
                </div>
                
                {selectedType && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {selectedType === 'communication' && (
                        <>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<MessageSquare className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            MS Teams
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<Bell className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            PagerDuty
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<AlertCircle className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            Opsgenie
                          </Button>
                        </>
                      )}
                      
                      {selectedType === 'security' && (
                        <>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<Shield className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            CrowdStrike
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<ShieldAlert className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            SentinelOne
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<KeyRound className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            HashiCorp Vault
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<Terminal className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            Snyk
                          </Button>
                        </>
                      )}
                      
                      {selectedType === 'monitoring' && (
                        <>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<FileBarChart className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            Datadog
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<FileDigit className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            Splunk
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<AlertCircle className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            New Relic
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<HardDrive className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            Elastic
                          </Button>
                        </>
                      )}
                      
                      {selectedType === 'cloud' && (
                        <>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<Cloud className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            AWS Security Hub
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<CloudCog className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            Azure Sentinel
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<Cloud className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            GCP Security
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<CloudCog className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            Prisma Cloud
                          </Button>
                        </>
                      )}
                      
                      {selectedType === 'authentication' && (
                        <>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<User className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            Okta
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<User className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            Auth0
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<User className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            Azure AD
                          </Button>
                          <Button 
                            className="flex-col h-auto py-4"
                            variant="outline"
                            leftIcon={<Lock className="text-[rgb(var(--color-primary))] mb-2" size={24} />}
                          >
                            OneLogin
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <div className="border-t border-[rgb(var(--color-border))] pt-4">
                      <Button 
                        variant="primary"
                        fullWidth
                      >
                        Продолжить
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};