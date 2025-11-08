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

    const url = getApiUrl('/auth/session');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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

