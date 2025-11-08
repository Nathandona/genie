import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Clock, FileText, Folder } from "lucide-react"

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

  const stats = [
    {
      label: "Total Projects",
      value: projects.length,
      icon: Folder,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Processing",
      value: processingCount,
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Total Pages",
      value: totalPages,
      icon: FileText,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ]

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="group relative overflow-hidden border-muted/50 transition-all hover:border-primary/30 hover:shadow-md">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor} transition-transform group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="mb-1 text-sm font-medium text-muted-foreground">{stat.label}</div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
