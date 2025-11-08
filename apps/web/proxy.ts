import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Paths that require authentication
const protectedPaths = ['/dashboard', '/create', '/progress', '/results']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip NextAuth API routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  if (isProtectedPath) {
    // Check for NextAuth session token
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET 
    })

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // If on login page and already authenticated, redirect to dashboard
  if (pathname === '/login') {
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET 
    })
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - including NextAuth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icon.svg).*)',
  ],
}

