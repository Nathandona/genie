import { Card, CardContent } from "@/components/ui/card"

interface Project {
  id: string
  name: string
  url: string
  status: "completed" | "processing" | "failed"
  createdAt: Date
  pagesCount: number
  thumbnail: string
}

interface StatsOverviewProps {
  projects: Project[]
}

export function StatsOverview({ projects }: StatsOverviewProps) {
  const completedCount = projects.filter(p => p.status === "completed").length
  const processingCount = projects.filter(p => p.status === "processing").length
  const totalPages = projects.reduce((acc, p) => acc + p.pagesCount, 0)

  return (
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
          <div className="text-3xl font-bold text-green-500">{completedCount}</div>
        </CardContent>
      </Card>
      <Card className="border-muted/50">
        <CardContent className="p-6">
          <div className="mb-2 text-sm text-muted-foreground">Processing</div>
          <div className="text-3xl font-bold text-blue-500">{processingCount}</div>
        </CardContent>
      </Card>
      <Card className="border-muted/50">
        <CardContent className="p-6">
          <div className="mb-2 text-sm text-muted-foreground">Total Pages</div>
          <div className="text-3xl font-bold">{totalPages}</div>
        </CardContent>
      </Card>
    </div>
  )
}
