/**
 * Hook to get API client
 * API client now reads token directly from cookies, so this is just a convenience hook
 */

import { apiClient } from "@/lib/api-client"

export function useApiClient() {
  // API client reads token from cookies automatically
  return apiClient
}

