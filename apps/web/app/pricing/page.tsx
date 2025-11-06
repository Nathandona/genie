"use client"

import { useState } from "react"
import { Check, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { isAuthenticated } from "@/lib/auth"
import { useRouter } from "next/navigation"

const plans = [
  {
    name: "Starter",
    price: "$0",
    description: "Perfect for trying out Genie",
    badge: null,
    features: [
      "1 generation per month",
      "Up to 10 pages per site",
      "Standard generation speed",
      "Basic design token extraction",
      "Community support only",
    ],
    cta: "Get Started Free",
    href: "/create",
    popular: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    yearlyPrice: "$490/year",
    description: "For freelancers and developers",
    badge: "Most Popular",
    features: [
      "10 generations per month",
      "Up to 50 pages per site",
      "Priority queue (2x faster)",
      "Advanced design token extraction",
      "Full asset optimization",
      "Email support (24-48hr)",
      "Commercial use license",
      "Remove Genie attribution",
    ],
    cta: "Start Free Trial",
    href: "/create",
    popular: true,
  },
  {
    name: "Business",
    price: "$199",
    period: "/month",
    yearlyPrice: "$1,990/year",
    description: "For agencies and design studios",
    badge: "Best Value",
    features: [
      "Unlimited generations",
      "Up to 100 pages per site",
      "Fastest speed (4x)",
      "White-label option",
      "API access (100 req/month)",
      "Team collaboration (5 seats)",
      "Priority support (12hr)",
      "Custom component templates",
      "Usage analytics dashboard",
      "Client project management",
    ],
    cta: "Start Free Trial",
    href: "/create",
    popular: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large agencies and enterprises",
    badge: null,
    features: [
      "Everything in Business",
      "Unlimited pages per site",
      "Dedicated account manager",
      "99.9% uptime SLA",
      "Phone support (4hr)",
      "Custom integrations",
      "On-premise deployment",
      "SSO & SOC 2 compliance",
      "Training & onboarding",
      "Volume discounts (10+ seats)",
    ],
    cta: "Contact Sales",
    href: "/create",
    popular: false,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    setError(null) // Clear any previous errors
    // Free plan - redirect to create
    if (plan.name === "Starter") {
      router.push("/create")
      return
    }

    // Enterprise - redirect to create for now (or contact page)
    if (plan.name === "Enterprise") {
      router.push("/create")
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push("/login?redirect=/pricing")
      return
    }

    // For paid plans, create Polar checkout
    setLoadingPlan(plan.name)
    try {
      // TODO: Map plan names to actual Polar price IDs
      // You'll need to create products in Polar dashboard first
      const priceIdMap: Record<string, string> = {
        "Pro": "price_pro_monthly", // Replace with actual Polar price ID
        "Business": "price_business_monthly", // Replace with actual Polar price ID
      }

      const priceId = priceIdMap[plan.name]
      if (!priceId) {
        throw new Error("Price ID not configured")
      }

      const { checkoutUrl } = await apiClient.createPolarCheckout(priceId)
      
      // Redirect to Polar checkout
      window.location.href = checkoutUrl
    } catch (error) {
      console.error("Failed to create checkout:", error)
      setError("Failed to start checkout. Please try again.")
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {error && (
          <div className="mx-auto mb-6 max-w-2xl">
            <Alert variant="destructive" className="relative">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-6 w-6 p-0"
                onClick={() => setError(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          </div>
        )}

        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your needs. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                {plan.yearlyPrice && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    or {plan.yearlyPrice} (save 17%)
                  </p>
                )}
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
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                  size="lg"
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loadingPlan === plan.name}
                >
                  {loadingPlan === plan.name ? "Loading..." : plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Add-Ons Section */}
        <div className="mx-auto mt-20 max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold">
            Pay-As-You-Go Credits & Add-Ons
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">One-Time Generation</CardTitle>
                <CardDescription>No subscription required</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">Single generation</span>
                    <span className="font-semibold">$29</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">5-pack bundle</span>
                    <span className="font-semibold">$125 <span className="text-xs text-muted-foreground">(save 14%)</span></span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">10-pack bundle</span>
                    <span className="font-semibold">$199 <span className="text-xs text-muted-foreground">(save 31%)</span></span>
                  </div>
                  <p className="pt-2 text-xs text-muted-foreground">
                    Credits never expire. Extra pages: +$1 per 10 pages
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Premium Services</CardTitle>
                <CardDescription>Expert assistance on demand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">Rush generation</span>
                    <span className="font-semibold">$49</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">Expert code review</span>
                    <span className="font-semibold">$199</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">Custom components</span>
                    <span className="font-semibold">$499+</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">Migration consulting</span>
                    <span className="font-semibold">$150/hr</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                  and we'll prorate the difference.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens after I use all my generations?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You can purchase pay-as-you-go credits for $29 per generation, or upgrade to a higher tier for more monthly generations. 
                  Credits never expire and can be used anytime.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a refund policy?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All plans include a 14-day money-back guarantee. If you're not satisfied,
                  contact us within 14 days for a full refund, no questions asked.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's included in the commercial use license?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pro tier and above include a commercial license, allowing you to use generated code for client projects, 
                  products, and services without attribution requirements.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does team collaboration work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Business tier includes 5 team seats with shared project access, analytics, and client management features. 
                  Enterprise plans offer unlimited seats and advanced team controls.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto mt-20 max-w-3xl text-center">
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to transform your websites?</CardTitle>
              <CardDescription className="text-base">
                Start with our free tier or try any paid plan with a 14-day money-back guarantee.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center gap-4">
              <Link href="/create">
                <Button size="lg">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline">
                  View Documentation
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
