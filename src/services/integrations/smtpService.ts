/**
 * SMTP Configuration API Service
 * 
 * This service provides functions for managing SMTP configuration through the API
 */

import { getApiUrl } from '../../utils/apiUrl';

/**
 * Interface representing an SMTP configuration
 */
export interface SMTPConfig {
  id?: string;
  host: string;
  port: number;
  username: string;
  password: string;
  use_tls: boolean;
  from_email: string;
  from_name: string;
  is_active: boolean;
  last_tested?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface for the test connection request
 */
export interface TestSMTPRequest {
  test_email: string;
}

/**
 * Interface for the test connection response
 */
export interface TestSMTPResponse {
  success: boolean;
  message: string;
}

/**
 * Get the current auth token from localStorage
 */
const getAuthToken = (): string => {
  return localStorage.getItem('accessToken') || '';
};

/**
 * Fetch the active SMTP configuration
 * @returns Promise resolving to the active SMTP configuration or undefined if none exists
 */
export const fetchActiveSMTPConfig = async (): Promise<SMTPConfig | undefined> => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      console.warn('No auth token found when fetching SMTP config');
      return undefined;
    }
    
    console.log('Fetching active SMTP config with token');
    
    const response = await fetch(`${getApiUrl()}/integrations/smtp/active/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('SMTP active endpoint response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        // No active configuration found
        console.log('No active SMTP config found');
        return undefined;
      }
      
      // Try to get more error details
      const errorText = await response.text().catch(() => response.statusText);
      console.error('SMTP config fetch error:', errorText);
      throw new Error(`Failed to fetch SMTP configuration: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully fetched SMTP config:', data.id);
    return data;
  } catch (error) {
    console.error('Error fetching SMTP configuration:', error);
    return undefined; // Return undefined instead of throwing to avoid crashing the UI
  }
};

/**
 * Fetch all SMTP configurations
 * @returns Promise resolving to an array of SMTP configurations
 */
export const fetchAllSMTPConfigs = async (): Promise<SMTPConfig[]> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${getApiUrl()}/integrations/smtp/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch SMTP configurations: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching SMTP configurations:', error);
    throw error;
  }
};

/**
 * Save a new or update an existing SMTP configuration
 * @param config The SMTP configuration to save
 * @returns Promise resolving to the saved SMTP configuration
 */
export const saveSMTPConfig = async (config: SMTPConfig): Promise<SMTPConfig> => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    const isUpdate = !!config.id;
    const url = isUpdate 
      ? `${getApiUrl()}/integrations/smtp/${config.id}/`
      : `${getApiUrl()}/integrations/smtp/`;
    
    console.log(`${isUpdate ? 'Updating' : 'Creating'} SMTP config at ${url}`);
    
    const response = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(config)
    });

    console.log('SMTP save response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error('Error saving SMTP config:', errorText);
      
      try {
        // Try to parse as JSON if possible
        const errorData = JSON.parse(errorText);
        console.error('Parsed error data:', errorData);
        throw new Error(`Failed to save SMTP configuration: ${JSON.stringify(errorData)}`);
      } catch {
        throw new Error(`Failed to save SMTP configuration: ${response.statusText || errorText}`);
      }
    }

    const savedConfig = await response.json();
    console.log('Successfully saved SMTP config with ID:', savedConfig.id);
    return savedConfig;
  } catch (error) {
    console.error('Error saving SMTP configuration:', error);
    throw error;
  }
};

/**
 * Test the SMTP connection using the provided configuration
 * @param configId The ID of the configuration to test
 * @param testEmail The email address to send the test email to
 * @returns Promise resolving to the test result
 */
export const testSMTPConnection = async (configId: string, testEmail: string): Promise<TestSMTPResponse> => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      return {
        success: false,
        message: 'No authentication token available'
      };
    }
    
    console.log(`Testing SMTP connection with ID ${configId}, sending to ${testEmail}`);
    
    const response = await fetch(`${getApiUrl()}/integrations/smtp/${configId}/test_connection/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ test_email: testEmail })
    });

    console.log('SMTP test response status:', response.status);
    const result = await response.text();
    
    try {
      const parsedResult = JSON.parse(result);
      
      if (response.ok) {
        return { 
          success: true, 
          message: parsedResult.message || 'Email test was successful'
        };
      } else {
        return { 
          success: false, 
          message: parsedResult.error || 'Failed to send test email'
        };
      }
    } catch {
      console.error('Error parsing SMTP test response:', result);
      return {
        success: false,
        message: `Invalid response from server: ${response.statusText}`
      };
    }
  } catch (error) {
    console.error('Error testing SMTP connection:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Delete an SMTP configuration
 * @param id The ID of the configuration to delete
 * @returns Promise resolving when the configuration is deleted
 */
export const deleteSMTPConfig = async (id: string): Promise<void> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${getApiUrl()}/integrations/smtp/${id}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete SMTP configuration: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting SMTP configuration:', error);
    throw error;
  }
};
