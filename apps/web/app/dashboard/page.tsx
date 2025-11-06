"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Plus,
  Search,
  Grid3x3,
  List,
  Download,
  Trash2,
  Eye,
  Calendar,
  Globe,
  MoreVertical,
  Loader2,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react"
import Link from "next/link"
import { apiClient, type Project as ApiProject } from "@/lib/api-client"

interface Project {
  id: string
  name: string
  url: string
  status: "completed" | "processing" | "failed"
  createdAt: Date
  pagesCount: number
  thumbnail: string
}

// Helper to extract domain name for display
function getDomainName(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    return domain.split('.')[0] || domain
  } catch {
    return url
  }
}

// Helper to get emoji based on URL
function getUrlEmoji(url: string): string {
  const urlLower = url.toLowerCase()
  if (urlLower.includes('shop') || urlLower.includes('store') || urlLower.includes('commerce')) return '🛍️'
  if (urlLower.includes('blog')) return '📝'
  if (urlLower.includes('portfolio')) return '🎨'
  if (urlLower.includes('corporate') || urlLower.includes('company')) return '🏢'
  if (urlLower.includes('food') || urlLower.includes('restaurant')) return '🍽️'
  if (urlLower.includes('tech')) return '💻'
  return '�'
}

// Helper to get favicon URL
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).origin
    return `${domain}/favicon.ico`
  } catch {
    return ''
  }
}

