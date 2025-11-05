"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const phases = [
  { id: 1, name: "Crawling", color: "bg-blue-500" },
  { id: 2, name: "Analyzing", color: "bg-purple-500" },
  { id: 3, name: "Generating", color: "bg-green-500" },
  { id: 4, name: "Optimizing", color: "bg-orange-500" },
]

export function LiveDemo() {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({
    pages: 0,
    components: 0,
    assets: 0,
  })

  useEffect(() => {
    // Simulate demo progression
    const phaseTimer = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % phases.length)
      setProgress(0)
    }, 3000)

    return () => clearInterval(phaseTimer)
  }, [])

  useEffect(() => {
    // Animate progress
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0
        return prev + 2
      })
    }, 60)

    return () => clearInterval(progressTimer)
  }, [currentPhase])

  useEffect(() => {
    // Update stats
    const statsTimer = setInterval(() => {
      setStats({
        pages: Math.floor(Math.random() * 50) + 10,
        components: Math.floor(Math.random() * 200) + 50,
        assets: Math.floor(Math.random() * 300) + 100,
      })
    }, 1500)

    return () => clearInterval(statsTimer)
  }, [])

  return (
    <section id="demo" className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-5xl">
            See It In Action
          </h2>
          <p className="text-lg text-muted-foreground">
            Watch as FrontGenie transforms a website in real-time
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-8">
              {/* Phase Indicators */}
              <div className="mb-8 flex justify-between gap-2">
                {phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className={`flex-1 rounded-lg p-4 text-center transition-all ${
                      index === currentPhase
                        ? "bg-primary text-primary-foreground shadow-lg scale-105"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <div className="text-sm font-semibold">{phase.name}</div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Processing...</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-background/50 p-4 text-center backdrop-blur-sm">
                  <div className="mb-1 text-3xl font-bold text-primary">{stats.pages}</div>
                  <div className="text-sm text-muted-foreground">Pages Discovered</div>
                </div>
                <div className="rounded-lg border bg-background/50 p-4 text-center backdrop-blur-sm">
                  <div className="mb-1 text-3xl font-bold text-primary">{stats.components}</div>
                  <div className="text-sm text-muted-foreground">Components Created</div>
                </div>
                <div className="rounded-lg border bg-background/50 p-4 text-center backdrop-blur-sm">
                  <div className="mb-1 text-3xl font-bold text-primary">{stats.assets}</div>
                  <div className="text-sm text-muted-foreground">Assets Optimized</div>
                </div>
              </div>

              {/* Activity Log */}
              <div className="mt-6 space-y-2">
                <div className="text-sm font-medium">Recent Activity</div>
                <div className="space-y-1 rounded-lg bg-background/50 p-4 font-mono text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>✓ Crawled homepage and 23 linked pages</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>✓ Extracted design tokens and color palette</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    <span>Generating React components...</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
