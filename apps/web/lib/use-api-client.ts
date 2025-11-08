/**
 * Hook to get API client with NextAuth session token
 */

import { useSession } from "@/lib/auth"
import { apiClient } from "@/lib/api-client"
import { useEffect } from "react"

export function useApiClient() {
  const { data: session } = useSession()

  useEffect(() => {
    // Set token getter for API client
    apiClient.setTokenGetter(async () => {
      return (session?.user as any)?.accessToken || null
    })
  }, [session])

  return apiClient
}

