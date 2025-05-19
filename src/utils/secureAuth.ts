/**
 * Secure authentication utility functions for Everyst
 */
import { getApiUrl } from './apiUrl';

/**
 * Performs a secure logout that:
 * 1. Blacklists the refresh token on the server
 * 2. Removes tokens from local storage
 * 3. Redirects to login page
 * 
 * @param refreshToken - The refresh token to blacklist
 * @returns Promise that resolves when logout is complete
 */
export const secureLogout = async (refreshToken: string): Promise<void> => {
  try {
    // Get the access token for the API request
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken && refreshToken) {
      // Attempt to blacklist the token on the server
      const response = await fetch(`${getApiUrl()}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      });
      
      if (!response.ok) {
        console.warn('Failed to blacklist token on server:', await response.json());
      }
    }
  } catch (error) {
    console.error('Error during secure logout:', error);
  } finally {
    // Always clear tokens from local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = '/login';
  }
};

/**
 * Logs out from all devices by blacklisting all refresh tokens
 * 
 * @returns Promise that resolves when logout is complete
 */
export const logoutAllDevices = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Get the access token for the API request
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    
    // Attempt to blacklist all tokens on the server
    const response = await fetch(`${getApiUrl()}/auth/logout-all/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to logout from all devices');
    }
    
    const result = await response.json();
    
    // Clear tokens from current device
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = '/login';
    
    return { success: true, message: result.detail || 'Successfully logged out from all devices' };
  } catch (error) {
    console.error('Error during logout from all devices:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
