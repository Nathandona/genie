"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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
import { apiClient, type CrawlJob } from "@/lib/api-client"

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

// Calculate time remaining based on progress rate
function calculateTimeRemaining(
  progress: number,
  startedAt: string | null,
  completedAt: string | null
): number | null {
  if (completedAt || progress >= 100) return 0
  if (!startedAt || progress === 0) return null // Can't estimate yet
  
  const elapsed = Date.now() - new Date(startedAt).getTime()
  const elapsedMinutes = elapsed / 60000
  
  if (progress > 0 && elapsedMinutes > 0) {
    // Calculate rate: % per minute
    const progressRate = progress / elapsedMinutes
    
    if (progressRate > 0) {
      const remaining = 100 - progress
      const minutesRemaining = remaining / progressRate
      // Cap at reasonable maximum (30 minutes)
      return Math.min(Math.max(0, minutesRemaining), 30)
    }
  }
  
  // Fallback: estimate based on typical rates
  // Crawling: ~2-5% per minute
  // Analyzing: ~10-20% per minute  
  // Generating: ~5-10% per minute
  const estimatedRate = progress < 50 ? 3 : progress < 80 ? 15 : 7
  const remaining = 100 - progress
  return Math.min(remaining / estimatedRate, 30)
}

// Map progress (0-100) to phase
function getPhaseFromProgress(progress: number): number {
  if (progress < 50) return 0 // Crawling
  if (progress < 80) return 1 // Analyzing
  if (progress < 100) return 2 // Generating
  return 3 // Completed
}

export default function ProgressPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ProgressPageContent />
    </Suspense>
  )
}

function ProgressPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectId = searchParams.get("id")
  const url = searchParams.get("url") || ""

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
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null)
  const [projectStatus, setProjectStatus] = useState<string>("")
  const [crawlJob, setCrawlJob] = useState<CrawlJob | null>(null)
  const [lastCurrentPage, setLastCurrentPage] = useState<string | null>(null)
  const [lastPagesDiscovered, setLastPagesDiscovered] = useState(0)
  const logIdCounterRef = useRef(0)

  const addActivityLog = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setActivityLog((prev) => {
      // Avoid duplicate messages (check last few entries to prevent spam)
      const recentMessages = prev.slice(0, 3).map(log => log.message)
      if (recentMessages.includes(message)) {
        return prev
      }
      
      // Generate unique ID using timestamp + counter + random
      logIdCounterRef.current += 1
      const uniqueId = Date.now() * 10000 + logIdCounterRef.current + Math.random() * 1000
      
      return [
        {
          id: uniqueId,
          message,
          timestamp: new Date(),
          type,
        },
        ...prev.slice(0, 9), // Keep last 10 items
      ]
    })
  }, [])

  const phases: Phase[] = [
    { id: 0, name: "Crawling", icon: Globe, status: currentPhase === 0 ? "active" : currentPhase > 0 ? "completed" : "pending" },
    { id: 1, name: "Analyzing", icon: Search, status: currentPhase === 1 ? "active" : currentPhase > 1 ? "completed" : "pending" },
    { id: 2, name: "Generating", icon: Sparkles, status: currentPhase === 2 ? "active" : currentPhase > 2 ? "completed" : "pending" },
    { id: 3, name: "Building", icon: Rocket, status: currentPhase === 3 ? "active" : currentPhase > 3 ? "completed" : "pending" },
  ]

  // Initial activity log
  useEffect(() => {
    addActivityLog('Initializing project generation...', 'info')
  }, [])

  // Poll for project status
  useEffect(() => {
    if (!projectId || isCancelled || isComplete) return

    async function pollStatus() {
      try {
        const result = await apiClient.getProjectStatus(projectId!)
        const { project, crawlJob: newCrawlJob, stats: newStats } = result
        
        setProjectStatus(project.status)
        setStats(newStats)
        setCrawlJob(newCrawlJob)

        // Use backend progress directly (0-100)
        // If no crawlJob yet, show 0% with "Initializing..." message
        const backendProgress = newCrawlJob?.progress ?? 0
        setProgress(backendProgress)

        // Show initializing message if no crawlJob
        if (!newCrawlJob && backendProgress === 0) {
          addActivityLog('Project queued for processing...', 'info')
        }

        // Map progress to phase
        const phaseFromProgress = getPhaseFromProgress(backendProgress)
        setCurrentPhase(phaseFromProgress)

        // Calculate time remaining
        const timeRemaining = calculateTimeRemaining(
          backendProgress,
          newCrawlJob?.startedAt ?? null,
          newCrawlJob?.completedAt ?? null
        )
        setEstimatedTimeRemaining(timeRemaining)

        // Handle completion
        if (project.status === 'completed' || backendProgress >= 100) {
          setProgress(100)
          setIsComplete(true)
          setEstimatedTimeRemaining(0)
          addActivityLog('Project generated successfully!', 'success')
          
          // Redirect to results page
          setTimeout(() => {
            router.push(`/results?id=${projectId}`)
          }, 2000)
        } else if (project.status === 'failed') {
          addActivityLog('Generation failed. Please try again.', 'warning')
          setIsCancelled(true)
        }

        // Track page discovery for activity log
        if (newCrawlJob?.pagesDiscovered && newCrawlJob.pagesDiscovered > lastPagesDiscovered) {
          addActivityLog(`Discovered ${newCrawlJob.pagesDiscovered} page${newCrawlJob.pagesDiscovered === 1 ? '' : 's'}`, 'info')
          setLastPagesDiscovered(newCrawlJob.pagesDiscovered)
        }

        // Track current page changes
        if (newCrawlJob?.currentPage && newCrawlJob.currentPage !== lastCurrentPage) {
          try {
            const pageUrl = new URL(newCrawlJob.currentPage)
            const pagePath = pageUrl.pathname === '/' ? 'homepage' : pageUrl.pathname
            addActivityLog(`Crawling: ${pagePath}`, 'info')
            setLastCurrentPage(newCrawlJob.currentPage)
          } catch {
            // Invalid URL, skip
          }
        }

        // Show errors if any
        if (newCrawlJob?.errors && Array.isArray(newCrawlJob.errors) && newCrawlJob.errors.length > 0) {
          newCrawlJob.errors.forEach((error: string) => {
            addActivityLog(`Error: ${error}`, 'warning')
          })
        }

        // Phase transition messages
        if (phaseFromProgress === 0 && backendProgress > 0) {
          addActivityLog('Crawling website pages...', 'info')
        } else if (phaseFromProgress === 1 && backendProgress >= 50) {
          addActivityLog('Analyzing design tokens and patterns...', 'info')
        } else if (phaseFromProgress === 2 && backendProgress >= 80) {
          addActivityLog('Generating Next.js components...', 'info')
        }

      } catch (err) {
        console.error('Failed to poll status:', err)
        addActivityLog('Error fetching project status', 'warning')
      }
    }

    pollStatus()
    const interval = setInterval(pollStatus, 2000) // Poll every 2 seconds
    return () => clearInterval(interval)
  }, [projectId, isCancelled, isComplete, router, lastCurrentPage, lastPagesDiscovered, addActivityLog])

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
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="mt-2 text-sm text-muted-foreground text-right">
                {isComplete ? (
                  "Complete"
                ) : estimatedTimeRemaining === null ? (
                  "Calculating..."
                ) : (
                  `~${Math.ceil(estimatedTimeRemaining)} min remaining`
                )}
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
