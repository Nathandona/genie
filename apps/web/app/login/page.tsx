'use client'

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api-client"

type AuthMode = "login" | "signup"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()
    const trimmedName = name.trim()

    if (!normalizedEmail || !trimmedPassword) {
      setError("Email and password are required")
      return
    }

    if (mode === "signup" && trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (mode === "login") {
        await apiClient.login(normalizedEmail, trimmedPassword)
      } else {
        await apiClient.register(normalizedEmail, trimmedPassword, trimmedName || undefined)
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = (nextMode: AuthMode) => {
    if (nextMode === mode) return
    setMode(nextMode)
    setError(null)
  }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-muted/20 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background/80 p-8 shadow-lg backdrop-blur">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to manage your generated projects"
              : "Start transforming websites into Next.js apps"}
          </p>
        </div>

        <div className="mb-8 flex items-center justify-center gap-2">
          <Button
            type="button"
            variant={mode === "login" ? "default" : "ghost"}
            onClick={() => switchMode("login")}
            disabled={isLoading}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={mode === "signup" ? "default" : "ghost"}
            onClick={() => switchMode("signup")}
            disabled={isLoading}
          >
            Sign Up
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "New to Genie?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            disabled={isLoading}
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  )
}
