"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, Rocket } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

// Dynamically import Three.js scene to avoid blocking initial page load
const HeroScene = dynamic(() => import("./hero-scene").then(mod => ({ default: mod.HeroScene })), {
  ssr: false,
  loading: () => null
})

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 py-20 sm:py-32">
      {/* Three.js Scene */}
      <HeroScene />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Website Transformation</span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Transform Any Website into{" "}
            <span className="relative inline-block">
              <span className="relative bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Modern Next.js
              </span>
              <span className="absolute -bottom-2 left-0 h-3 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent blur-xl" />
            </span>{" "}
            in Minutes
          </h1>

          {/* Subheadline */}
          <p className="mb-10 text-lg leading-relaxed text-muted-foreground sm:text-xl lg:text-2xl">
            Convert legacy websites into blazing-fast, modern Next.js applications.
            <br className="hidden sm:block" />
            Save weeks of development time with AI-powered code generation.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/create" className="group w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
                Try It Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#demo" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full border-2 transition-all hover:bg-muted/50">
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 transition-colors hover:text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">10x faster</span>
            </div>
            <div className="flex items-center gap-2 transition-colors hover:text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Rocket className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">Production ready</span>
            </div>
            <div className="flex items-center gap-2 transition-colors hover:text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">AI-powered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl" />
      </div>
    </section>
  )
}
