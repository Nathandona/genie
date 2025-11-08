import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
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
  Clock,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

interface Project {
  id: string
  name: string
  url: string
  status: "completed" | "processing" | "failed"
  createdAt: Date
  pagesCount: number
  thumbnail: string
}

interface ProjectCardProps {
  project: Project
  downloadingId: string | null
  onDownload: (projectId: string, projectName: string) => void
  onDelete: (project: Project) => void
  onCopyUrl: (url: string) => void
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).origin
    return `${domain}/favicon.ico`
  } catch {
    return ''
  }
}

function getStatusIcon(status: Project["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5" />
    case "processing":
      return <Clock className="h-3.5 w-3.5 animate-spin" />
    case "failed":
      return <AlertCircle className="h-3.5 w-3.5" />
  }
}

function getStatusVariant(status: Project["status"]) {
  switch (status) {
    case "completed":
      return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
    case "processing":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
    case "failed":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
  }
}

export function ProjectCard({ project, downloadingId, onDownload, onDelete, onCopyUrl }: ProjectCardProps) {
  return (
    <Card className="group relative overflow-hidden border-muted/50 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:from-primary/5 group-hover:via-primary/0 group-hover:to-primary/5 group-hover:opacity-100" />
      
      <div className="relative aspect-video bg-gradient-to-br from-muted/40 via-muted/20 to-muted/10 flex items-center justify-center overflow-hidden">
        {getFaviconUrl(project.url) ? (
          <div className="relative z-10 w-16 h-16 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <img
              src={getFaviconUrl(project.url)}
              alt={`${project.name} favicon`}
              className="max-w-full max-h-full object-contain drop-shadow-lg"
              onError={(e) => {
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
          <span className="relative z-10 text-6xl transition-transform duration-300 group-hover:scale-110">{project.thumbnail}</span>
        )}
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
      </div>
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="mb-1 truncate group-hover:text-primary transition-colors">{project.name}</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={`flex items-center gap-1.5 shrink-0 ${getStatusVariant(project.status)}`}
          >
            {getStatusIcon(project.status)}
            <span className="capitalize">{project.status}</span>
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1.5 text-xs">
          <Globe className="h-3 w-3 shrink-0" />
          <span className="truncate">{project.url}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{project.createdAt.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="h-4 w-4" />
            <span>{project.pagesCount} {project.pagesCount === 1 ? 'page' : 'pages'}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/results?id=${project.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-2 transition-all hover:bg-primary/5 hover:border-primary/20">
              <Eye className="h-4 w-4" />
              View
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(project.id, project.name)}
            disabled={downloadingId === project.id || project.status !== 'completed'}
            className="transition-all hover:bg-primary/5 hover:border-primary/20 disabled:opacity-50"
          >
            {downloadingId === project.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="transition-all hover:bg-primary/5 hover:border-primary/20">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => window.open(project.url, '_blank')} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Source URL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopyUrl(project.url)} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(project)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
