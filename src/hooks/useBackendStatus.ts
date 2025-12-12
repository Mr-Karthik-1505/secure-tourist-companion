// Hook to check backend connection status

import { useState, useEffect, useCallback } from 'react';
import { checkHealth, API_CONFIG } from '@/services/api';

interface BackendStatus {
  connected: boolean;
  ipfs: 'ok' | 'error' | 'unknown';
  blockchain: 'ok' | 'error' | 'unknown';
  lastChecked: Date | null;
  loading: boolean;
  error: string | null;
}

export function useBackendStatus(autoCheck = true, interval = 30000) {
  const [status, setStatus] = useState<BackendStatus>({
    connected: false,
    ipfs: 'unknown',
    blockchain: 'unknown',
    lastChecked: null,
    loading: false,
    error: null,
  });

  const checkStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await checkHealth();
      
      if (response.success && response.data) {
        setStatus({
          connected: true,
          ipfs: response.data.services.ipfs,
          blockchain: response.data.services.blockchain,
          lastChecked: new Date(),
          loading: false,
          error: null,
        });
      } else {
        setStatus({
          connected: false,
          ipfs: 'unknown',
          blockchain: 'unknown',
          lastChecked: new Date(),
          loading: false,
          error: response.error?.message || 'Backend unavailable',
        });
      }
    } catch (err) {
      setStatus({
        connected: false,
        ipfs: 'unknown',
        blockchain: 'unknown',
        lastChecked: new Date(),
        loading: false,
        error: 'Failed to connect to backend',
      });
    }
  }, []);

  useEffect(() => {
    if (autoCheck) {
      checkStatus();
      const id = setInterval(checkStatus, interval);
      return () => clearInterval(id);
    }
  }, [autoCheck, interval, checkStatus]);

  return { ...status, checkStatus, baseUrl: API_CONFIG.BASE_URL };
}
