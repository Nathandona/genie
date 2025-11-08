"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { getSession } from "next-auth/react"
import { apiClient } from "@/lib/api-client"
import { useEffect, useRef } from "react"

function ApiClientInitializer({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const sessionRef = useRef(session)

  // Keep session ref updated
  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    // Initialize API client with NextAuth token getter
    // This function will be called each time a request is made
    apiClient.setTokenGetter(async () => {
      // Get fresh session data using getSession() to ensure we have the latest
      const currentSession = await getSession()
      const token = (currentSession?.user as any)?.accessToken || null
      
      // Log in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('[API Client] Token getter called:', {
          hasSession: !!currentSession,
          hasToken: !!token,
          status,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
        })
      }
      
      return token
    })
  }, [status])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApiClientInitializer>{children}</ApiClientInitializer>
    </SessionProvider>
  )
}

