import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Globe } from "lucide-react"
import Link from "next/link"

interface EmptyStateProps {
  searchQuery: string
}

export function EmptyState({ searchQuery }: EmptyStateProps) {
  return (
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
  )
}
