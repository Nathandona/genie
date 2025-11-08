/**
 * NextAuth server session helper
 * Use this in Server Components and API routes
 */

import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth-config"

export async function getSession() {
  return getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}

