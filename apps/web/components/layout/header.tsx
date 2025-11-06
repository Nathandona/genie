"use client"

import { Button } from "@/components/ui/button"
import { Menu, X, LogOut } from "lucide-react"
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
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">Genie</span>
          </Link>

          {/* Desktop Navigation */}
          {/* Hydration-safe: hide nav/CTA until mounted to avoid UI flash */}
          {mounted && (
            <>
              <nav className="hidden items-center gap-6 md:flex">
                {isLoggedIn && (
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/pricing"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pricing
                </Link>
                <Link
                  href="/docs"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Docs
                </Link>
              </nav>

              {/* Desktop CTA */}
              <div className="hidden items-center gap-4 md:flex">
                {isLoggedIn ? (
                  <>
                    <Link href="/create">
                      <Button>New Project</Button>
                    </Link>
                    <Button variant="ghost" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost">Sign In</Button>
                    </Link>
                    <Link href="/create">
                      <Button>Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
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
          <div className="border-t py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              {isLoggedIn && (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/pricing"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t">
                {isLoggedIn ? (
                  <>
                    <Link href="/create" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full">New Project</Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleLogout()
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full">Sign In</Button>
                    </Link>
                    <Link href="/create" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full">Get Started</Button>
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
