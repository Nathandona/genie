"use client"

import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, Sparkles } from "lucide-react"
import Link from "next/link"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated, clearAuthToken } from "@/lib/auth"

export function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Hydration-safe: only show auth-based nav after mount
  const [mounted, setMounted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(isAuthenticated())
    setMounted(true)
  }, [])

  const handleLogout = () => {
    clearAuthToken()
    setIsLoggedIn(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 blur-sm opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              Genie
            </span>
          </Link>

          {/* Desktop Navigation */}
          {/* Hydration-safe: hide nav/CTA until mounted to avoid UI flash */}
          {mounted && (
            <>
              <nav className="hidden items-center gap-1 md:flex">
                {isLoggedIn && (
                  <Link
                    href="/dashboard"
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/pricing"
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  Pricing
                </Link>
                <Link
                  href="/docs"
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  Docs
                </Link>
              </nav>

              {/* Desktop CTA */}
              <div className="hidden items-center gap-3 md:flex">
                {isLoggedIn ? (
                  <>
                    <Link href="/create">
                      <Button className="shadow-sm transition-all hover:shadow-md">
                        New Project
                      </Button>
                    </Link>
                    <Button variant="ghost" onClick={handleLogout} className="gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost">Sign In</Button>
                    </Link>
                    <Link href="/create">
                      <Button className="shadow-sm transition-all hover:shadow-md">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-md p-2 transition-colors hover:bg-muted/50"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && mounted && (
          <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl py-4 md:hidden animate-in slide-in-from-top-2">
            <nav className="flex flex-col gap-1">
              {isLoggedIn && (
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/pricing"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <div className="flex flex-col gap-2 border-t border-border/40 pt-4 mt-2">
                {isLoggedIn ? (
                  <>
                    <Link href="/create" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full shadow-sm">New Project</Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full gap-2" 
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleLogout()
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full">Sign In</Button>
                    </Link>
                    <Link href="/create" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full shadow-sm">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
