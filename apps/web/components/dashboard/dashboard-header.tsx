import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export function DashboardHeader() {
  return (
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
  )
}
