import { LandingHero } from "@/components/landing/hero"
import { LandingEcosystem } from "@/components/landing/ecosystem"
import { LandingFeatures } from "@/components/landing/features"
import { LandingHowItWorks } from "@/components/landing/how-it-works"
import { LandingSocialProof } from "@/components/landing/social-proof"
import { LandingPricing } from "@/components/landing/pricing"
import { LandingCTA } from "@/components/landing/cta"
import { LandingFooter } from "@/components/landing/footer"
import { LandingNav } from "@/components/landing/nav"

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <LandingNav />
      <LandingHero />
      <LandingEcosystem />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingSocialProof />
      <LandingPricing />
      <LandingCTA />
      <LandingFooter />
    </main>
  )
}
