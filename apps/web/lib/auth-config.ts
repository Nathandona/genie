import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getApiUrl } from "./api-url"

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

          // Use HTTP call to backend API via unified URL utility
          // In production, this uses /api which goes through Vercel serverless wrapper
          // In development, this calls backend directly at localhost:4000
          const url = getApiUrl(endpoint)
          
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
            throw new Error(errorData.message || "Authentication failed")
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

