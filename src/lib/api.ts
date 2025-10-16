// API client for PHP backend
import { saveSession } from '../utils/session';
import config from '../config';

// Get API base URL from configuration
const API_BASE_URL = config.API_BASE_URL;

// Check if we're on production (cPanel)
const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('cybaemtech.net');

// Helper function to format endpoint for production
function formatEndpoint(endpoint: string): string {
  // On production (cPanel), add .php extension to endpoints
  // because PHP files are accessed directly (e.g., licenses.php, clients.php)
  if (isProduction) {
    // Don't add .php if it's already there
    if (endpoint.endsWith('.php')) {
      return endpoint;
    }
    
    // Handle query parameters: insert .php before the ?
    if (endpoint.includes('?')) {
      const [path, query] = endpoint.split('?');
      return `${path}.php?${query}`;
    }
    
    // Add .php to the endpoint
    return `${endpoint}.php`;
  }
  
  // Development uses proxy, no .php needed
  return endpoint;
}

// Helper function for making API requests
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const formattedEndpoint = formatEndpoint(endpoint);
  const url = `${API_BASE_URL}${formattedEndpoint}`;
  
  console.log('🌐 API Configuration:', {
    baseUrl: API_BASE_URL,
    isLocal: !isProduction,
    isProduction: isProduction,
    originalEndpoint: endpoint,
    formattedEndpoint: formattedEndpoint,
    fullUrl: url,
    environment: isProduction ? 'Production (cPanel)' : 'Development'
  });
  
  // Get user session from localStorage for authenticated requests
  const session = localStorage.getItem('auth_session');
  let authHeaders: Record<string, string> = {};
  if (session) {
    try {
      const userData = JSON.parse(session);
      if (userData.token) {
        authHeaders['Authorization'] = `Bearer ${userData.token}`;
      }
    } catch (e) {
      // Invalid session, ignore
    }
  }
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  // Check if response is actually JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Expected JSON response but got ${contentType}. Response: ${await response.text()}`);
  }
  
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

