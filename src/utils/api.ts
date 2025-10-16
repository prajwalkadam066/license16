// API URL utilities for development and testing

/**
 * Get the current API base URL based on environment and deployment context
 */
export const getApiBaseUrl = (): string => {
  // For Replit development, always use /api (goes through Vite proxy to Express on port 8000)
  // For production deployment on cPanel
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    
    // If deployed on cybaemtech.net
    if (hostname.includes('cybaemtech.net')) {
      return 'https://cybaemtech.net/License/api';
    }
  }
  
  // Default - use /api which will be proxied to the Express backend
  return '/api';
};

/**
 * Check if we're using a local API server
 */
export const isLocalApi = (): boolean => {
  const apiUrl = getApiBaseUrl();
  return apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
};

/**
 * Check if we're using the production API
 */
export const isProductionApi = (): boolean => {
  const apiUrl = getApiBaseUrl();
  return apiUrl.includes('cybaemtech.net');
};

/**
 * Get API health check URL
 */
export const getHealthCheckUrl = (): string => {
  return `${getApiBaseUrl()}/health`;
};

/**
 * Log current API configuration (development only)
 */
export const logApiConfig = (): void => {
  const isDev = import.meta.env.DEV;
  if (isDev) {
    console.log('🌐 API Configuration:', {
      baseUrl: getApiBaseUrl(),
      isLocal: isLocalApi(),
      isProduction: isProductionApi(),
      environment: isDev ? 'Development' : 'Production'
    });
  }
};

// Log API config on module load in development
if (import.meta.env.DEV) {
  logApiConfig();
}