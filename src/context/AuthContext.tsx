import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './WebSocketContext';
import type { User } from '../types/users';

// API URL helper
const getApiUrl = () => {
  // Use proxied API path for development
  // This ensures CORS works properly with HTTPS and self-signed certs
  return `/api`;
};

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  usersExist: boolean | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string, firstName?: string, lastName?: string) => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  getAccessToken: () => string | null;
  checkUsersExist: () => Promise<boolean>;
  isOwner: boolean;
  isAdmin: boolean;
  isManager: boolean;
  canManageUsers: boolean;
  canManageSystem: boolean;
  canManageNetwork: boolean;
  canViewAllData: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  usersExist: null,
  login: async () => false,
  logout: () => {},
  register: async () => false,
  refreshToken: async () => false,
  getAccessToken: () => null,
  checkUsersExist: async () => false,
  isOwner: false,
  isAdmin: false,
  isManager: false,
  canManageUsers: false,
  canManageSystem: false,
  canManageNetwork: false,
  canViewAllData: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usersExist, setUsersExist] = useState<boolean | null>(null);
  
  // Role-based permissions
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isManager, setIsManager] = useState<boolean>(false);
  const [canManageUsers, setCanManageUsers] = useState<boolean>(false);
  const [canManageSystem, setCanManageSystem] = useState<boolean>(false);
  const [canManageNetwork, setCanManageNetwork] = useState<boolean>(false);
  const [canViewAllData, setCanViewAllData] = useState<boolean>(false);
  
  const { connect, disconnect } = useWebSocket();

  // Update permissions based on user role
  const updatePermissions = useCallback((userData: User | null) => {
    if (!userData) {
      // Reset permissions if no user
      setIsOwner(false);
      setIsAdmin(false);
      setIsManager(false);
      setCanManageUsers(false);
      setCanManageSystem(false);
      setCanManageNetwork(false);
      setCanViewAllData(false);
      return;
    }

    // Check role based permissions
    const role = userData.role || '';
    const roleDetails = userData.role_details;

    // Set role-based status
    setIsOwner(role === 'owner' || userData.is_superuser === true);
    setIsAdmin(role === 'admin' || role === 'owner' || userData.is_staff === true);
    setIsManager(role === 'manager' || role === 'admin' || role === 'owner');

    // Set capability permissions from role details if available
    if (roleDetails) {
      setCanManageUsers(roleDetails.can_manage_users);
      setCanManageSystem(roleDetails.can_manage_system);
      setCanManageNetwork(roleDetails.can_manage_network);
      setCanViewAllData(roleDetails.can_view_all_data);
    } else {
      // Fallback to role-based permissions if details not available
      setCanManageUsers(role === 'owner' || role === 'admin');
      setCanManageSystem(role === 'owner' || role === 'admin' || role === 'manager');
      setCanManageNetwork(role === 'owner' || role === 'admin' || role === 'manager');
      setCanViewAllData(role === 'owner' || role === 'admin' || role === 'manager');
    }
  }, []);

  // Check if users exist in the system
    // Securely check if users exist in the system (first run check)
  const checkUsersExist = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${getApiUrl()}/auth/first-run/`);
      
      // Status 200 means users exist (OK)
      // Status 204 means no users (No Content)
      const usersExist = response.status === 200;
      
      setUsersExist(usersExist);
      return usersExist;
    } catch (err) {
      console.error('Ошибка при выполнении проверки первого запуска:', err);
      return false;
    }
  };

  // Check if the user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        // Check if users exist in the system
        const usersExist = await checkUsersExist();
        
        const accessToken = localStorage.getItem('accessToken');
        
        if (!accessToken) {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Before making any API calls with the token, verify it's a valid JWT format
        try {
          // Simple check to see if token has valid JWT format (header.payload.signature)
          const tokenParts = accessToken.split('.');
          if (tokenParts.length !== 3) {
            console.warn('Неверный формат токена JWT, аутентификация отменена');
            clearAuthState();
            setLoading(false);
            return;
          }
        } catch (tokenFormatErr) {
          console.warn('Ошибка анализа сохраненного токена:', tokenFormatErr);
          clearAuthState();
          setLoading(false);
          return;
        }

        // If there are no users in the system but we have a token, it must be from a previous environment
        if (!usersExist && accessToken) {
          console.warn('Токен найден, но в базе данных нет пользователей — очистка сохраненных учетных данных');
          clearAuthState();
          setLoading(false);
          return;
        }
        
        // Validate the token by fetching the current user
        const userResponse = await fetchCurrentUser(accessToken);
        
        if (userResponse) {
          setIsAuthenticated(true);
          setUser(userResponse);
          
          // Update role-based permissions
          updatePermissions(userResponse);
          
          // Connect to WebSocket with token (combined connection+authentication)
          const connected = await connect(accessToken);
          if (!connected) {
            console.debug('Не удалось установить соединение WebSocket во время проверки подлинности.');
            // Continue with app functionality even if WebSocket fails
          }
        } else {
          // Token is invalid, try refreshing
          const refreshed = await refreshToken();
          if (!refreshed) {
            // If refresh fails, clear auth state
            clearAuthState();
          }
        }
      } catch (err) {
        console.error('Ошибка проверки авторизации:', err);
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch current user data
  const fetchCurrentUser = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${getApiUrl()}/users/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Log specific error information for debugging
        if (response.status === 401) {
          console.warn('Ошибка аутентификации токена: не авторизован');
        } else if (response.status === 404) {
          console.warn('Пользователь не найден — возможно, используется токен из предыдущей среды');
        } else {
          try {
            const errorData = await response.json();
            console.warn('Ошибка аутентификации:', errorData);
          } catch (e) {
            console.warn(`Аутентификация не удалась со статусом ${response.status}`);
          }
        }
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
      return null;
    }
  };

  // Clear authentication state
  const clearAuthState = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authToken'); // For backward compatibility
    setIsAuthenticated(false);
    setUser(null);
    
    // Clear role permissions
    updatePermissions(null);
    
    // Disconnect websocket
    disconnect();
  }, [disconnect, updatePermissions]);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${getApiUrl()}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.detail || 'Не удалось войти. Проверьте свои учётные данные.');
        setLoading(false);
        return false;
      }
      
      // Store tokens
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('authToken', data.access); // For backward compatibility
      
      // Fetch user data
      const userData = await fetchCurrentUser(data.access);        if (userData) {
          setIsAuthenticated(true);
          setUser(userData);
          
          // Update role-based permissions
          updatePermissions(userData);
          
          // Connect to WebSocket with token (combined connection+authentication)
          console.log('Вход успешен, установлено безопасное соединение WebSocket.');
          const connected = await connect(data.access);
          if (!connected) {
            console.warn('Не удалось установить соединение WebSocket после входа в систему.');
            // Continue with app functionality even if WebSocket fails
          }
          
          setLoading(false);
          return true;
      } else {
        clearAuthState();
        setError('Не удалось получить данные пользователя.');
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Произошла ошибка при входе. Попробуйте ещё раз.');
      clearAuthState();
      setLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = useCallback(() => {
    clearAuthState();
  }, [clearAuthState]);

  // Register function
  const register = async (
    username: string,
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${getApiUrl()}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username,
          email, 
          password,
          first_name: firstName || '',
          last_name: lastName || ''
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle validation errors
        if (data.email) {
          setError(`Email: ${data.email.join(', ')}`);
        } else if (data.password) {
          setError(`Password: ${data.password.join(', ')}`);
        } else {
          setError(data.detail || 'Регистрация не удалась.');
        }
        setLoading(false);
        return false;
      }
      
      // Store tokens
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('authToken', data.access); // For backward compatibility
      
      // Set user data from response
      const userData = data.user || await fetchCurrentUser(data.access);
      
      if (userData) {
        setIsAuthenticated(true);
        setUser(userData);
        
        // Update role-based permissions
        updatePermissions(userData);
        
        // Update users exist state after successful registration
        setUsersExist(true);
        
        // Connect to WebSocket with token (combined connection+authentication)
        console.log('Регистрация прошла успешно, установлено безопасное соединение WebSocket');
        const connected = await connect(data.access);
        if (!connected) {
          console.warn('Не удалось установить соединение WebSocket после регистрации');
          // Continue with app functionality even if WebSocket fails
        }
        
        setLoading(false);
        return true;
      } else {
        clearAuthState();
        setError('Не удалось получить данные пользователя.');
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      setError('Произошла ошибка при регистрации. Попробуйте ещё раз.');
      clearAuthState();
      setLoading(false);
      return false;
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    const refresh = localStorage.getItem('refreshToken');
    
    if (!refresh) {
      return false;
    }
    
    try {
      const response = await fetch(`${getApiUrl()}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        clearAuthState();
        return false;
      }
      
      // Update access token
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('authToken', data.access); // For backward compatibility
      
      // Fetch user data with new token
      const userData = await fetchCurrentUser(data.access);
      
      if (userData) {
        setIsAuthenticated(true);
        setUser(userData);
        
        // Update role-based permissions
        updatePermissions(userData);
        
        // Update WebSocket connection with new token
        console.log('Токен обновлен, подключение WebSocket обновлено.');
        const connected = await connect(data.access);
        if (!connected) {
          console.warn('Не удалось установить соединение WebSocket после обновления токена.');
          // Continue with app functionality even if WebSocket fails
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Ошибка обновления токена:', err);
      clearAuthState();
      return false;
    }
  };

  // Get current access token
  const getAccessToken = (): string | null => {
    return localStorage.getItem('accessToken');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        usersExist,
        login,
        logout,
        register,
        refreshToken,
        getAccessToken,
        checkUsersExist,
        isOwner,
        isAdmin,
        isManager,
        canManageUsers,
        canManageSystem,
        canManageNetwork,
        canViewAllData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  
  return context;
};
