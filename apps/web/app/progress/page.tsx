"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Globe, 
  Search, 
  Sparkles, 
  Rocket, 
  CheckCircle2, 
  Loader2,
  X,
  FileCode,
  Image as ImageIcon,
  Layout
} from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

interface Phase {
  id: number
  name: string
  icon: any
  status: "pending" | "active" | "completed"
}

interface ActivityLog {
  id: number
  message: string
  timestamp: Date
  type: "success" | "info" | "warning"
}

export default function ProgressPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const url = searchParams.get("url") || ""
  const maxPages = searchParams.get("maxPages") || "10"

  const [currentPhase, setCurrentPhase] = useState(0)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({
    pagesDiscovered: 0,
    componentsCreated: 0,
    assetsOptimized: 0,
  })
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(parseInt(maxPages) * 0.5)

  const phases: Phase[] = [
    { id: 0, name: "Crawling", icon: Globe, status: currentPhase === 0 ? "active" : currentPhase > 0 ? "completed" : "pending" },
    { id: 1, name: "Analyzing", icon: Search, status: currentPhase === 1 ? "active" : currentPhase > 1 ? "completed" : "pending" },
    { id: 2, name: "Generating", icon: Sparkles, status: currentPhase === 2 ? "active" : currentPhase > 2 ? "completed" : "pending" },
    { id: 3, name: "Building", icon: Rocket, status: currentPhase === 3 ? "active" : currentPhase > 3 ? "completed" : "pending" },
  ]

  useEffect(() => {
    if (isCancelled || isComplete) return

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentPhase < 3) {
            setCurrentPhase((p) => p + 1)
            return 0
          } else {
            setIsComplete(true)
            clearInterval(progressInterval)
            // Redirect to results page
            setTimeout(() => {
              router.push(`/results?url=${encodeURIComponent(url)}`)
            }, 2000)
            return 100
          }
        }
        return prev + 1
      })
    }, 100)

    return () => clearInterval(progressInterval)
  }, [currentPhase, isCancelled, isComplete, url, router])

  useEffect(() => {
    if (isCancelled || isComplete) return

    // Simulate stats updates
    const statsInterval = setInterval(() => {
      setStats((prev) => ({
        pagesDiscovered: Math.min(prev.pagesDiscovered + Math.floor(Math.random() * 3), parseInt(maxPages)),
        componentsCreated: prev.componentsCreated + Math.floor(Math.random() * 5),
        assetsOptimized: prev.assetsOptimized + Math.floor(Math.random() * 7),
      }))

      setEstimatedTimeRemaining((prev) => Math.max(0, prev - 0.1))
    }, 2000)

    return () => clearInterval(statsInterval)
  }, [isCancelled, isComplete, maxPages])

  useEffect(() => {
    if (isCancelled || isComplete) return

    // Simulate activity log
    const logMessages = [
      { phase: 0, messages: [
        "Discovered homepage",
        "Found 5 navigation links",
        "Crawling /about page",
        "Crawling /services page",
        "Detected responsive design",
      ]},
      { phase: 1, messages: [
        "Extracting color palette",
        "Analyzing typography",
        "Identifying component patterns",
        "Parsing CSS structure",
        "Detecting layout system",
      ]},
      { phase: 2, messages: [
        "Generating React components",
        "Creating page templates",
        "Optimizing images",
        "Setting up routing",
        "Generating TypeScript types",
      ]},
      { phase: 3, messages: [
        "Installing dependencies",
        "Configuring Next.js",
        "Running build process",
        "Optimizing bundle",
        "Finalizing project",
      ]},
    ]

    const logInterval = setInterval(() => {
      const phaseMessages = logMessages[currentPhase]?.messages
      if (phaseMessages && phaseMessages.length > 0) {
        const randomMessage = phaseMessages[Math.floor(Math.random() * phaseMessages.length)]
        setActivityLog((prev) => [
          {
            id: Date.now(),
            message: randomMessage,
            timestamp: new Date(),
            type: Math.random() > 0.8 ? "success" : "info",
          },
          ...prev.slice(0, 9), // Keep last 10 items
        ])
      }
    }, 3000)

    return () => clearInterval(logInterval)
  }, [currentPhase, isCancelled, isComplete])

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel this generation?")) {
      setIsCancelled(true)
      router.push("/create")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {isComplete ? "Generation Complete!" : "Generating Your Project"}
          </h1>
          <p className="text-muted-foreground">
            {isComplete ? "Your Next.js project is ready" : `Converting: ${url}`}
          </p>
        </div>

        {/* Phase Indicators */}
        <div className="mx-auto mb-8 max-w-4xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {phases.map((phase) => {
              const Icon = phase.icon
              return (
                <Card
                  key={phase.id}
                  className={`transition-all ${
                    phase.status === "active"
                      ? "border-primary bg-primary/5 shadow-lg"
                      : phase.status === "completed"
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-muted/50"
                  }`}
                >
                  <CardContent className="p-4 text-center">
                    <div className="mb-2 flex justify-center">
                      {phase.status === "completed" ? (
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      ) : phase.status === "active" ? (
                        <Icon className="h-8 w-8 animate-pulse text-primary" />
                      ) : (
                        <Icon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className={`text-sm font-semibold ${
                      phase.status === "active" ? "text-primary" : 
                      phase.status === "completed" ? "text-green-500" : 
                      "text-muted-foreground"
                    }`}>
                      {phase.name}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mx-auto mb-8 max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className={`h-5 w-5 ${isComplete ? "hidden" : "animate-spin"} text-primary`} />
                  <span className="font-medium">
                    {isComplete ? "Complete" : phases[currentPhase]?.name}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round(((currentPhase * 100) + progress) / 4)}%
                </span>
              </div>
              <Progress value={((currentPhase * 100) + progress) / 4} className="h-3" />
              <div className="mt-2 text-sm text-muted-foreground text-right">
                {isComplete ? "0 min" : `~${Math.ceil(estimatedTimeRemaining)} min remaining`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="mx-auto mb-8 max-w-4xl">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-muted/50">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Layout className="h-4 w-4" />
                  <span className="text-sm">Pages Discovered</span>
                </div>
                <div className="text-3xl font-bold text-primary">{stats.pagesDiscovered}</div>
              </CardContent>
            </Card>
            <Card className="border-muted/50">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <FileCode className="h-4 w-4" />
                  <span className="text-sm">Components Created</span>
                </div>
                <div className="text-3xl font-bold text-primary">{stats.componentsCreated}</div>
              </CardContent>
            </Card>
            <Card className="border-muted/50">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm">Assets Optimized</span>
                </div>
                <div className="text-3xl font-bold text-primary">{stats.assetsOptimized}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Log */}
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {activityLog.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Starting generation process...
                  </div>
                ) : (
                  activityLog.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 text-sm"
                    >
                      <div className={`mt-0.5 h-2 w-2 rounded-full ${
                        log.type === "success" ? "bg-green-500" : "bg-blue-500 animate-pulse"
                      }`} />
                      <div className="flex-1">
                        <span className="text-foreground">{log.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cancel Button */}
        {!isComplete && (
          <div className="mx-auto mt-8 max-w-4xl text-center">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel Generation
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