// Convert API project to UI project
function convertProject(apiProject: ApiProject): Project {
  const status = apiProject.status === 'completed' ? 'completed' :
    apiProject.status === 'failed' ? 'failed' : 'processing'

  return {
    id: apiProject.id,
    name: getDomainName(apiProject.sourceUrl).charAt(0).toUpperCase() +
      getDomainName(apiProject.sourceUrl).slice(1).replace(/[-_]/g, ' '),
    url: apiProject.sourceUrl,
    status,
    createdAt: new Date(apiProject.createdAt),
    pagesCount: apiProject.pageCount,
    thumbnail: getUrlEmoji(apiProject.sourceUrl),
  }
}

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "completed" | "processing">("all")
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Use ref to track if we're currently fetching to prevent multiple simultaneous calls
  const isFetchingRef = useRef(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      const apiProjects = await apiClient.getProjects()
      setProjects(apiProjects.map(convertProject))
      setError(null)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      isFetchingRef.current = false
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Set up smart polling - only poll when there are processing projects
  useEffect(() => {
    const hasProcessing = projects.some(p => p.status === 'processing')

    if (hasProcessing && !pollIntervalRef.current) {
      // Start polling if we have processing projects and not already polling
      pollIntervalRef.current = setInterval(() => {
        fetchProjects()
      }, 5000)
    } else if (!hasProcessing && pollIntervalRef.current) {
      // Stop polling if no processing projects
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [projects, fetchProjects])

  const handleDelete = async (projectId: string) => {
    try {
      setDeletingId(projectId)
      await apiClient.deleteProject(projectId)
      setProjects(projects.filter(p => p.id !== projectId))
      setProjectToDelete(null)
      setNotification({ type: 'success', message: 'Project deleted successfully' })
      setTimeout(() => setNotification(null), 5000)
    } catch (err) {
      console.error('Failed to delete project:', err)
      setNotification({ type: 'error', message: 'Failed to delete project. Please try again.' })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (projectId: string, projectName: string) => {
    try {
      setDownloadingId(projectId)
      const info = await apiClient.getDownloadInfo(projectId)

      setNotification({ 
        type: 'success', 
        message: `Download ready! ${info.fileCount} files (${(info.totalSize / 1024 / 1024).toFixed(2)} MB)` 
      })
      setTimeout(() => setNotification(null), 5000)

      // TODO: Implement actual download from S3
      // const blob = await apiClient.downloadProject(projectId)
      // const url = window.URL.createObjectURL(blob)
      // const a = document.createElement('a')
      // a.href = url
      // a.download = `${projectName}.zip`
      // document.body.appendChild(a)
      // a.click()
      // window.URL.revokeObjectURL(url)
      // document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to download project:', err)
      setNotification({ type: 'error', message: 'Failed to download project. Please try again.' })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setDownloadingId(null)
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setNotification({ type: 'success', message: 'URL copied to clipboard' })
    setTimeout(() => setNotification(null), 3000)
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.url.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === "all" || project.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 w-full max-w-md animate-in slide-in-from-top-2">
            <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
              {notification.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{notification.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                {notification.message}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-2"
                  onClick={() => setNotification(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the project "{projectToDelete?.name}" and all of its data. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => projectToDelete && handleDelete(projectToDelete.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={!!deletingId}
              >
                {deletingId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
                My Projects
              </h1>
              <p className="text-muted-foreground">
                Manage and track all your generated projects
              </p>
            </div>
            <Link href="/create">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-muted/50">
            <CardContent className="p-6">
              <div className="mb-2 text-sm text-muted-foreground">Total Projects</div>
              <div className="text-3xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>
          <Card className="border-muted/50">
            <CardContent className="p-6">
              <div className="mb-2 text-sm text-muted-foreground">Completed</div>
              <div className="text-3xl font-bold text-green-500">
                {projects.filter((p: Project) => p.status === "completed").length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-muted/50">
            <CardContent className="p-6">
              <div className="mb-2 text-sm text-muted-foreground">Processing</div>
              <div className="text-3xl font-bold text-blue-500">
                {projects.filter((p: Project) => p.status === "processing").length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-muted/50">
            <CardContent className="p-6">
              <div className="mb-2 text-sm text-muted-foreground">Total Pages</div>
              <div className="text-3xl font-bold">
                {projects.reduce((acc: number, p: Project) => acc + p.pagesCount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === "completed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("completed")}
                  >
                    Completed
                  </Button>
                  <Button
                    variant={filter === "processing" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("processing")}
                  >
                    Processing
                  </Button>
                </div>
                <div className="flex gap-2 border-l pl-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid/List */}
        {isLoading ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Loading projects...</h3>
              <p className="text-muted-foreground">Please wait while we fetch your data</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 rounded-full bg-destructive/10 p-4">
                <Globe className="h-12 w-12 text-destructive" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Failed to load projects</h3>
              <p className="mb-6 text-muted-foreground">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Globe className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No projects found</h3>
              <p className="mb-6 text-muted-foreground">
                {searchQuery ? "Try adjusting your search" : "Create your first project to get started"}
              </p>
              {!searchQuery && (
                <Link href="/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="group overflow-hidden border-muted/50 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="aspect-video bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center relative">
                  {getFaviconUrl(project.url) ? (
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <img
                        src={getFaviconUrl(project.url)}
                        alt={`${project.name} favicon`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          // Fallback to emoji if favicon fails to load
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `<span class="text-6xl">${project.thumbnail}</span>`
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-6xl">{project.thumbnail}</span>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-1">{project.name}</CardTitle>
                    </div>
                    <Badge
                      variant={project.status === "completed" ? "default" : "secondary"}
                      className={
                        project.status === "completed"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-blue-500/10 text-blue-500"
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Globe className="h-3 w-3" />
                    {project.url}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {project.createdAt.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {project.pagesCount} pages
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/results?id=${project.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(project.id, project.name)}
                      disabled={downloadingId === project.id || project.status !== 'completed'}
                    >
                      {downloadingId === project.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(project.url, '_blank')}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Source URL
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyUrl(project.url)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setProjectToDelete(project)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="border-muted/50 hover:border-primary/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 relative overflow-hidden">
                        {getFaviconUrl(project.url) ? (
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <img
                              src={getFaviconUrl(project.url)}
                              alt={`${project.name} favicon`}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                const target = e.currentTarget
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = `<span class="text-3xl">${project.thumbnail}</span>`
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-3xl">{project.thumbnail}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 font-semibold">{project.name}</div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {project.url}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {project.createdAt.toLocaleDateString()}
                          </div>
                          <div>{project.pagesCount} pages</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={project.status === "completed" ? "default" : "secondary"}
                        className={
                          project.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-blue-500/10 text-blue-500"
                        }
                      >
                        {project.status}
                      </Badge>
                      <Link href={`/results?id=${project.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(project.id, project.name)}
                        disabled={downloadingId === project.id || project.status !== 'completed'}
                      >
                        {downloadingId === project.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(project.url, '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Source URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyUrl(project.url)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setProjectToDelete(project)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
