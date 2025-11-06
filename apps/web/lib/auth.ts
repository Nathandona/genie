/**
 * Authentication utilities for the client
 */

const TOKEN_KEY = 'genie_auth_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try cookies first (for middleware compatibility)
  const cookieToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${TOKEN_KEY}=`))
    ?.split('=')[1];
  
  if (cookieToken) return cookieToken;
  
  // Fallback to localStorage
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  // Set in both cookie and localStorage
  // Cookie for middleware, localStorage for backward compatibility
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  
  // Clear both cookie and localStorage
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}
