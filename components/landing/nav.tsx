import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BinjAiLogo } from "@/components/ui/logo"

export function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <BinjAiLogo className="text-3xl" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-foreground-muted hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-foreground-muted hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link href="#pricing" className="text-foreground-muted hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="#" className="text-foreground-muted hover:text-foreground transition-colors">
            Enterprise
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button className="btn-gradient rounded-full px-6" asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
