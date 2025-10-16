// Environment configuration for the application
interface Config {
  API_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

// Get API base URL based on environment
const getApiUrl = () => {
  // Check if we're on cybaemtech.net domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    if (hostname.includes('cybaemtech.net')) {
      // Detect if we're in /License subdirectory
      if (pathname.includes('/License')) {
        // API is in /License/api/ folder
        return 'https://cybaemtech.net/License/api';
      }
      // Fallback for root deployment
      return 'https://cybaemtech.net/api';
    }
  }
  // For Replit and local development, use relative /api (proxied to Express)
  return '/api';
};

const config: Config = {
  // API Configuration
  API_BASE_URL: getApiUrl(),
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'License Management System',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Environment flags
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Validate required environment variables
if (!config.API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL environment variable is required');
}

// Log configuration in development mode
if (config.isDevelopment) {
  console.log('🔧 App Configuration:', {
    API_BASE_URL: config.API_BASE_URL,
    APP_NAME: config.APP_NAME,
    APP_VERSION: config.APP_VERSION,
    Environment: config.isDevelopment ? 'Development' : 'Production',
    Hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
  });
}

export default config;