"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  ExternalLink,
  Share2,
  Code,
  CheckCircle2,
  Clock,
  FileCode,
  Image as ImageIcon,
  Layout,
  Zap,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

const mockPages = [
  { name: "Homepage", path: "/", preview: "🏠" },
  { name: "About", path: "/about", preview: "ℹ️" },
  { name: "Services", path: "/services", preview: "🛠️" },
  { name: "Products", path: "/products", preview: "🛍️" },
  { name: "Contact", path: "/contact", preview: "📧" },
]

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const url = searchParams.get("url") || "example.com"
  const [currentPreview, setCurrentPreview] = useState(0)
  const [showComparison, setShowComparison] = useState(false)

  const stats = {
    pagesGenerated: 23,
    componentsCreated: 87,
    assetsOptimized: 145,
    timeSaved: 40,
  }

  const handleDownload = () => {
    // Simulate download
    alert("Downloading your Next.js project...")
  }

  const handleDeploy = () => {
    // Simulate Vercel deploy
    alert("Opening Vercel deployment...")
  }

  const handleShare = () => {
    // Simulate sharing
    navigator.clipboard.writeText(window.location.href)
    alert("Link copied to clipboard!")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-green-500/10 p-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
          </div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Project Generated Successfully!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your Next.js project is ready to download and deploy
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mx-auto mb-12 max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-muted/50 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Layout className="h-5 w-5" />
                  <span className="text-sm font-medium">Pages Generated</span>
                </div>
                <div className="text-4xl font-bold">{stats.pagesGenerated}</div>
              </CardContent>
            </Card>
            <Card className="border-muted/50 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <FileCode className="h-5 w-5" />
                  <span className="text-sm font-medium">Components Created</span>
                </div>
                <div className="text-4xl font-bold">{stats.componentsCreated}</div>
              </CardContent>
            </Card>
            <Card className="border-muted/50 bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Assets Optimized</span>
                </div>
                <div className="text-4xl font-bold">{stats.assetsOptimized}</div>
              </CardContent>
            </Card>
            <Card className="border-muted/50 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm font-medium">Time Saved</span>
                </div>
                <div className="text-4xl font-bold">~{stats.timeSaved}h</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mx-auto mb-12 max-w-5xl">
          <Card className="border-primary/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="mb-1 text-lg font-semibold">Ready to use your project?</h3>
                  <p className="text-sm text-muted-foreground">
                    Download, deploy, or view the generated code
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" onClick={handleDownload} className="w-full sm:w-auto">
                    <Download className="mr-2 h-5 w-5" />
                    Download ZIP
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleDeploy} className="w-full sm:w-auto">
                    <Zap className="mr-2 h-5 w-5" />
                    Deploy to Vercel
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleShare} className="w-full sm:w-auto">
                    <Share2 className="mr-2 h-5 w-5" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Carousel */}
        <div className="mx-auto mb-12 max-w-5xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Page Previews</CardTitle>
                  <CardDescription>Browse through your generated pages</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPreview((prev) => (prev - 1 + mockPages.length) % mockPages.length)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPreview((prev) => (prev + 1) % mockPages.length)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{currentPreview + 1} / {mockPages.length}</Badge>
                  <span className="font-medium">{mockPages[currentPreview].name}</span>
                  <span className="text-sm text-muted-foreground">{mockPages[currentPreview].path}</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View Code
                </Button>
              </div>

              {/* Preview Area */}
              <div className="relative aspect-video overflow-hidden rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 text-6xl">{mockPages[currentPreview].preview}</div>
                    <div className="text-xl font-semibold">{mockPages[currentPreview].name}</div>
                    <div className="text-sm text-muted-foreground">Preview placeholder</div>
                  </div>
                </div>
              </div>

              {/* Page Thumbnails */}
              <div className="mt-4 grid grid-cols-5 gap-2">
                {mockPages.map((page, index) => (
                  <button
                    key={page.path}
                    onClick={() => setCurrentPreview(index)}
                    className={`rounded-lg border p-3 text-center transition-all ${
                      index === currentPreview
                        ? "border-primary bg-primary/10"
                        : "border-muted/50 hover:border-primary/50"
                    }`}
                  >
                    <div className="mb-1 text-2xl">{page.preview}</div>
                    <div className="text-xs font-medium">{page.name}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="mx-auto mb-12 max-w-5xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Before & After</CardTitle>
                  <CardDescription>Compare original vs. generated</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? "Hide" : "Show"} Comparison
                </Button>
              </div>
            </CardHeader>
            {showComparison && (
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-sm font-medium">Original</div>
                    <div className="aspect-video rounded-lg border bg-muted/20 p-4">
                      <div className="text-center text-muted-foreground">Original site preview</div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <span>Generated</span>
                      <Badge variant="default" className="text-xs">New</Badge>
                    </div>
                    <div className="aspect-video rounded-lg border border-primary/50 bg-primary/5 p-4">
                      <div className="text-center text-primary">Generated Next.js version</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Next Steps */}
        <div className="mx-auto max-w-5xl">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>Get your project up and running</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-lg bg-background/50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Extract the ZIP file</h4>
                    <p className="text-sm text-muted-foreground">
                      Unzip the downloaded file to your preferred location
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-lg bg-background/50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Install dependencies</h4>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Run the following command in the project directory:
                    </p>
                    <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                      pnpm install
                    </code>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-lg bg-background/50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Start development server</h4>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Launch your project locally:
                    </p>
                    <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                      pnpm run dev
                    </code>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-lg bg-background/50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Open in browser</h4>
                    <p className="text-sm text-muted-foreground">
                      Navigate to{" "}
                      <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                        http://localhost:3000
                      </code>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Link href="/docs" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Code className="mr-2 h-4 w-4" />
                    View Documentation
                  </Button>
                </Link>
                <Link href="/support" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Get Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Return to Dashboard */}
        <div className="mx-auto mt-8 max-w-5xl text-center">
          <Link href="/dashboard">
            <Button variant="ghost">
              View All Projects
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
