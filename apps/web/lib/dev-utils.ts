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
  
  // Clear all local storage
  clearAllData: () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      console.log('🧹 All local storage cleared');
    }
  },
  
  // Check NextAuth session (for development debugging)
  checkAuth: () => {
    if (typeof window !== 'undefined') {
      console.log('💡 Use NextAuth session - check window.sessionStorage or cookies');
      console.log('💡 NextAuth session is managed automatically');
      return true;
    }
    return false;
  }
};

// Make available globally in development
if (typeof window !== 'undefined' && DEV_UTILS.isDev) {
  (window as any).devUtils = DEV_UTILS;
  console.log('💡 Dev utils available: window.devUtils');
}
