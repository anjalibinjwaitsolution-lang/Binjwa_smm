import { LandingNav } from "@/components/landing/nav"
import { LandingFooter } from "@/components/landing/footer"
import { CheckCircle } from "lucide-react"

export default async function DataDeletionStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const resolvedParams = await searchParams
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <LandingNav />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
        <CheckCircle className="w-16 h-16 text-success mb-6" />
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
          Data Deletion Confirmed
        </h1>
        <p className="text-foreground-muted mb-8 text-lg">
          Your Facebook data deletion request has been processed successfully. All associated tokens, 
          logs, and social data have been permanently removed from our servers in compliance with 
          Meta platform policies.
        </p>
        
        {resolvedParams.code && (
          <div className="bg-background-card border border-border rounded-xl p-4 w-full text-left">
            <p className="text-sm font-semibold text-foreground-muted mb-1">Confirmation Code:</p>
            <p className="font-mono text-white break-all">{resolvedParams.code}</p>
          </div>
        )}
      </div>

      <LandingFooter />
    </main>
  )
}
