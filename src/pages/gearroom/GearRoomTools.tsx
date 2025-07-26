import { useState, useRef, useEffect } from 'react';
import { 
  Panel, 
  ToolCard,
  FormattedToolOutput,
  Button
} from '../../components/ui';
import { 
  Terminal, 
  Wifi, 
  Search, 
  Database, 
  Play,
  RefreshCw, 
  Settings, 
  Activity,
  Code,
  RotateCcw,
  Shield,
  Maximize2,
  GitBranch,
  Router,
  Waves,
  Network
} from 'lucide-react';
//import type { ToolResponse } from '../../utils/networkTools';

// Types for tool execution
interface CommandResult {
  output: string;
  status: 'успешно' | 'ошибка' | 'предупреждение' | 'информация' | 'загрузка';
  timestamp: string;
}

interface ToolState {
  isExecuting: boolean;
  lastResult: CommandResult | null;
}

// Component for advanced terminal interface
const AdvancedTerminal: React.FC = () => {
  // Track fullscreen state for UI feedback if needed
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const terminalIframeRef = useRef<HTMLIFrameElement>(null);
  
  // Toggle fullscreen for the terminal
  const toggleFullscreen = () => {
    if (terminalContainerRef.current) {
      if (!document.fullscreenElement) {
        terminalContainerRef.current.requestFullscreen().catch(err => {
          console.error(`Ошибка при попытке включить полноэкранный режим: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('полноэкранное изменение', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('полноэкранное изменение', handleFullscreenChange);
    };
  }, []);
  
  // Function to refresh the terminal iframe
  const refreshTerminal = () => {
    if (terminalIframeRef.current) {
      // Generate a unique URL to force refresh
      const timestamp = new Date().getTime();
      terminalIframeRef.current.src = `about:blank?refresh=${timestamp}`;
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center">
          <Terminal size={16} className="text-green-500 mr-2" />
          <span className="text-green-500 text-sm font-mono">Безопасный доступ к системе</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-white transition-colors"
            title={isFullscreen ? "Выйти из полноэкранного режима" : "Войти в полноэкранный режим"}
          >
            <Maximize2 size={16} />
          </button>
          <button 
            className="text-gray-400 hover:text-white transition-colors"
            onClick={refreshTerminal}
            title="Обновить терминал"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      
      <div 
        ref={terminalContainerRef} 
        className="flex-1 bg-black relative"
        style={{ height: '500px' }}
      >
        {/* This would typically be a real terminal integration via WebSockets/SSH */}
        {/* For demo purposes, using a placeholder iframe for visual */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-black/70 p-4 rounded text-green-500 font-mono">
            Для фактической реализации подключитесь к системной оболочке через WebSockets/SSH.
          </div>
        </div>
        
        {/* Terminal display area */}
        <iframe
          ref={terminalIframeRef}
          title="Terminal"
          className="w-full h-full"
          style={{ 
            backgroundColor: "black", 
            border: "none",
            opacity: 0.7
          }}
          src="about:blank"
        ></iframe>
      </div>
    </div>
  );
};

// Component for executing network tools
const ToolExecutor = ({ 
  placeholder, 
  buttonText, 
  exampleCommands = [], 
  processCommand, 
  isExecuting, 
  result, 
  clearResult, 
  toolName 
}: {
  placeholder: string;
  buttonText: string;
  exampleCommands?: string[];
  processCommand: (command: string) => void;
  isExecuting: boolean;
  result: CommandResult | null;
  clearResult: () => void;
  toolName?: string;
}) => {
  const [command, setCommand] = useState<string>('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isExecuting) return;
    processCommand(command);
  };
  
  const handleExampleClick = (example: string) => {
    setCommand(example);
  };
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-[rgb(var(--color-search-bg))] border border-[rgb(var(--color-border))] rounded-md py-1.5 px-3 text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-secondary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
        />
        <button
          type="submit"
          disabled={isExecuting || !command.trim()}
          className="px-4 py-1.5 bg-[rgb(var(--color-primary))] text-white rounded-md hover:bg-[rgb(var(--color-primary-light))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
        >
          {isExecuting ? (
            <RefreshCw size={16} className="animate-spin mr-2" />
          ) : (
            <Play size={16} className="mr-2" />
          )}
          <span>{buttonText}</span>
        </button>
      </form>
      
      {exampleCommands && exampleCommands.length > 0 && (
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs text-[rgb(var(--color-text-secondary))]">Примеры:</span>
          <div className="flex flex-wrap gap-2">
            {exampleCommands.map((example, index) => (
              <button 
                key={index} 
                onClick={() => handleExampleClick(example)}
                className="text-xs px-2 py-1 bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] rounded-md hover:bg-[rgba(var(--color-primary),0.2)] transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {result && (
        <FormattedToolOutput
          toolName={toolName || buttonText}
          command={command}
          output={result.output}
          status={result.status}
          timestamp={result.timestamp}
          onClear={clearResult}
        />
      )}
    </div>
  );
};

// Main GearRoom Component
export const GearRoomTools: React.FC = () => {
  // Tool states
  const [nmapState, setNmapState] = useState<ToolState>({
    isExecuting: false,
    lastResult: null
  });
  
  const [digState, setDigState] = useState<ToolState>({
    isExecuting: false,
    lastResult: null
  });
  
  const [nslookupState, setNslookupState] = useState<ToolState>({
    isExecuting: false,
    lastResult: null
  });
  
  const [tracerouteState, setTracerouteState] = useState<ToolState>({
    isExecuting: false,
    lastResult: null
  });
  
  const [whoisState, setWhoisState] = useState<ToolState>({
    isExecuting: false,
    lastResult: null
  });
  
  const [netstatState, setNetstatState] = useState<ToolState>({
    isExecuting: false,
    lastResult: null
  });
  
  const [pingState, setPingState] = useState<ToolState>({
    isExecuting: false,
    lastResult: null
  });
  
  const [sslState, setSslState] = useState<ToolState>({
    isExecuting: false,
    lastResult: null
  });
  
  const [ipRouteState, setIpRouteState] = useState<ToolState>({
    isExecuting: false,
    lastResult: null
  });
  
  const [tcpdumpState, setTcpdumpState] = useState<ToolState>({
    isExecuting: false,
    lastResult: null
  });

  // Function to run nmap
  const runNmap = (command: string) => {
    setNmapState({
      isExecuting: true,
      lastResult: null
    });
    
    // Extract target from command
    const target = command.split(' ')[0];
    
    // Use API service to execute nmap
    import('../../utils/networkTools').then(({ nmapScan }) => {
      nmapScan(target)
        .then((result) => {
          setNmapState({
            isExecuting: false,
            lastResult: result
          });
        })
        .catch((error) => {
          setNmapState({
            isExecuting: false,
            lastResult: {
              output: `Ошибка: ${error.message || 'Не удалось выполнить сканирование портов.'}`,
              status: 'ошибка',
              timestamp: new Date().toISOString()
            }
          });
        });
    });
  };
  
  // Function to run dig
  const runDig = (command: string) => {
    setDigState({
      isExecuting: true,
      lastResult: null
    });
    
    // Parse command parameters
    const parts = command.split(' ');
    const target = parts[0];
    const recordType = parts.length > 1 ? parts[1] : 'A';
    
    // Use API service to execute dig
    import('../../utils/gearRoomApi').then(({ runDigApi }) => {
      runDigApi(target, recordType)
        .then((result) => {
          setDigState({
            isExecuting: false,
            lastResult: result
          });
        })
        .catch((error) => {
          setDigState({
            isExecuting: false,
            lastResult: {
              output: `Ошибка: ${error instanceof Error ? error.message : 'Не удалось выполнить поиск DNS'}`,
              status: 'Ошибка',
              timestamp: new Date().toISOString()
            }
          });
        });
    });
  };
  
  // Function to run nslookup
  const runNslookup = (command: string) => {
    setNslookupState({
      isExecuting: true,
      lastResult: null
    });
    
    // Extract target from command
    const target = command.split(' ')[0];
    
    // Use API service to execute nslookup
    import('../../utils/gearRoomApi').then(({ runNslookupApi }) => {
      runNslookupApi(target)
        .then((result) => {
          setNslookupState({
            isExecuting: false,
            lastResult: result
          });
        })
        .catch((error) => {
          setNslookupState({
            isExecuting: false,
            lastResult: {
              output: `Ошибка: ${error instanceof Error ? error.message : 'Не удалось выполнить nslookup'}`,
              status: 'Ошибка',
              timestamp: new Date().toISOString()
            }
          });
        });
    });
  };
  
  // Function to run traceroute
  const runTraceroute = (command: string) => {
    setTracerouteState({
      isExecuting: true,
      lastResult: null
    });
    
    // Extract target from command
    const target = command.split(' ')[0];
    
    // Use API service to execute traceroute
    import('../../utils/gearRoomApi').then(({ runTracerouteApi }) => {
      runTracerouteApi(target)
        .then((result) => {
          setTracerouteState({
            isExecuting: false,
            lastResult: result
          });
        })
        .catch((error) => {
          setTracerouteState({
            isExecuting: false,
            lastResult: {
              output: `Ошибка: ${error instanceof Error ? error.message : 'Не удалось выполнить traceroute'}`,
              status: 'Ошибка',
              timestamp: new Date().toISOString()
            }
          });
        });
    });
  };
  
  // Function to run whois
  const runWhois = (command: string) => {
    setWhoisState({
      isExecuting: true,
      lastResult: null
    });
    
    // Extract target from command
    const target = command.split(' ')[0];
    
    // Use API service to execute whois lookup
    import('../../utils/gearRoomApi').then(({ runWhoisApi }) => {
      runWhoisApi(target)
        .then((result) => {
          setWhoisState({
            isExecuting: false,
            lastResult: result
          });
        })
        .catch((error) => {
          setWhoisState({
            isExecuting: false,
            lastResult: {
              output: `Ошибка: ${error instanceof Error ? error.message : 'Не удалось выполнить поиск whois'}`,
              status: 'Ошибка',
              timestamp: new Date().toISOString()
            }
          });
        });
    });
  };
  
  // Function to run netstat
  const runNetstat = (command: string) => {
    setNetstatState({
      isExecuting: true,
      lastResult: null
    });
    
    // Extract options from command
    const options = command.replace(/^netstat\s+/, '').trim();
    
    // Use API service to execute netstat
    import('../../utils/gearRoomApi').then(({ runNetstatApi }) => {
      runNetstatApi(options)
        .then((result) => {
          setNetstatState({
            isExecuting: false,
            lastResult: result
          });
        })
        .catch((error) => {
          setNetstatState({
            isExecuting: false,
            lastResult: {
              output: `Ошибка: ${error instanceof Error ? error.message : 'Не удалось выполнить команду netstat'}`,
              status: 'Ошибка',
              timestamp: new Date().toISOString()
            }
          });
        });
    });
  };
  
  // Function to run ping using the API
  const runPing = (command: string) => {
    setPingState({
      isExecuting: true,
      lastResult: null
    });
    
    // Extract target from command
    const target = command.split(' ')[0];
    
    // Use API service to execute ping
    import('../../utils/networkTools').then(({ pingHost }) => {
      pingHost(target)
        .then((result) => {
          setPingState({
            isExecuting: false,
            lastResult: result
          });
        })
        .catch((error) => {
          setPingState({
            isExecuting: false,
            lastResult: {
              output: `Ошибка: ${error.message || 'Не удалось выполнить команду ping'}`,
              status: 'Ошибка',
              timestamp: new Date().toISOString()
            }
          });
        });
    });
  };
  
  // Function to run SSL checker
  const runSslCheck = (command: string) => {
    setSslState({
      isExecuting: true,
      lastResult: null
    });
    
    // Extract domain from command (removing any protocol prefix if present)
    const domain = command.split(' ')[0].replace(/^https?:\/\//, '');
    
    // Use API service to execute SSL check
    import('../../utils/gearRoomApi').then(({ runSslCheckApi }) => {
      runSslCheckApi(domain)
        .then((result) => {
          setSslState({
            isExecuting: false,
            lastResult: result
          });
        })
        .catch((error) => {
          setSslState({
            isExecuting: false,
            lastResult: {
              output: `Ошибка: ${error instanceof Error ? error.message : 'Не удалось выполнить проверку SSL'}`,
              status: 'Ошибка',
              timestamp: new Date().toISOString()
            }
          });
        });
    });
  };
  
  // Function to run IP Route
  const runIpRoute = (command: string) => {
    // Command parameter is required for interface consistency but not used for this tool
    void command; // TypeScript no-unused-vars trick
    
    setIpRouteState({
      isExecuting: true,
      lastResult: null
    });
    
    // Use API service to execute IP Route
    import('../../utils/gearRoomApi').then(({ runIpRouteApi }) => {
      runIpRouteApi()
        .then((result) => {
          setIpRouteState({
            isExecuting: false,
            lastResult: result
          });
        })
        .catch((error) => {
          setIpRouteState({
            isExecuting: false,
            lastResult: {
              output: `Ошибка: ${error instanceof Error ? error.message : 'Не удалось получить таблицу маршрутизации'}`,
              status: 'Ошибка',
              timestamp: new Date().toISOString()
            }
          });
        });
    });
  };
  
  // Function to run TCPDump
  const runTcpdump = (command: string) => {
    setTcpdumpState({
      isExecuting: true,
      lastResult: null
    });
    
    // Parse command parameters
    // Format can be: [interface] [filter] [count]
    // e.g., "eth0 port 80 50" or "-i eth0 port 80"
    const parts = command.split(' ');
    let interfaceName = 'any';
    let filter = '';
    const count = 25; // Using a fixed count for simplicity
    
    // Parse interface from command
    if (parts.length > 0) {
      // Check if the command uses -i flag format
      const iIndex = parts.indexOf('-i');
      if (iIndex !== -1 && parts.length > iIndex + 1) {
        interfaceName = parts[iIndex + 1];
        // Remove interface and -i flag for filter parsing
        parts.splice(iIndex, 2);
      } else if (parts[0] && !parts[0].startsWith('-')) {
        // First param is interface if not a flag
        interfaceName = parts[0];
        parts.shift();
      }
    }
    
    // Rest of the command is treated as filter
    filter = parts.join(' ');
    
    // Use API service to execute tcpdump
    import('../../utils/gearRoomApi').then(({ runTcpdumpApi }) => {
      runTcpdumpApi(interfaceName, filter, count)
        .then((result) => {
          setTcpdumpState({
            isExecuting: false,
            lastResult: result
          });
        })
        .catch((error) => {
          setTcpdumpState({
            isExecuting: false,
            lastResult: {
              output: `Ошибка: ${error instanceof Error ? error.message : 'Не удалось выполнить захват пакета.'}`,
              status: 'Ошибка',
              timestamp: new Date().toISOString()
            }
          });
        });
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">PowerTools</h1>
          <p className="text-[rgb(var(--color-text-secondary))]">Инструменты безопасности и системные утилиты</p>
        </div>
      </div>
      
      {/* System Terminal Panel */}
      <Panel 
        title="Системный терминал" 
        description="Безопасный доступ к оболочке системы"
        actions={
          <>
            <Button 
              variant="ghost" 
              aria-label="Full-screen mode"
              title="Full-screen mode"
              className="p-1"
            >
              <Code size={16} />
            </Button>
            <Button 
              variant="ghost" 
              aria-label="Reset terminal"
              title="Reset terminal"
              className="p-1"
            >
              <RotateCcw size={16} />
            </Button>
          </>
        }
      >
        <AdvancedTerminal />
      </Panel>
      
      {/* Network Diagnostic Tools Panel */}
      <Panel 
        title="Диагностика сети" 
        description="Основные инструменты для устранения неполадок в сети"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Using the new ToolCard component */}
          <ToolCard
            icon={<Wifi size={24} />}
            title="Инструмент Пинг"
            description="Проверка базового сетевого подключения к хосту"
            badge={{ text: "Базовый", color: "info" }}
            defaultExpanded={true}
          >
            <ToolExecutor 
              toolName="Инструмент Пинг"
              placeholder="Введите имя хоста или IP-адрес (например, google.com)"
              buttonText="Пинг"
              exampleCommands={['google.com', '8.8.8.8', 'github.com']}
              processCommand={runPing}
              isExecuting={pingState.isExecuting}
              result={pingState.lastResult}
              clearResult={() => setPingState({ isExecuting: false, lastResult: null })}
            />
          </ToolCard>
          
          <ToolCard
            icon={<Search size={24} />}
            title="Сканер портов (nmap)"
            description="Сканировать открытые порты и службы на целевых хостах"
            badge={{ text: "Безопастность", color: "warning" }}
          >
            <ToolExecutor 
              toolName="Сканер портов (nmap)"
              placeholder="Введите имя хоста или IP-адрес для сканирования"
              buttonText="Сканировать"
              exampleCommands={['localhost', '127.0.0.1', 'scanme.nmap.org']}
              processCommand={runNmap}
              isExecuting={nmapState.isExecuting}
              result={nmapState.lastResult}
              clearResult={() => setNmapState({ isExecuting: false, lastResult: null })}
            />
          </ToolCard>
          
          <ToolCard
            icon={<Database size={24} />}
            title="DNS-поиск (dig)"
            description="Запрос DNS-записей для домена"
            badge={{ text: "Сеть", color: "success" }}
          >
            <ToolExecutor 
              toolName="DNS-поиск (dig)"
              placeholder="Введите доменное имя (например, example.com)"
              buttonText="Поиск"
              exampleCommands={['example.com', 'google.com A', 'example.com MX']}
              processCommand={runDig}
              isExecuting={digState.isExecuting}
              result={digState.lastResult}
              clearResult={() => setDigState({ isExecuting: false, lastResult: null })}
            />
          </ToolCard>
          
          <ToolCard
            icon={<Activity size={24} />}
            title="Трассировка"
            description="Трассировка сетевого пути к целевому хосту"
            badge={{ text: "Сеть", color: "успешно" }}
          >
            <ToolExecutor 
              toolName="Трассировка"
              placeholder="Введите имя хоста или IP-адрес для трассировки"
              buttonText="Трассировка"
              exampleCommands={['example.com', '8.8.8.8']}
              processCommand={runTraceroute}
              isExecuting={tracerouteState.isExecuting}
              result={tracerouteState.lastResult}
              clearResult={() => setTracerouteState({ isExecuting: false, lastResult: null })}
            />
          </ToolCard>
          
          <ToolCard
            icon={<Database size={24} />}
            title="Поиск Whois"
            description="Запрос информации о регистрации домена и выделении IP-адреса"
          >
            <ToolExecutor 
              toolName="Поиск Whois"
              placeholder="Введите домен или IP-адрес"
              buttonText="Поиск"
              exampleCommands={['example.com', '192.168.1.1']}
              processCommand={runWhois}
              isExecuting={whoisState.isExecuting}
              result={whoisState.lastResult}
              clearResult={() => setWhoisState({ isExecuting: false, lastResult: null })}
            />
          </ToolCard>
          
          <ToolCard
            icon={<Shield size={24} />}
            title="Проверка SSL-сертификатов"
            description="Проверка SSL-сертификатов и конфигураций"
            badge={{ text: "Безопастность", color: "warning" }}
          >
            <ToolExecutor 
              toolName="Проверка SSL-сертификатов"
              placeholder="Введите домен для проверки SSL-сертификата"
              buttonText="Проверить"
              exampleCommands={['example.com', 'google.com']}
              processCommand={runSslCheck}
              isExecuting={sslState.isExecuting}
              result={sslState.lastResult}
              clearResult={() => setSslState({ isExecuting: false, lastResult: null })}
            />
          </ToolCard>
        </div>
      </Panel>
      
      {/* System Network Tools */}
      <Panel
        title="Системные сетевые инструменты"
        description="Инструменты анализа локальной сети"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolCard
            icon={<Network size={24} />}
            title="Сетевые подключения"
            description="Просмотр активных сетевых подключений"
            badge={{ text: "Сеть", color: "успешно" }}
          >
            <ToolExecutor 
              toolName="Сетевые подключения"
              placeholder="Дополнительные параметры для netstat"
              buttonText="Просмотр соединений"
              exampleCommands={['-tuln', '-ap', '-r']}
              processCommand={runNetstat}
              isExecuting={netstatState.isExecuting}
              result={netstatState.lastResult}
              clearResult={() => setNetstatState({ isExecuting: false, lastResult: null })}
            />
          </ToolCard>
          
          <ToolCard
            icon={<Router size={24} />}
            title="Таблица маршрутизации"
            description="Просмотр информации о маршрутизации IP"
            badge={{ text: "Сеть", color: "успешно" }}
          >
            <ToolExecutor 
              toolName="Таблица маршрутизации"
              placeholder="Дополнительные параметры"
              buttonText="Посмотреть маршруты"
              exampleCommands={['']}
              processCommand={runIpRoute}
              isExecuting={ipRouteState.isExecuting}
              result={ipRouteState.lastResult}
              clearResult={() => setIpRouteState({ isExecuting: false, lastResult: null })}
            />
          </ToolCard>
          
          <ToolCard
            icon={<Waves size={24} />}
            title="Захват пакетов"
            description="Проверка сетевого трафика на уровне пакетов"
            badge={{ text: "Дополнительно", color: "primary" }}
          >
            <ToolExecutor 
              toolName="Захват пакетов"
              placeholder="Введите параметры или оставьте пустым"
              buttonText="Захватить"
              exampleCommands={['-i eth0', '-i eth0 port 80', '-i eth0 host 192.168.1.1']}
              processCommand={runTcpdump}
              isExecuting={tcpdumpState.isExecuting}
              result={tcpdumpState.lastResult}
              clearResult={() => setTcpdumpState({ isExecuting: false, lastResult: null })}
            />
          </ToolCard>
          
          <ToolCard
            icon={<GitBranch size={24} />}
            title="Обратный поиск DNS"
            description="Преобразовать IP-адреса в имена хостов"
            badge={{ text: "Сеть", color: "успешно" }}
          >
            <ToolExecutor 
              placeholder="Введите IP-адрес для поиска"
              buttonText="Искать"
              exampleCommands={['8.8.8.8', '1.1.1.1']}
              processCommand={runNslookup}
              isExecuting={nslookupState.isExecuting}
              result={nslookupState.lastResult}
              clearResult={() => setNslookupState({ isExecuting: false, lastResult: null })}
            />
          </ToolCard>
        </div>
      </Panel>
    </div>
  );
};