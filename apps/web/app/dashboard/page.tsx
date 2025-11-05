"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

  // Fetch projects from API
  useEffect(() => {
    async function fetchProjects() {
      try {
        setIsLoading(true)
        setError(null)
        const apiProjects = await apiClient.getProjects()
        setProjects(apiProjects.map(convertProject))
      } catch (err) {
        console.error('Failed to fetch projects:', err)
        setError(err instanceof Error ? err.message : 'Failed to load projects')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchProjects, 5000)
    return () => clearInterval(interval)
  }, [])

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.url.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === "all" || project.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="aspect-video bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center text-6xl">
                  {project.thumbnail}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-1">{project.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <Globe className="h-3 w-3" />
                        {project.url}
                      </CardDescription>
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
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
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
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 text-3xl">
                        {project.thumbnail}
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
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
