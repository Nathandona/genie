"use client"

import { AuthProvider } from "@/lib/auth"

function ApiClientInitializer({ children }: { children: React.ReactNode }) {
  // API client now reads token directly from cookies, no initialization needed
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ApiClientInitializer>{children}</ApiClientInitializer>
    </AuthProvider>
  )
}
