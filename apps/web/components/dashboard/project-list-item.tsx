import { Card, CardContent } from "@/components/ui/card"
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

interface ProjectListItemProps {
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

export function ProjectListItem({ project, downloadingId, onDownload, onDelete, onCopyUrl }: ProjectListItemProps) {
  return (
    <Card className="border-muted/50 hover:border-primary/50 transition-all">
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
              onClick={() => onDownload(project.id, project.name)}
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
                <DropdownMenuItem onClick={() => onCopyUrl(project.url)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(project)}
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
  )
}
