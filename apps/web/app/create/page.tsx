"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Globe, Sparkles, Clock, Zap, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

export default function CreateProject() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [maxPages, setMaxPages] = useState("10")
  const [includePatterns, setIncludePatterns] = useState("")
  const [excludePatterns, setExcludePatterns] = useState("")
  const [isValidUrl, setIsValidUrl] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateUrl = (value: string) => {
    if (!value) {
      setIsValidUrl(true)
      return
    }
    try {
      new URL(value)
      setIsValidUrl(true)
    } catch {
      setIsValidUrl(false)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUrl(value)
    validateUrl(value)
    setError(null)
  }

  const estimatedTime = Math.ceil(parseInt(maxPages || "10") * 0.5)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !isValidUrl) return

    try {
      setIsSubmitting(true)
      setError(null)

      // Parse patterns
      const includePatternsArray = includePatterns
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
      
      const excludePatternsArray = excludePatterns
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)

      // Create project via API
      const project = await apiClient.createProject({
        sourceUrl: url,
        settings: {
          maxPages: parseInt(maxPages),
          ...(includePatternsArray.length > 0 && { includePatterns: includePatternsArray }),
          ...(excludePatternsArray.length > 0 && { excludePatterns: excludePatternsArray }),
        },
      })

      // Navigate to progress page with project ID
      router.push(`/progress?id=${project.id}&url=${encodeURIComponent(url)}&maxPages=${maxPages}`)
    } catch (err) {
      console.error('Failed to create project:', err)
      setError(err instanceof Error ? err.message : 'Failed to create project. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/dashboard" className="inline-block mb-6">
            <Badge variant="outline" className="text-sm transition-all hover:bg-muted/50">
              ← Back to Dashboard
            </Badge>
          </Link>
          <h1 className="mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Create New Project
          </h1>
          <p className="text-lg text-muted-foreground">
            Enter a website URL to start the transformation process
          </p>
        </div>

        {/* Main Form */}
        <div className="mx-auto max-w-3xl">
          <Card className="border-muted/50 shadow-xl transition-shadow hover:shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Globe className="h-5 w-5 text-primary" />
                Website URL
              </CardTitle>
              <CardDescription>
                Enter the URL of the website you want to convert to Next.js
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* URL Input */}
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="https://example.com"
                    value={url}
                    onChange={handleUrlChange}
                    disabled={isSubmitting}
                    className={`h-14 text-lg transition-all ${
                      !isValidUrl ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"
                    }`}
                  />
                  {!isValidUrl && (
                    <p className="text-sm text-destructive animate-in slide-in-from-top-1">
                      Please enter a valid URL (including https://)
                    </p>
                  )}
                  {error && (
                    <p className="text-sm text-destructive animate-in slide-in-from-top-1">
                      {error}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Make sure the website is publicly accessible
                  </p>
                </div>

                {/* Advanced Options Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-4 text-left transition-all hover:bg-muted/50 hover:border-primary/20"
                >
                  <span className="font-medium">Advanced Options</span>
                  {showAdvanced ? (
                    <ChevronUp className="h-5 w-5 transition-transform" />
                  ) : (
                    <ChevronDown className="h-5 w-5 transition-transform" />
                  )}
                </button>

                {/* Advanced Options */}
                {showAdvanced && (
                  <div className="space-y-4 rounded-lg border border-border/50 bg-muted/20 p-6 animate-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Maximum Pages to Crawl
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={maxPages}
                        onChange={(e) => setMaxPages(e.target.value)}
                        className="h-12"
                      />
                      <p className="text-sm text-muted-foreground">
                        Free tier: up to 10 pages. Pro tier: up to 100 pages.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Include Patterns (optional)
                      </label>
                      <Input
                        type="text"
                        placeholder="/blog/*, /products/*"
                        value={includePatterns}
                        onChange={(e) => setIncludePatterns(e.target.value)}
                        className="h-12"
                      />
                      <p className="text-sm text-muted-foreground">
                        Comma-separated patterns to include
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Exclude Patterns (optional)
                      </label>
                      <Input
                        type="text"
                        placeholder="/admin/*, /api/*"
                        value={excludePatterns}
                        onChange={(e) => setExcludePatterns(e.target.value)}
                        className="h-12"
                      />
                      <p className="text-sm text-muted-foreground">
                        Comma-separated patterns to exclude
                      </p>
                    </div>
                  </div>
                )}

                {/* Estimated Time */}
                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Estimated Time</div>
                      <div className="text-sm text-muted-foreground">
                        Based on {maxPages} pages
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    ~{estimatedTime} min
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 gap-2 text-lg shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
                  disabled={!url || !isValidUrl || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Project...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Start Generation
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card className="group border-muted/50 transition-all hover:border-primary/30 hover:shadow-md">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div className="font-semibold">Fast Processing</div>
                <div className="text-sm text-muted-foreground">
                  Average 5-10 minutes
                </div>
              </CardContent>
            </Card>
            <Card className="group border-muted/50 transition-all hover:border-primary/30 hover:shadow-md">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="font-semibold">AI-Powered</div>
                <div className="text-sm text-muted-foreground">
                  Smart code generation
                </div>
              </CardContent>
            </Card>
            <Card className="group border-muted/50 transition-all hover:border-primary/30 hover:shadow-md">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div className="font-semibold">Production Ready</div>
                <div className="text-sm text-muted-foreground">
                  Deploy immediately
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
