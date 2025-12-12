// API Configuration for external backend connection
// Replace BASE_URL with your deployed backend URL

export const API_CONFIG = {
  // TODO: Replace with your actual backend URL
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  
  // API endpoints
  ENDPOINTS: {
    // KYC endpoints
    KYC_UPLOAD: '/api/kyc/upload',
    KYC_REVOKE: '/api/kyc/revoke',
    KYC_GET: '/api/kyc', // append /:userAddress
    KYC_UNPIN: '/api/kyc/unpin',
    
    // Admin endpoints
    ADMIN_VERIFIERS: '/api/admin/verifier',
    ADMIN_GRANT_VERIFIER: '/api/admin/grant-verifier',
    ADMIN_REVOKE_VERIFIER: '/api/admin/revoke-verifier',
    
    // Health & ZK
    HEALTH: '/api/health',
    ZK_VERIFY: '/api/zk/verify',
  },
  
  // Request timeout in ms
  TIMEOUT: 30000,
};

// Helper to get full URL
export const getApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }
  return url;
};
