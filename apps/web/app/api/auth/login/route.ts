import { NextRequest, NextResponse } from 'next/server';
import { authLogin, type ApiError } from '@/lib/server-api-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Call backend via HTTP (works in both dev and production)
    const result = await authLogin({ email, password });
    const { token, user } = result;

    // Create response with cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json(
      { user },
      { status: 200 }
    );

    // Set auth cookie with appropriate security settings
    // Note: httpOnly is false to allow client-side JavaScript to read the token
    // This is needed for the current client-side API client implementation
    response.cookies.set('auth-token', token, {
      httpOnly: false, // Client-side code reads this cookie
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Login API Route] Error:', error);
    
    // Handle API errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const apiError = error as ApiError;
      return NextResponse.json(
        { message: apiError.message || 'Login failed' },
        { status: apiError.statusCode || 500 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
