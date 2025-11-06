import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

interface ErrorStateProps {
  error: string
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
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
  )
}
