import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for Content Density options
export type ContentDensity = 'compact' | 'comfortable';

// Interface for the entire app store
interface AppState {
  // UI Preferences
  contentDensity: ContentDensity;
  setContentDensity: (density: ContentDensity) => void;
  
  // Sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Card visibility preferences (for dashboard customization)
  hiddenCards: string[];
  hideCard: (cardId: string) => void;
  showCard: (cardId: string) => void;
  resetCardVisibility: () => void;
  
  // Last viewed route (for navigation history)
  lastViewedRoute: string;
  setLastViewedRoute: (route: string) => void;
}

// Create the store with persistence
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Default UI Preferences
      contentDensity: 'comfortable',
      setContentDensity: (density) => set({ contentDensity: density }),
      
      // Default sidebar state
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      // Card visibility
      hiddenCards: [],
      hideCard: (cardId) => 
        set((state) => ({ 
          hiddenCards: [...state.hiddenCards, cardId] 
        })),
      showCard: (cardId) => 
        set((state) => ({ 
          hiddenCards: state.hiddenCards.filter(id => id !== cardId) 
        })),
      resetCardVisibility: () => set({ hiddenCards: [] }),
      
      // Navigation
      lastViewedRoute: '/',
      setLastViewedRoute: (route) => set({ lastViewedRoute: route }),
    }),
    {
      name: 'everyst-app-storage',
      // Only persist specific parts of the state
      partialize: (state) => ({
        contentDensity: state.contentDensity,
        sidebarCollapsed: state.sidebarCollapsed,
        hiddenCards: state.hiddenCards,
      }),
    }
  )
);

// Custom hooks for specific parts of the store
export const useContentDensity = () => {
  const { contentDensity, setContentDensity } = useAppStore();
  return { contentDensity, setContentDensity };
};

export const useSidebarState = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  return { sidebarCollapsed, setSidebarCollapsed };
};

export const useCardVisibility = () => {
  const { hiddenCards, hideCard, showCard, resetCardVisibility } = useAppStore();
  
  const isCardVisible = (cardId: string) => !hiddenCards.includes(cardId);
  
  return { 
    hiddenCards, 
    hideCard, 
    showCard, 
    resetCardVisibility,
    isCardVisible
  };
};