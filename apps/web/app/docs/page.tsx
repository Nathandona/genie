"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  BookOpen, 
  Zap, 
  Code, 
  Download, 
  Rocket, 
  Settings, 
  Search,
  ChevronRight,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

const categories = [
  {
    title: "Getting Started",
    icon: Rocket,
    description: "Learn the basics and create your first project",
    articles: [
      { title: "Quick Start Guide", href: "#quickstart", duration: "5 min" },
      { title: "Installation & Setup", href: "#installation", duration: "3 min" },
      { title: "Your First Generation", href: "#first-generation", duration: "10 min" },
      { title: "Understanding the Dashboard", href: "#dashboard", duration: "5 min" },
    ],
  },
  {
    title: "Core Concepts",
    icon: BookOpen,
    description: "Understand how Genie works under the hood",
    articles: [
      { title: "How Genie Works", href: "#how-it-works", duration: "8 min" },
      { title: "AI-Powered Analysis", href: "#ai-analysis", duration: "6 min" },
      { title: "Code Generation Pipeline", href: "#pipeline", duration: "10 min" },
      { title: "Quality & Optimization", href: "#quality", duration: "7 min" },
    ],
  },
  {
    title: "Features",
    icon: Zap,
    description: "Explore all the powerful features available",
    articles: [
      { title: "Component Library", href: "#components", duration: "12 min" },
      { title: "Styling & Theming", href: "#styling", duration: "8 min" },
      { title: "SEO Optimization", href: "#seo", duration: "6 min" },
      { title: "Responsive Design", href: "#responsive", duration: "7 min" },
    ],
  },
  {
    title: "Development",
    icon: Code,
    description: "Work with generated code and customize it",
    articles: [
      { title: "Project Structure", href: "#structure", duration: "10 min" },
      { title: "Customizing Components", href: "#customization", duration: "15 min" },
      { title: "Adding New Features", href: "#new-features", duration: "12 min" },
      { title: "Best Practices", href: "#best-practices", duration: "8 min" },
    ],
  },
  {
    title: "Deployment",
    icon: Download,
    description: "Deploy your generated projects to production",
    articles: [
      { title: "Download & Extract", href: "#download", duration: "5 min" },
      { title: "Deploy to Vercel", href: "#vercel", duration: "8 min" },
      { title: "Deploy to Netlify", href: "#netlify", duration: "8 min" },
      { title: "Custom Deployment", href: "#custom-deploy", duration: "10 min" },
    ],
  },
  {
    title: "Advanced",
    icon: Settings,
    description: "Advanced configurations and integrations",
    articles: [
      { title: "API Reference", href: "#api", duration: "15 min" },
      { title: "Custom Templates", href: "#templates", duration: "20 min" },
      { title: "Integration Guide", href: "#integrations", duration: "12 min" },
      { title: "Performance Tuning", href: "#performance", duration: "10 min" },
    ],
  },
]

const popularArticles = [
  { title: "Quick Start Guide", category: "Getting Started", views: "12.5k", href: "#quickstart" },
  { title: "Deploy to Vercel", category: "Deployment", views: "8.3k", href: "#vercel" },
  { title: "How Genie Works", category: "Core Concepts", views: "7.1k", href: "#how-it-works" },
  { title: "Component Library", category: "Features", views: "6.8k", href: "#components" },
]

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
            Documentation
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
            How can we help you?
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Everything you need to know about using Genie to transform websites into modern Next.js applications.
          </p>

          {/* Search Bar */}
          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-base"
            />
          </div>
        </div>

        {/* Popular Articles */}
        <div className="mx-auto mb-12 max-w-4xl">
          <h2 className="mb-6 text-2xl font-bold">Popular Articles</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {popularArticles.map((article) => (
              <Link key={article.title} href={article.href || "#"}>
                <Card className="group cursor-pointer transition-all hover:border-primary hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {article.category} • {article.views} views
                        </CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Documentation Categories */}
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-bold">Browse by Category</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Card key={category.title} className="flex flex-col">
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                    </div>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2">
                      {category.articles.map((article) => (
                        <li key={article.title}>
                          <Link
                            href={article.href}
                            className="group flex items-center justify-between rounded-lg p-2 text-sm transition-colors hover:bg-muted"
                          >
                            <span className="group-hover:text-primary transition-colors">
                              {article.title}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {article.duration}
                            </Badge>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mx-auto mt-20 max-w-4xl">
          <h2 className="mb-6 text-2xl font-bold">Additional Resources</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API Reference
                </CardTitle>
                <CardDescription>
                  Comprehensive API documentation for developers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="#api">
                  <Button variant="outline" className="w-full">
                    View API Docs
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Video Tutorials
                </CardTitle>
                <CardDescription>
                  Step-by-step video guides and walkthroughs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="#tutorials">
                  <Button variant="outline" className="w-full">
                    Watch Tutorials
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Help CTA */}
        <div className="mx-auto mt-20 max-w-3xl text-center">
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">Can't find what you're looking for?</CardTitle>
              <CardDescription className="text-base">
                Our support team is here to help. Reach out and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap justify-center gap-4">
              <Link href="/create">
                <Button size="lg">
                  Start Building
                </Button>
              </Link>
              <Link href="#contact">
                <Button size="lg" variant="outline">
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
