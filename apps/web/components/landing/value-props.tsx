import { Zap, DollarSign, Sparkles, Code, Rocket, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Generate production-ready Next.js code in minutes, not weeks. Our AI analyzes and converts websites with incredible speed.",
  },
  {
    icon: DollarSign,
    title: "Cost Effective",
    description: "Save thousands in development costs. Convert an entire website for the price of a few hours of developer time.",
  },
  {
    icon: Sparkles,
    title: "High Quality",
    description: "Clean, maintainable code following Next.js best practices. Optimized for performance and SEO out of the box.",
  },
  {
    icon: Code,
    title: "Modern Stack",
    description: "Built with Next.js 14+, React, TypeScript, and Tailwind CSS. Production-ready and fully customizable.",
  },
  {
    icon: Rocket,
    title: "Deploy Instantly",
    description: "One-click deployment to Vercel or download the source code. Get your site live in minutes.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Enterprise-grade security and 99.9% uptime. Your data and generated code are always safe.",
  },
]

export function ValueProps() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Why Choose Genie?
          </h2>
          <p className="text-lg text-muted-foreground">
            Experience the future of web development with AI-powered automation
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="border-muted/50 transition-all hover:border-primary/50 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
