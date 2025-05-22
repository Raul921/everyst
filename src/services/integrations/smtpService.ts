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
    const response = await fetch(`${getApiUrl()}/integrations/smtp/active/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No active configuration found
        return undefined;
      }
      throw new Error(`Failed to fetch SMTP configuration: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching SMTP configuration:', error);
    throw error;
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
    const isUpdate = !!config.id;
    const url = isUpdate 
      ? `${getApiUrl()}/integrations/smtp/${config.id}/`
      : `${getApiUrl()}/integrations/smtp/`;
    
    const response = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`Failed to save SMTP configuration: ${response.statusText}`);
    }

    return await response.json();
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
    const response = await fetch(`${getApiUrl()}/integrations/smtp/${configId}/test_connection/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ test_email: testEmail })
    });

    const result = await response.json();
    
    if (response.ok) {
      return { 
        success: true, 
        message: result.message || 'Email test was successful'
      };
    } else {
      return { 
        success: false, 
        message: result.error || 'Failed to send test email'
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