// Authentication API
export class Auth {
  async signInWithEmail(email: string, password: string) {
    try {
      // Demo credentials for testing
      const validCredentials = {
        'rohan.bhosale@cybaemtech.com': 'password',
        'accounts@cybaemtech.com': 'password',
        'admin@example.com': 'password'
      };

      // Check demo credentials first for testing
      if (validCredentials[email as keyof typeof validCredentials] === password) {
        const userData = {
          id: 'user_' + Math.random().toString(36).substr(2, 9),
          email: email,
          full_name: email === 'rohan.bhosale@cybaemtech.com' ? 'Rohan Bhosale' : 
                    email === 'accounts@cybaemtech.com' ? 'Accounts User' : 'Admin User',
          role: email === 'rohan.bhosale@cybaemtech.com' ? 'admin' : 'user'
        };
        
        const token = 'demo_token_' + Math.random().toString(36).substr(2, 9);
        
        // Save session using helper function
        saveSession(userData, token);
        
        return { data: { user: userData, session: { access_token: token } }, error: null };
      }

      // If not demo credentials, try actual API
      const loginEndpoint = formatEndpoint('/login');
      const response = await fetch(`${API_BASE_URL}${loginEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store the session with token
        const userData = data.user || data.data;
        const token = data.token || 'session_token';
        
        // Save session using helper function
        saveSession(userData, token);
        
        return { data: { user: userData, session: { access_token: token } }, error: null };
      } else {
        return { data: null, error: new Error(data.message || 'Login failed') };
      }
    } catch (error) {
      // If API fails, still allow demo login
      console.warn('API login failed, using demo mode:', error);
      return { data: null, error: new Error('Login failed. Please try with demo credentials.') };
    }
  }

  async getUser() {
    try {
      // In production (cPanel), get user from localStorage since we don't have /auth/user endpoint
      if (isProduction) {
        const session = localStorage.getItem('auth_session');
        if (session) {
          const userData = JSON.parse(session);
          return { data: { user: userData }, error: null };
        }
        return { data: { user: null }, error: 'No session found' };
      }
      
      const response = await apiRequest('/auth/user');
      return { data: { user: response.data || response }, error: null };
    } catch (error) {
      return { data: { user: null }, error };
    }
  }

  async getSession() {
    try {
      // In production (cPanel), get session from localStorage
      if (isProduction) {
        const session = localStorage.getItem('auth_session');
        if (session) {
          const userData = JSON.parse(session);
          if (userData && userData.email) {
            return { 
              data: { 
                session: { 
                  user: userData,
                  access_token: 'session_token'
                } 
              }, 
              error: null 
            };
          }
        }
        return { data: { session: null }, error: null };
      }
      
      const response = await apiRequest('/auth/user');
      const userData = response.data || response;
      if (userData && userData.email) {
        return { 
          data: { 
            session: { 
              user: userData,
              access_token: 'session_token'
            } 
          }, 
          error: null 
        };
      } else {
        return { data: { session: null }, error: null };
      }
    } catch (error) {
      return { data: { session: null }, error };
    }
  }

  async signOut() {
    try {
      // Just clear localStorage since we don't have a logout endpoint yet
      localStorage.removeItem('auth_session');
      return { error: null };
    } catch (error) {
      localStorage.removeItem('auth_session');
      return { error };
    }
  }

  // Mock function for compatibility (not used with PHP backend)
  onAuthStateChange(_callback: (event: string, session: any) => void) {
    return { 
      data: { 
        subscription: { 
          unsubscribe: () => {} 
        } 
      } 
    };
  }
}

// Table query builder for API calls
class TableQuery {
  private tableName: string;
  private filters: Record<string, any> = {};

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async select(_columns = '*') {
    try {
      let endpoint = '';
      
      switch (this.tableName) {
        case 'clients':
          endpoint = '/clients';
          break;
        case 'license_purchases':
          endpoint = '/licenses';
          break;
        default:
          throw new Error(`Table ${this.tableName} not supported`);
      }

      // Use apiRequest which handles endpoint formatting for production
      const result = await apiRequest(endpoint, {
        method: 'GET',
      });
      
      if (result.success) {
        return { data: result.data || [], error: null };
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      return { data: null, error };
    }
  }

  async insert(values: any) {
    try {
      let endpoint = '';
      
      switch (this.tableName) {
        case 'clients':
          endpoint = '/clients';
          break;
        case 'license_purchases':
          endpoint = '/licenses';
          break;
        default:
          throw new Error(`Table ${this.tableName} not supported`);
      }

      // Use apiRequest which handles endpoint formatting for production
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      
      if (result.success) {
        return { data: result.data, error: null };
      } else {
        throw new Error(result.error || 'Failed to insert data');
      }
    } catch (error) {
      return { data: null, error };
    }
  }

  async update(_values: any) {
    try {
      // Update functionality not implemented for current tables
      throw new Error(`Update for table ${this.tableName} not supported`);
    } catch (error) {
      return { data: null, error };
    }
  }

  async upsert(_values: any, _options?: any) {
    try {
      // Upsert functionality not implemented for current tables
      throw new Error(`Upsert for table ${this.tableName} not supported`);
    } catch (error) {
      return { data: null, error };
    }
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  order(_column: string, _options?: { ascending?: boolean }) {
    // Order functionality could be implemented for API requests if needed
    return this;
  }

  limit(_count: number) {
    // Limit functionality could be implemented for API requests if needed
    return this;
  }

  single() {
    // Single functionality could be implemented for API requests if needed
    return this;
  }
}

// Main API client
class ApiClient {
  public auth: Auth;

  constructor() {
    this.auth = new Auth();
  }

  from(tableName: string) {
    return new TableQuery(tableName);
  }
}

// Dashboard API functions
export async function getDashboardStats() {
  try {
    // In production, calculate stats from licenses data since we don't have /dashboard/stats endpoint
    if (isProduction) {
      const licensesData = await apiRequest('/licenses');
      // Return the licenses data - dashboard will calculate stats from it
      return { data: licensesData, error: null };
    }
    
    const data = await apiRequest('/dashboard/stats');
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Create and export the API client
export const api = new ApiClient();

// API health check
export const checkApiConnection = async () => {
  try {
    // In production, check with licenses endpoint since /auth/user doesn't exist
    if (isProduction) {
      await apiRequest('/licenses');
      return true;
    }
    
    await apiRequest('/auth/user');
    return true;
  } catch (error) {
    return false;
  }
};

export const checkAuth = async () => {
  const { data } = await api.auth.getSession();
  return data.session !== null;
};

export const refreshSession = async () => {
  const { data } = await api.auth.getSession();
  return data.session !== null;
};