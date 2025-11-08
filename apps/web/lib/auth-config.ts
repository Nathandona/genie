import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// Import Fastify server to call directly (both are server-side)
// This avoids the /api/auth/* conflict with NextAuth routes
let fastifyApp: Awaited<ReturnType<typeof import('../../api/dist/server.js').createServer>> | null = null

async function getFastifyApp() {
  if (!fastifyApp) {
    const { createServer } = await import('../../api/dist/server.js')
    fastifyApp = await createServer()
  }
  return fastifyApp
}

// Get API base URL for HTTP calls (fallback)
const getApiBaseUrl = () => {
  // In development, call backend directly
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL
    if (url.endsWith('/api')) {
      return url.slice(0, -4)
    }
    return url
  }
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
          const body: any = {
            email: normalizedEmail,
            password: credentials.password,
          }

          if (isSignup && credentials.name) {
            body.name = credentials.name.trim()
          }

          // Try to call Fastify server directly (server-side)
          // This avoids HTTP overhead and /api/auth/* routing conflicts
          let data: any
          try {
            const app = await getFastifyApp()
            const response = await app.inject({
              method: 'POST',
              url: endpoint,
              payload: body,
              headers: {
                'content-type': 'application/json',
              },
            })

            if (response.statusCode >= 400) {
              const errorData = JSON.parse(response.payload || '{}')
              throw new Error(errorData.message || "Authentication failed")
            }

            data = JSON.parse(response.payload)
          } catch (directError) {
            // Fallback to HTTP call if direct call fails
            if (directError instanceof Error && directError.message.includes("Cannot find module")) {
              // Fastify server not available, use HTTP fallback
              const url = `${API_BASE_URL}${endpoint}`
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`[NextAuth] Using HTTP fallback for ${isSignup ? 'signup' : 'login'} at:`, url)
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
                throw new Error(errorData.message || "Authentication failed")
              }

              data = await response.json()
            } else {
              throw directError
            }
          }

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
      // No return value needed
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

