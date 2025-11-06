import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function LoadingState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
        <h3 className="mb-2 text-xl font-semibold">Loading projects...</h3>
        <p className="text-muted-foreground">Please wait while we fetch your data</p>
      </CardContent>
    </Card>
  )
}
