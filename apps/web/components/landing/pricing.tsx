import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for trying out Genie",
    badge: null,
    features: [
      "1 generation per month",
      "Up to 10 pages",
      "Basic components",
      "Community support",
      "Download source code",
    ],
    cta: "Get Started",
    href: "/create",
    popular: false,
  },
  {
    name: "Professional",
    price: "$49",
    description: "For freelancers and small teams",
    badge: "Most Popular",
    features: [
      "10 generations per month",
      "Up to 100 pages per site",
      "Advanced components",
      "Priority support",
      "Download source code",
      "One-click Vercel deploy",
      "Custom design tokens",
      "SEO optimization",
    ],
    cta: "Start Free Trial",
    href: "/pricing",
    popular: true,
  },
  {
    name: "Agency",
    price: "$199",
    description: "For agencies and enterprises",
    badge: "Best Value",
    features: [
      "Unlimited generations",
      "Unlimited pages",
      "Premium components",
      "24/7 dedicated support",
      "Download source code",
      "One-click deploy anywhere",
      "White-label options",
      "API access",
      "Team collaboration",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
  },
]

export function Pricing() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your needs. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg scale-105"
                  : "border-muted/50"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary px-3 py-1">{plan.badge}</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={plan.href} className="w-full">
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full"
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>All plans include a 14-day money-back guarantee. Enterprise plans available upon request.</p>
        </div>
      </div>
    </section>
  )
}
