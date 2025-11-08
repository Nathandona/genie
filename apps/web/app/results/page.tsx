"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  Layout,
  Loader2,
  Share2,
  Zap,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { apiClient, type DownloadInfo, type Page as ApiPage, type Project as ApiProject } from "@/lib/api-client"

interface PagePreview {
  id: string
  name: string
  path: string
  previewIcon: string
  title: string | null
  url: string
  metaDescription: string | null
  htmlSnapshot: string | null
}

function safeParseUrl(rawUrl: string | null | undefined): URL | null {
  if (!rawUrl) return null
  try {
    return new URL(rawUrl)
  } catch {
    try {
      return new URL(`https://${rawUrl}`)
    } catch {
      return null
    }
  }
}

function getPageEmoji(path: string): string {
  const value = path.toLowerCase()
  if (value === "/" || value === "") return "🏠"
  if (value.includes("about")) return "ℹ️"
  if (value.includes("service")) return "🛠️"
  if (value.includes("product")) return "🛍️"
  if (value.includes("contact")) return "📧"
  if (value.includes("blog")) return "📝"
  if (value.includes("portfolio")) return "🎨"
  if (value.includes("team")) return "👥"
  if (value.includes("pricing")) return "💲"
  return "📄"
}

function toDisplayName(source: string): string {
  const parts = source
    .split(/[\s/_-]+/)
    .filter(Boolean)
    .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
  return parts.length > 0 ? parts.join(" ") : "Page"
}

function convertPage(apiPage: ApiPage): PagePreview {
  const parsedUrl = safeParseUrl(apiPage.url)
  const path = parsedUrl?.pathname || "/"
  const slug = path.split("/").filter(Boolean).pop() || "home"
  const computedName = apiPage.title?.trim() || toDisplayName(slug)

  return {
    id: apiPage.id,
    name: computedName,
    path,
    previewIcon: getPageEmoji(path),
    title: apiPage.title,
    url: parsedUrl?.href || apiPage.url,
    metaDescription: apiPage.metaDescription,
    htmlSnapshot: apiPage.htmlSnapshot,
  }
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "Pending"
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, index)
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds && seconds !== 0) return "—"
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Loading project results...</h3>
              <p className="text-muted-foreground">Please wait while we fetch your data</p>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <ResultsPageContent />
    </Suspense>
  )
}

function ResultsPageContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get("id")

  const [project, setProject] = useState<ApiProject | null>(null)
  const [pages, setPages] = useState<PagePreview[]>([])
  const [downloadInfo, setDownloadInfo] = useState<DownloadInfo | null>(null)
  const [currentComparison, setCurrentComparison] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isStartingPreview, setIsStartingPreview] = useState(false)
  const [isStoppingPreview, setIsStoppingPreview] = useState(false)

  useEffect(() => {
    setCurrentComparison(0)
  }, [projectId])

  useEffect(() => {
    if (!projectId) {
      setError("No project ID provided")
      setIsLoading(false)
      return
    }

    let isMounted = true

  const id = projectId as string

    async function hydrate() {
      try {
        setIsLoading(true)
        setError(null)

        const [projectData, apiPages, downloadData, previewStatus] = await Promise.all([
          apiClient.getProject(id),
          apiClient.getProjectPages(id),
          apiClient.getDownloadInfo(id).catch(() => null),
          apiClient.getPreviewStatus(id).catch(() => null),
        ])

        if (!isMounted) return

        setProject(projectData)
        setPages(apiPages.map(convertPage))
        setDownloadInfo(downloadData)
        if (previewStatus) {
          setPreviewUrl(previewStatus.url)
        }
      } catch (err) {
        console.error("Failed to fetch project data:", err)
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Failed to load project data")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    hydrate()

    return () => {
      isMounted = false
    }
  }, [projectId])

  useEffect(() => {
    setCurrentComparison((prev) => {
      if (pages.length === 0) return 0
      return prev >= pages.length ? 0 : prev
    })
  }, [pages])

  const stats = useMemo(() => {
    const pageTotal = project?.pageCount ?? pages.length
    const fileCount = downloadInfo?.fileCount
    const bundleSize = downloadInfo?.totalSize
    const generationTime = project?.generationTime

    return [
      {
        label: "Pages Generated",
        icon: Layout,
        gradient: "from-blue-500/10 to-blue-500/5",
        tone: "text-blue-600 dark:text-blue-400",
        value: pageTotal,
      },
      {
        label: "Files in Bundle",
        icon: FileCode,
        gradient: "from-purple-500/10 to-purple-500/5",
        tone: "text-purple-600 dark:text-purple-400",
        value: fileCount ?? "Pending",
      },
      {
        label: "Bundle Size",
        icon: Download,
        gradient: "from-green-500/10 to-green-500/5",
        tone: "text-green-600 dark:text-green-400",
        value: formatBytes(bundleSize),
      },
      {
        label: "Generation Time",
        icon: Clock,
        gradient: "from-orange-500/10 to-orange-500/5",
        tone: "text-orange-600 dark:text-orange-400",
        value: formatDuration(generationTime),
      },
    ]
  }, [downloadInfo, pages.length, project])

  const handleDownload = async () => {
    if (!projectId) {
      alert("Project ID missing")
      return
    }

    try {
      setIsDownloading(true)
      
      // Try to get download info (may not be available yet)
      let info: DownloadInfo | null = null
      try {
        info = await apiClient.getDownloadInfo(projectId)
      } catch (err) {
        // If download info is not available, still try to download
        console.warn("Download info not available, attempting download anyway:", err)
      }
      
      // Download the actual ZIP file using the blob endpoint
      const blob = await apiClient.downloadProject(projectId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      const projectName = project?.sourceUrl 
        ? new URL(project.sourceUrl).hostname.replace('www.', '')
        : 'project'
      a.href = url
      a.download = `${projectName}-${projectId.slice(0, 8)}.zip`
      a.rel = "noopener noreferrer"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Update downloadInfo if we got it
      if (info) {
        setDownloadInfo(info)
      }
    } catch (err) {
      console.error("Failed to download project:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to download project"
      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        alert("Download is not ready yet. Please wait for the project generation to complete.")
      } else {
        alert(errorMessage)
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDeploy = () => {
    window.open("https://vercel.com/new", "_blank")
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard")
    } catch (err) {
      console.error("Failed to copy link:", err)
      alert("Copy to clipboard failed")
    }
  }

  const handleStartPreview = async () => {
    if (!projectId) return
    
    try {
      setIsStartingPreview(true)
      const result = await apiClient.startPreview(projectId)
      setPreviewUrl(result.url)
    } catch (err) {
      console.error("Failed to start preview:", err)
      alert(err instanceof Error ? err.message : "Failed to start preview")
    } finally {
      setIsStartingPreview(false)
    }
  }

  const handleStopPreview = async () => {
    if (!projectId) return
    
    try {
      setIsStoppingPreview(true)
      await apiClient.stopPreview(projectId)
      setPreviewUrl(null)
    } catch (err) {
      console.error("Failed to stop preview:", err)
      alert(err instanceof Error ? err.message : "Failed to stop preview")
    } finally {
      setIsStoppingPreview(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Loading project results...</h3>
              <p className="text-muted-foreground">Please wait while we fetch your data</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !projectId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 rounded-full bg-destructive/10 p-4">
                <FileCode className="h-12 w-12 text-destructive" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Failed to load project</h3>
              <p className="mb-6 text-muted-foreground">{error || "Project ID is required"}</p>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-green-500/10 p-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
          </div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">Project Generated Successfully!</h1>
          <p className="text-lg text-muted-foreground">
            {project?.sourceUrl ? `Generated from ${project.sourceUrl}` : "Your Next.js project is ready to download and deploy"}
          </p>
          {project?.status && (
            <div className="mt-3 flex justify-center">
              <Badge variant="outline" className="text-xs uppercase tracking-wide">
                {project.status}
              </Badge>
            </div>
          )}
        </div>

        <div className="mx-auto mb-12 max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className={`border-muted/50 bg-gradient-to-br ${stat.gradient}`}>
                <CardContent className="p-6">
                  <div className={`mb-2 flex items-center gap-2 ${stat.tone}`}>
                    <stat.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{stat.label}</span>
                  </div>
                  <div className="text-4xl font-bold">
                    {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mx-auto mb-12 max-w-5xl">
          <Card className="border-primary/40 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="mb-1 text-lg font-semibold">Ready to use your project?</h3>
                  <p className="text-sm text-muted-foreground">
                    {downloadInfo ? (
                      <>
                        {downloadInfo.fileCount.toLocaleString()} files · {formatBytes(downloadInfo.totalSize)}
                      </>
                    ) : (
                      "We are preparing your download package"
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    onClick={handleDownload}
                    className="w-full sm:w-auto"
                    disabled={isDownloading || project?.status !== 'completed'}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Download ZIP
                      </>
                    )}
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

        <div className="mx-auto mb-12 max-w-7xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Before & After</CardTitle>
                  <CardDescription>Compare original website vs. generated Next.js project</CardDescription>
                </div>
                {pages.length > 1 && (
                  <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (pages.length === 0) return
                        setCurrentComparison((prev) => (prev - 1 + pages.length) % pages.length)
                    }}
                    disabled={pages.length === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                    <Badge variant="outline" className="min-w-[80px] text-center">
                      {pages.length > 0 ? `${currentComparison + 1} / ${pages.length}` : "0 / 0"}
                    </Badge>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (pages.length === 0) return
                        setCurrentComparison((prev) => (prev + 1) % pages.length)
                    }}
                    disabled={pages.length === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pages.length > 0 ? (
                <>
                  <div className="mb-4 flex flex-col gap-3 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <span className="font-medium">{pages[currentComparison].name}</span>
                      <span className="text-sm text-muted-foreground">{pages[currentComparison].path}</span>
                    </div>
                    <div className="flex gap-2">
                      {project?.sourceUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Original
                          </Link>
                        </Button>
                      )}
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={pages[currentComparison].url} target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-2 h-4 w-4" />
                          View Generated
                      </Link>
                    </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">Original Website</div>
                        <Badge variant="outline" className="text-xs">Before</Badge>
                      </div>
                      <div className="relative aspect-video overflow-hidden rounded-lg border bg-background shadow-sm">
                        {pages[currentComparison].url ? (
                      <iframe
                            key={`original-${pages[currentComparison].id}`}
                            title={`Original: ${pages[currentComparison].name}`}
                            src={pages[currentComparison].url}
                        className="h-full w-full border-0"
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                            allow="fullscreen"
                            loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
                            <div className="text-4xl">{pages[currentComparison].previewIcon}</div>
                            <div className="text-lg font-semibold">Original preview not available</div>
                            {pages[currentComparison].metaDescription && (
                              <p className="text-sm max-w-md">{pages[currentComparison].metaDescription}</p>
                            )}
                          </div>
                        )}
                      </div>
                      {pages[currentComparison].title && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Title:</strong> {pages[currentComparison].title}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">Generated Next.js</div>
                          <Badge variant="default" className="text-xs">After</Badge>
                        </div>
                        {previewUrl ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleStopPreview}
                            disabled={isStoppingPreview}
                          >
                            {isStoppingPreview ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Stopping...
                              </>
                            ) : (
                              "Stop Preview"
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleStartPreview}
                            disabled={isStartingPreview || !downloadInfo}
                          >
                            {isStartingPreview ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              <>
                                <Zap className="mr-2 h-3 w-3" />
                                Start Preview
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="relative aspect-video overflow-hidden rounded-lg border border-primary/50 bg-primary/5 shadow-sm">
                        {previewUrl ? (
                          <iframe
                            key={`preview-${previewUrl}`}
                            title={`Generated Preview: ${pages[currentComparison].name}`}
                            src={previewUrl}
                            className="h-full w-full border-0"
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                            allow="fullscreen"
                            loading="lazy"
                          />
                        ) : pages[currentComparison].htmlSnapshot ? (
                          <iframe
                            key={`generated-${pages[currentComparison].id}`}
                            title={`Generated: ${pages[currentComparison].name}`}
                            srcDoc={pages[currentComparison].htmlSnapshot || undefined}
                            sandbox="allow-same-origin allow-scripts"
                            className="h-full w-full border-0"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-primary">
                            <div className="text-4xl">{pages[currentComparison].previewIcon}</div>
                            <div className="text-lg font-semibold">Generated preview</div>
                            <p className="text-sm max-w-md">
                              Click "Start Preview" to run the generated Next.js project with pnpm dev
                            </p>
                            {pages[currentComparison].metaDescription && (
                              <p className="text-xs text-muted-foreground max-w-md">
                                {pages[currentComparison].metaDescription}
                              </p>
                        )}
                      </div>
                    )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong>Status:</strong> {previewUrl ? "Preview running" : "Ready for deployment"}
                      </p>
                    </div>
                  </div>

                  {pages.length > 1 && (
                    <div className="mt-6">
                      <div className="mb-2 text-sm font-medium text-muted-foreground">All Pages</div>
                      <div className="grid gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    {pages.map((page, index) => (
                      <button
                        key={page.id}
                            onClick={() => setCurrentComparison(index)}
                            className={`rounded-lg border p-2 text-left transition-all ${
                              index === currentComparison
                                ? "border-primary bg-primary/10 shadow-sm"
                            : "border-muted/60 hover:border-primary/40"
                        }`}
                      >
                            <div className="mb-1 text-xl">{page.previewIcon}</div>
                        <div className="truncate text-xs font-medium">{page.name}</div>
                            <div className="truncate text-[10px] text-muted-foreground">{page.path}</div>
                      </button>
                    ))}
                  </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  No pages were generated for this project yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto max-w-5xl">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>Get your project up and running</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-lg bg-background/60 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Extract the ZIP file</h4>
                    <p className="text-sm text-muted-foreground">Unzip the downloaded file to your preferred location.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-lg bg-background/60 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Install dependencies</h4>
                    <p className="mb-2 text-sm text-muted-foreground">Run the following command in the project directory:</p>
                    <code className="rounded bg-muted px-2 py-1 text-sm font-mono">pnpm install</code>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-lg bg-background/60 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Start development server</h4>
                    <p className="mb-2 text-sm text-muted-foreground">Launch your project locally:</p>
                    <code className="rounded bg-muted px-2 py-1 text-sm font-mono">pnpm run dev</code>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-lg bg-background/60 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">Open in browser</h4>
                    <p className="text-sm text-muted-foreground">
                      Navigate to <code className="rounded bg-muted px-2 py-1 text-sm font-mono">http://localhost:3000</code>
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

        <div className="mx-auto mt-8 max-w-5xl text-center">
          <Link href="/dashboard">
            <Button variant="ghost">View All Projects</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
