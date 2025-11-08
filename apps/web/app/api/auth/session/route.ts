import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api-url';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // In production, call the backend API directly through the serverless wrapper
    // Use /api/v1 to ensure it goes to the serverless function, not Next.js route
    let url: string;
    let headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    if (process.env.NODE_ENV === 'production') {
      const host = process.env.NEXT_PUBLIC_APP_URL 
        ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
        : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'https://genie-teal.vercel.app';
      url = `${host}/api/v1/auth/session`;
      headers['x-internal-request'] = 'true';
    } else {
      url = getApiUrl('/auth/session');
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      // If session is invalid, clear the cookie
      const responseWithClearedCookie = NextResponse.json(
        { message: 'Session expired' },
        { status: 401 }
      );
      responseWithClearedCookie.cookies.delete('auth-token');
      return responseWithClearedCookie;
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

