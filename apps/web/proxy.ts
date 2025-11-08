import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getApiUrl } from '@/lib/api-url'

// Paths that require authentication
const protectedPaths = ['/dashboard', '/create', '/progress', '/results']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth API routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  if (isProtectedPath) {
    // Check for auth token in cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    // If no token, verify session with backend
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verify token is still valid
    try {
      const url = getApiUrl('/auth/session')
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        // Token invalid, redirect to login
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      // Error verifying token, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // If on login page and already authenticated, redirect to dashboard
  if (pathname === '/login') {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (token) {
      try {
        const url = getApiUrl('/auth/session')
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })

        if (response.ok) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch (error) {
        // Error verifying token, allow login page
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icon.svg).*)',
  ],
}
