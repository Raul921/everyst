import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Network, 
  LineChart, 
  Shield, 
  ScrollText, 
  Bell, 
  Layers, 
  Wrench, 
  Settings, 
  ChevronLeft,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapse: () => void;
}

interface NavItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onCollapse }) => {
  const location = useLocation();
  
  const navItems: NavItem[] = [
    { 
      path: '/summit', 
      name: 'Edem', 
      icon: <LayoutDashboard size={18} />,
      description: 'информационная панель'
    },
    { 
      path: '/network-map', 
      name: 'Harmony View', 
      icon: <Network size={18} />,
      description: 'Визуализация сети и соединений'
    },
    { 
      path: '/metrics', 
      name: 'Sky Pulse', 
      icon: <LineChart size={18} />,
      description: 'Метрика системы'
    },
    { 
      path: '/security', 
      name: 'ZionWall', 
      icon: <Shield size={18} />,
      description: 'Управление безопасностью'
    },
    { 
      path: '/logs', 
      name: 'LogVision', 
      icon: <ScrollText size={18} />,
      description: 'Просмотр и анализ логов'
    },
    { 
      path: '/alerts', 
      name: 'AlertHub', 
      icon: <Bell size={18} />,
      description: 'Центр оповещенийr'
    },
    { 
      path: '/integrations', 
      name: 'FlowConnect', 
      icon: <Layers size={18} />,
      description: 'Интеграция сервисов'
    },
    { 
      path: '/tools', 
      name: 'PowerTools', 
      icon: <Wrench size={18} />,
      description: 'Утилиты'
    },
    { 
      path: '/climbers', 
      name: 'UserControl', 
      icon: <Users size={18} />,
      description: 'Упрпавление пользователями'
    },
    { 
      path: '/settings', 
      name: 'SystemCore', 
      icon: <Settings size={18} />,
      description: 'Настройки системы'
    }
  ];

  // Fix for logo appearance in collapsed state
  const logoVariants = {
    expanded: { scale: 1.1 },
    collapsed: { scale: 1.1 }
  };

  // Animation variants
  const sidebarVariants = {
    expanded: { width: '16rem' },
    collapsed: { width: '4rem' }
  };
  
  const textVariants = {
    expanded: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.2,
        delay: 0.1
      }
    },
    collapsed: { 
      opacity: 0, 
      x: -10,
      transition: { 
        duration: 0.1 
      }
    }
  };

  // Removed unused collapseButtonVariants

  const activeIndicatorVariants = {
    initial: { height: 0 },
    animate: { height: '80%', transition: { type: "spring", stiffness: 300, damping: 20 } }
  };

  return (
    <motion.aside 
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30
      }}
      className={`bg-[rgb(var(--color-card))] border-r border-[rgb(var(--color-border))] h-screen flex flex-col text-[rgb(var(--color-text))] relative`}
    >
      {/* Company Logo */}
      <div className="border-b border-[rgb(var(--color-border))] overflow-hidden">
        <motion.div 
          className={`flex items-center justify-center py-4 ${
            isCollapsed ? 'px-2' : 'px-4'
          }`}
        >
          <motion.div
            variants={logoVariants}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 15 
            }}
            className="relative z-10 flex items-center justify-center"
            aria-label="adam logo"
          >
            <img 
              src="/images/everyst-logo.svg" 
              alt="A.D.A.M" 
              className={isCollapsed ? "h-10 w-10" : "h-12 w-12"} 
            />
          </motion.div>
          
          {!isCollapsed && (
            <motion.div
              variants={{
                expanded: { opacity: 1, x: 0 },
                collapsed: { opacity: 0, x: -10 }
              }}
              initial="collapsed"
              animate="expanded"
              className="ml-3"
            >
              <span className="text-xl font-bold tracking-wide text-[rgb(var(--color-primary))]">
                A.D.A.M
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        {/* Use a container with fixed positioning to prevent movement */}
        <div className="relative">
          <ul className="space-y-0.5">
            {navItems.map((item, index) => {
              // Special case for Summit dashboard to handle both / and /summit
              const isActive = item.path === '/summit' 
                ? (location.pathname === '/summit' || location.pathname === '/') 
                : location.pathname === item.path;
              
              return (
                <motion.li 
                  key={item.path}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.05,
                    duration: 0.2
                  }}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2.5 rounded-md group relative whitespace-nowrap ${
                      isActive
                        ? 'bg-[rgba(var(--color-primary),0.08)] text-[rgb(var(--color-primary))]'
                        : 'hover:bg-[rgba(var(--color-primary),0.04)] text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))]'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {/* Active indicator line */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.span 
                          initial="initial"
                          animate="animate"
                          variants={activeIndicatorVariants}
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 bg-[rgb(var(--color-primary))] rounded-r-md"
                        ></motion.span>
                      )}
                    </AnimatePresence>
                    
                    <span
                      className={`flex-shrink-0 ${isActive ? 'text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text-secondary))]'} group-hover:text-[rgb(var(--color-primary))]`}
                    >
                      {item.icon}
                    </span>
                    
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div 
                          variants={textVariants}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          className="ml-3 flex flex-col overflow-hidden"
                          style={{ 
                            position: 'absolute', 
                            left: '2.25rem', // Positioned to stay in place
                            width: 'calc(100% - 3rem)' 
                          }}
                        >
                          <span className={`text-sm font-medium leading-tight ${isActive ? 'text-[rgb(var(--color-primary))]' : ''}`}>
                            {item.name}
                          </span>
                          <span className="text-xs text-[rgb(var(--color-text-secondary))] opacity-80 truncate">
                            {item.description}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer with version number */}
      <div className={`border-t border-[rgb(var(--color-border))] py-3 px-4 overflow-hidden ${
        isCollapsed ? 'text-center' : ''
      }`}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={isCollapsed ? 'collapsed-version' : 'expanded-version'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-[rgb(var(--color-text-secondary))] opacity-70"
          >
            {isCollapsed ? 'v1.0' : 'a.d.a.m v1.0'}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Collapse button - Fixed to extend beyond sidebar */}
      <div 
        className="absolute -right-6 top-1/2 transform -translate-y-1/2 w-12 h-12 flex items-center justify-center"
        style={{ pointerEvents: 'none' }}
      >
        <motion.button
          onClick={onCollapse}
          whileTap={{ scale: 0.95 }}
          variants={{
            expanded: { rotate: 0 },
            collapsed: { rotate: 180 }
          }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
          className="bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-full p-1.5 text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))] hover:border-[rgb(var(--color-primary))] shadow-sm focus:outline-none cursor-pointer"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ pointerEvents: 'auto' }}
        >
          <ChevronLeft size={16} />
        </motion.button>
      </div>
    </motion.aside>
  );
};