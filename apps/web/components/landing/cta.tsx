import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTA() {
  return (
    <section className="bg-primary py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
            Ready to Transform Your Website?
          </h2>
          <p className="mb-10 text-lg text-primary-foreground/90 sm:text-xl">
            Join thousands of developers and teams who have already modernized their websites with Genie.
            Start your free trial today—no credit card required.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/create">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="w-full border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
