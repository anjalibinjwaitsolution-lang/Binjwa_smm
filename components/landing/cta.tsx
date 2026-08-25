import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function LandingCTA() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 gradient-primary" />
      <div className="absolute inset-0 mesh-gradient opacity-30" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-5xl md:text-6xl font-heading font-bold text-white mb-4 text-balance">
          Your Next Post Is 30 Seconds Away
        </h2>
        <p className="text-xl md:text-2xl text-white/90 mb-10 text-balance">
          Give it a try — no card, no commitment, just see what it comes up with.
        </p>
        <Button
          size="lg"
          className="bg-background text-primary hover:bg-background/90 h-16 px-12 text-xl rounded-full shadow-2xl"
          asChild
        >
          <Link href="/sign-up">
            Start Creating Free
            <ArrowRight className="ml-2 w-6 h-6" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
