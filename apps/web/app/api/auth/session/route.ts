import { NextRequest, NextResponse } from 'next/server';
import { authSession, type ApiError } from '@/lib/server-api-client';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Call backend via HTTP (works in both dev and production)
    const result = await authSession(token);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Session API Route] Error:', error);
    
    // Handle API errors (401 = unauthorized, clear cookie)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const apiError = error as ApiError;
      
      if (apiError.statusCode === 401) {
        const response = NextResponse.json(
          { message: 'Session expired' },
          { status: 401 }
        );
        response.cookies.delete('auth-token');
        return response;
      }
      
      return NextResponse.json(
        { message: apiError.message || 'Session check failed' },
        { status: apiError.statusCode || 500 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
