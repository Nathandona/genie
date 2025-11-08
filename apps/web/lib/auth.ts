/**
 * NextAuth session helper for client components
 * Use getServerSession in server components instead
 */

import { useSession as useNextAuthSession, signIn, signOut } from "next-auth/react"

export function useSession() {
  return useNextAuthSession()
}

export { signIn, signOut }
