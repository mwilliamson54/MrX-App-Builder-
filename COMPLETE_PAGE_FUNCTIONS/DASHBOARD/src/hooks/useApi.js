import { useCallback } from 'react';
import { API_BASE_URL } from '../utils/constants';

// ============================================================================
// API HOOK
// ============================================================================

export const useApi = (token) => {
  const request = useCallback(async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    console.log('API Request:', { 
      endpoint, 
      method: options.method || 'GET',
      hasToken: !!token 
    });

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      console.log('API Response:', { 
        endpoint, 
        status: response.status,
        ok: response.ok 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Details:', errorData);
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Success:', { endpoint, data });
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }, [token]);

  return { request };
};
