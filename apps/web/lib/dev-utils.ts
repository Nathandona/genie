/**
 * Development utilities
 * 
 * Helpful functions for testing and development
 */

export const DEV_UTILS = {
  // Check if we're in development mode
  isDev: process.env.NODE_ENV === 'development',
  
  // Get API URL
  getApiUrl: () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  
  // Log API calls in development
  logApiCall: (method: string, endpoint: string, data?: any) => {
    if (DEV_UTILS.isDev) {
      console.log(`[API ${method}]`, endpoint, data);
    }
  },
  
  // Mock auth token for testing
  setTestAuthToken: (token: string = 'test-token-123') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('genie_auth_token', token);
      console.log('✅ Test auth token set:', token);
    }
  },
  
  // Clear all local storage
  clearAllData: () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      console.log('🧹 All local storage cleared');
    }
  },
  
  // Check current auth status
  checkAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('genie_auth_token');
      console.log('🔐 Auth token:', token ? '✅ Present' : '❌ Missing');
      return !!token;
    }
    return false;
  }
};

// Make available globally in development
if (typeof window !== 'undefined' && DEV_UTILS.isDev) {
  (window as any).devUtils = DEV_UTILS;
  console.log('💡 Dev utils available: window.devUtils');
}
