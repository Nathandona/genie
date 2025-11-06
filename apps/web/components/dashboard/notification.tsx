import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, X } from "lucide-react"

interface NotificationProps {
  type: 'success' | 'error'
  message: string
  onClose: () => void
}

export function Notification({ type, message, onClose }: NotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-md animate-in slide-in-from-top-2">
      <Alert variant={type === 'error' ? 'destructive' : 'default'}>
        {type === 'success' ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertTitle>{type === 'success' ? 'Success' : 'Error'}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          {message}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 ml-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
