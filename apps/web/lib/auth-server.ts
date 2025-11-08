/**
 * Server-side auth helper
 * Gets the current user from the JWT token in cookies
 */

import { cookies } from 'next/headers';
import { getApiUrl } from './api-url';

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

    const url = getApiUrl('/auth/session');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get server session:', error);
    return null;
  }
}
