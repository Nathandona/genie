import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api-url';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // In production, call the backend API directly through the serverless wrapper
    // We need to use an absolute URL and a special header to bypass Next.js routing
    let url: string;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (process.env.NODE_ENV === 'production') {
      // Use the serverless function endpoint which routes to Fastify
      const host = process.env.NEXT_PUBLIC_APP_URL 
        ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
        : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'https://genie-teal.vercel.app';
      // Call the backend API through the serverless wrapper
      // Use /api/v1 to ensure it goes to the serverless function, not Next.js route
      url = `${host}/api/v1/auth/signup`;
      headers['x-internal-request'] = 'true';
    } else {
      // In development, call backend directly
      url = getApiUrl('/auth/signup');
    }

    console.log('[Signup API Route] Calling backend at:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password, name }),
    });

    // Check if response is HTML (error page) instead of JSON
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[Signup API Route] Non-JSON response:', {
        status: response.status,
        contentType,
        bodyPreview: text.substring(0, 200)
      });
      return NextResponse.json(
        { message: 'Backend API returned an error. Please try again.' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Signup failed' },
        { status: response.status }
      );
    }

    // Set HTTP-only cookie with JWT token
    const token = data.token;
    const responseWithCookie = NextResponse.json(
      { user: data.user },
      { status: 201 }
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
