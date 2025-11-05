"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Globe, Sparkles, Clock, Zap } from "lucide-react"
import Link from "next/link"

export default function CreateProject() {
  const [url, setUrl] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [maxPages, setMaxPages] = useState("10")
  const [includePatterns, setIncludePatterns] = useState("")
  const [excludePatterns, setExcludePatterns] = useState("")
  const [isValidUrl, setIsValidUrl] = useState(true)

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
  }

  const estimatedTime = Math.ceil(parseInt(maxPages || "10") * 0.5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url && isValidUrl) {
      // Navigate to progress page with URL params
      window.location.href = `/progress?url=${encodeURIComponent(url)}&maxPages=${maxPages}`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <Badge variant="outline" className="text-sm">
              ← Back to Home
            </Badge>
          </Link>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Create New Project
          </h1>
          <p className="text-lg text-muted-foreground">
            Enter a website URL to start the transformation process
          </p>
        </div>

        {/* Main Form */}
        <div className="mx-auto max-w-3xl">
          <Card className="border-muted/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
                    className={`h-14 text-lg ${
                      !isValidUrl ? "border-destructive" : ""
                    }`}
                  />
                  {!isValidUrl && (
                    <p className="text-sm text-destructive">
                      Please enter a valid URL (including https://)
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
                  className="flex w-full items-center justify-between rounded-lg border bg-muted/30 p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium">Advanced Options</span>
                  {showAdvanced ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                {/* Advanced Options */}
                {showAdvanced && (
                  <div className="space-y-4 rounded-lg border bg-muted/20 p-6">
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
                <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
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
                  className="w-full h-14 text-lg"
                  disabled={!url || !isValidUrl}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Generation
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card className="border-muted/50">
              <CardContent className="p-6 text-center">
                <Zap className="mx-auto mb-2 h-8 w-8 text-primary" />
                <div className="font-semibold">Fast Processing</div>
                <div className="text-sm text-muted-foreground">
                  Average 5-10 minutes
                </div>
              </CardContent>
            </Card>
            <Card className="border-muted/50">
              <CardContent className="p-6 text-center">
                <Sparkles className="mx-auto mb-2 h-8 w-8 text-primary" />
                <div className="font-semibold">AI-Powered</div>
                <div className="text-sm text-muted-foreground">
                  Smart code generation
                </div>
              </CardContent>
            </Card>
            <Card className="border-muted/50">
              <CardContent className="p-6 text-center">
                <Globe className="mx-auto mb-2 h-8 w-8 text-primary" />
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
