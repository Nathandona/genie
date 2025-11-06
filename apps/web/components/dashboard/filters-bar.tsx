import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Grid3x3, List } from "lucide-react"

interface FiltersBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  filter: "all" | "completed" | "processing"
  onFilterChange: (filter: "all" | "completed" | "processing") => void
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
}

export function FiltersBar({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  viewMode,
  onViewModeChange,
}: FiltersBarProps) {
  return (
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
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange("completed")}
              >
                Completed
              </Button>
              <Button
                variant={filter === "processing" ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange("processing")}
              >
                Processing
              </Button>
            </div>
            <div className="flex gap-2 border-l pl-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => onViewModeChange("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => onViewModeChange("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
