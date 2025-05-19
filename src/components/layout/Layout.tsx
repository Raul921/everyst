import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useSidebarState } from '../../hooks/state/useAppStore';
// Import SVG backgrounds - using require to ensure they're loaded as URLs
import summitBg from '../../assets/backgrounds/summit.svg?raw';
import basecampBg from '../../assets/backgrounds/basecamp.svg?raw';

export const Layout: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebarState();
  const location = useLocation();
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Determine which background to show based on the current route
  const getBackgroundSvg = () => {
    if (location.pathname.includes('/basecamp') || location.pathname.includes('/integrations')) {
      // Add preserveAspectRatio and width/height 100% to ensure SVG fills container
      return basecampBg.replace('<svg', '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"');
    }
    return summitBg.replace('<svg', '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"');
  };
  
  return (
    <div className="flex h-screen bg-[rgb(var(--color-background))] text-gray-900 dark:text-gray-100 relative">
      {/* Dynamic background using SVG from external files with improved sizing */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none z-0" 
        aria-hidden="true"
      >
        <div 
          className="w-full h-full text-gray-600 dark:text-gray-300 opacity-[0.04] dark:opacity-[0.07]"
          dangerouslySetInnerHTML={{ __html: getBackgroundSvg() }}
        />
      </div>

      {/* Sidebar */}
      <Sidebar isCollapsed={sidebarCollapsed} onCollapse={toggleSidebar} />
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header onMenuToggle={toggleSidebar} />
        
        {/* Main content with accessibility skip link */}
        <main id="main-content" className="flex-1 overflow-y-auto p-6 relative z-10">
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <Outlet />
        </main>
      </div>
    </div>
  );
};