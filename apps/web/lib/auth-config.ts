import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// Get API base URL
// This runs server-side in NextAuth authorize function
// Note: Backend routes are directly at /auth/*, not /api/auth/*
const getApiBaseUrl = () => {
  // In production, use relative path to go through Vercel serverless function wrapper
  // The wrapper at apps/web/api/index.ts proxies to the backend
  if (process.env.NODE_ENV === 'production') {
    return '/api'
  }
  
  // In development, call backend directly (no /api prefix needed)
  // Backend routes are at http://localhost:4000/auth/* directly
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL
    // Remove /api suffix if present, backend doesn't use it
    if (url.endsWith('/api')) {
      return url.slice(0, -4) // Remove '/api'
    }
    return url
  }
  
  // Default to localhost:4000 in development (backend runs on port 4000)
  return 'http://localhost:4000'
}

const API_BASE_URL = getApiBaseUrl()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        mode: { label: "Mode", type: "text" }, // "login" or "signup"
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const normalizedEmail = credentials.email.toLowerCase().trim()
        const isSignup = credentials.mode === "signup"

        try {
          const endpoint = isSignup ? "/auth/signup" : "/auth/login"
          const url = `${API_BASE_URL}${endpoint}`
          const body: any = {
            email: normalizedEmail,
            password: credentials.password,
          }

          if (isSignup && credentials.name) {
            body.name = credentials.name.trim()
          }

          // Log in development for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log(`[NextAuth] Calling ${isSignup ? 'signup' : 'login'} at:`, url)
          }

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Authentication failed" }))
            const errorMessage = errorData.message || "Authentication failed"
            
            // Throw error with message so NextAuth can pass it to the client
            throw new Error(errorMessage)
          }

          const data = await response.json()

          // Validate response structure
          if (!data.user || !data.token) {
            throw new Error("Invalid response from authentication server")
          }

          // Return user object that will be stored in the JWT
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name || null,
            accessToken: data.token, // Store the API token
          }
        } catch (error) {
          // Re-throw error so NextAuth can handle it properly
          if (error instanceof Error) {
            throw error
          }
          throw new Error("Authentication failed")
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.accessToken = (user as any).accessToken
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user && token) {
        (session.user as any).id = token.id as string
        ;(session.user as any).accessToken = token.accessToken as string
        ;(session.user as any).name = token.name as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors to login page
  },
  events: {
    async signIn({ user, account, profile }) {
      // Log successful sign in
      return true
    },
    async signOut() {
      // Handle sign out
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
}

export default NextAuth(authOptions)

