/**
 * API URL utilities for consistent handling of API endpoints
 * 
 * This helps avoid CORS issues by enforcing the use of relative URLs in development,
 * which allows the Vite proxy to handle requests properly.
 */

/**
 * Get the base API URL, always using a relative path to leverage the proxy
 * @returns The API base URL (always '/api')
 */
export const getApiUrl = (): string => {
  // Always use relative path to leverage Vite's proxy
  return '/api';
};

/**
 * Get the socket URL, always using a relative path to leverage the proxy
 * @returns The socket URL (always empty string)
 */
export const getSocketUrl = (): string => {
  // Always use a relative path to leverage Vite's proxy
  // Empty string makes Socket.IO use the current page's origin
  return '';
};

/**
 * Create a full API URL by combining the base API URL with an endpoint path
 * @param endpoint The API endpoint path (e.g., '/users/me/')
 * @returns The complete API URL
 */
export const createApiUrl = (endpoint: string): string => {
  const baseUrl = getApiUrl();
  // Ensure we don't have double slashes between base URL and endpoint
  if (baseUrl.endsWith('/') && endpoint.startsWith('/')) {
    return `${baseUrl}${endpoint.substring(1)}`;
  }
  if (!baseUrl.endsWith('/') && !endpoint.startsWith('/')) {
    return `${baseUrl}/${endpoint}`;
  }
  return `${baseUrl}${endpoint}`;
};
