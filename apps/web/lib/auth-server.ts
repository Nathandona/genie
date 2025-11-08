/**
 * Server-side auth helper
 * Gets the current user from the JWT token in cookies
 */

import { cookies } from 'next/headers';
import { authSession } from './server-api-client';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  role: string;
  subscription: string;
  stripeCustomerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getServerSession(): Promise<{ user: User } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    // Use server API client for consistent error handling
    const result = await authSession(token);
    return result;
  } catch (error) {
    console.error('Failed to get server session:', error);
    return null;
  }
}
