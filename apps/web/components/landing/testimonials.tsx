"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import { useState, useEffect } from "react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CTO, TechStart Inc",
    avatar: "SC",
    content: "Genie saved us 6 weeks of development time. We converted our legacy PHP site to Next.js in just 2 hours. Absolutely game-changing!",
    rating: 5,
  },
  {
    name: "Michael Rodriguez",
    role: "Freelance Developer",
    avatar: "MR",
    content: "As a freelancer, this tool is pure gold. I can take on more clients and deliver faster. The code quality is impressive - clean and well-structured.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Product Manager, DesignCo",
    avatar: "EW",
    content: "The speed is incredible. We migrated our entire marketing site in an afternoon. The AI captured our design perfectly and even improved performance!",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Agency Owner",
    avatar: "DK",
    content: "We've used Genie for 5 client projects now. It's become an essential part of our workflow. ROI is through the roof.",
    rating: 5,
  },
  {
    name: "Lisa Anderson",
    role: "Startup Founder",
    avatar: "LA",
    content: "I'm not a developer, but I needed to modernize our website. Genie made it possible. The results exceeded my expectations!",
    rating: 5,
  },
  {
    name: "James Taylor",
    role: "Senior Engineer, Enterprise Corp",
    avatar: "JT",
    content: "We were skeptical at first, but the generated code is production-ready. We made minor tweaks and deployed. Saves our team countless hours.",
    rating: 5,
  },
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="bg-muted/30 py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Loved by Developers & Teams
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of satisfied users who've transformed their workflows
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.name}
              className={`transition-all duration-500 ${
                index === currentIndex 
                  ? "border-primary/50 shadow-lg scale-105" 
                  : "border-muted/50"
              }`}
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="mb-6 text-muted-foreground italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
