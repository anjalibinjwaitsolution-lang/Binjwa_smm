import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import Link from "next/link"

export function LandingHero() {
  return (
    <section className="relative pt-40 pb-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-accent-orange/10 via-transparent to-accent-green/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-orange/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-green/20 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Content */}
          <div className="text-left text-balance">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white text-sm font-medium mb-8 backdrop-blur-sm">
              Smart Social Media Management, Simplified
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-[80px] font-bold text-white mb-8 leading-[1.1]">
              Stop Staring at a <br/>Blank Caption Box
            </h1>

            <p className="text-lg lg:text-xl text-foreground-muted mb-10 max-w-xl leading-relaxed">
              Tell it what you're posting about. Binjwa creates the content, designs it, and matches your brand — then publishes it straight to Instagram, Facebook, TikTok, Threads, WhatsApp, LinkedIn and more, so you don't have to juggle multiple apps.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-start gap-4 mb-10">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-[#F16522] hover:bg-[#E05A1A] text-white rounded-full" asChild>
                <Link href="/sign-up">Start Creating Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold bg-transparent border-white/20 text-white hover:bg-white/10 rounded-full" asChild>
                <Link href="/login">Book a Demo</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-6 text-sm text-foreground-muted">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No credit card needed
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Live in 5 minutes
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Cancel whenever
              </div>
            </div>
          </div>

          {/* Right Column: Video */}
          <div className="relative mt-12 lg:mt-0">
            {/* Orange Glow Effect matching the screenshot */}
            <div className="absolute inset-0 bg-[#F16522] opacity-30 blur-[80px] rounded-[40px]" />
            
            <div className="relative bg-[#1A1A1A] rounded-2xl shadow-2xl p-2 border border-white/10 z-10 ring-1 ring-white/5">
              <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/smm-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}
