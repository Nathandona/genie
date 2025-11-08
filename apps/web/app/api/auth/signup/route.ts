import { NextRequest, NextResponse } from 'next/server';
import { authSignup, type ApiError } from '@/lib/server-api-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
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

    // Call backend via HTTP (works in both dev and production)
    const result = await authSignup({ email, password, name });
    const { token, user } = result;

    // Create response with cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json(
      { user },
      { status: 201 }
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
    console.error('[Signup API Route] Error:', error);
    
    // Handle API errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const apiError = error as ApiError;
      return NextResponse.json(
        { message: apiError.message || 'Signup failed' },
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
