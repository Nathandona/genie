import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api-url';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const url = getApiUrl('/auth/login');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Login failed' },
        { status: response.status }
      );
    }

    // Set HTTP-only cookie with JWT token
    const token = data.token;
    const responseWithCookie = NextResponse.json(
      { user: data.user },
      { status: 200 }
    );

    responseWithCookie.cookies.set('auth-token', token, {
      httpOnly: false, // Allow client-side access for Authorization header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return responseWithCookie;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

