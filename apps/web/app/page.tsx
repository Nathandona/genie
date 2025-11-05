import { Hero } from "@/components/landing/hero"
import { ValueProps } from "@/components/landing/value-props"
import { Testimonials } from "@/components/landing/testimonials"
import { LiveDemo } from "@/components/landing/live-demo"
import { Pricing } from "@/components/landing/pricing"
import { CTA } from "@/components/landing/cta"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <ValueProps />
      <LiveDemo />
      <Testimonials />
      <Pricing />
      <CTA />
    </div>
  )
}
