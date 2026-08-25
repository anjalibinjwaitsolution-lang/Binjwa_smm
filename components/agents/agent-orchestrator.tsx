"use client"

import { useState, useEffect, useRef } from "react"
import {
  Sparkles,
  Brain,
  Pencil,
  ImageIcon,
  Share2,
  CheckCircle,
  Pause,
  X,
  AlertCircle,
  Download,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  callBrandAnalyzer,
  callStrategist,
  callCopywriter,
  callImageGenerator,
  callOptimizer,
  callQualityChecker,
} from "@/lib/api-client"

interface Agent {
  id: string
  name: string
  role: string
  icon: any
  status: "waiting" | "running" | "complete" | "error"
  progress: number
  output?: any
  duration?: number
}

interface AgentOrchestratorProps {
  brandData: {
    name: string
    colors: string[]
    voice: string
    designSystem?: {
      referenceUrl?: string
      fontPrimary: string
      fontSecondary: string
      colorScheme: string
      designStyle: string
      customColors?: string[]
    }
  }
  contentRequest: {
    platform: string
    topic: string
    tone: string
  }
  onCancel?: () => void
}

export default function AgentOrchestrator({ brandData, contentRequest, onCancel }: AgentOrchestratorProps) {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "brand-analyzer",
      name: "Brand Analyzer",
      role: "Understanding your brand",
      icon: Brain,
      status: "waiting",
      progress: 0,
    },
    {
      id: "strategist",
      name: "Content Strategist",
      role: "Planning content approach",
      icon: Sparkles,
      status: "waiting",
      progress: 0,
    },
    {
      id: "copywriter",
      name: "Copywriter",
      role: "Writing engaging copy",
      icon: Pencil,
      status: "waiting",
      progress: 0,
    },
    {
      id: "image-gen",
      name: "Visual Creator",
      role: "Generating images",
      icon: ImageIcon,
      status: "waiting",
      progress: 0,
    },
    {
      id: "optimizer",
      name: "Platform Optimizer",
      role: "Formatting for platforms",
      icon: Share2,
      status: "waiting",
      progress: 0,
    },
    {
      id: "qa",
      name: "Quality Checker",
      role: "Ensuring brand consistency",
      icon: CheckCircle,
      status: "waiting",
      progress: 0,
    },
  ])

  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null)
  const [workflowResults, setWorkflowResults] = useState<any>({})
  const [isPaused, setIsPaused] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [showFinalResults, setShowFinalResults] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const accumulatedResults = useRef<Record<string, any>>({})

  const isPausedRef = useRef(isPaused)
  const activeStepIndexRef = useRef(activeStepIndex)

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    activeStepIndexRef.current = activeStepIndex
  }, [activeStepIndex])

  useEffect(() => {
    if (!isPaused && !isComplete) {
      runWorkflow()
    }
  }, [isPaused])

  async function runWorkflow() {
    let index = activeStepIndexRef.current
    while (index < agents.length) {
      if (isPausedRef.current) {
        break
      }

      const agent = agents[index]
      setCurrentAgent(agent)
      setActiveStepIndex(index)

      let result = accumulatedResults.current[agent.id]
      if (!result) {
        result = await runAgent(agent, index, accumulatedResults.current)
      }

      if (result) {
        accumulatedResults.current[agent.id] = result
        index++
        setActiveStepIndex(index)
      } else {
        break
      }
    }

    if (index === agents.length) {
      setIsComplete(true)
    }
  }

  const handleRetry = () => {
    const index = activeStepIndex
    setAgents((prev) =>
      prev.map((a, i) => (i === index ? { ...a, status: "waiting", progress: 0 } : a))
    )
    const agentId = agents[index].id
    delete accumulatedResults.current[agentId]
    
    setTimeout(() => {
      runWorkflow()
    }, 100)
  }

  async function runAgent(agent: Agent, index: number, previousResults: Record<string, any>) {
    console.log("[v0] Starting agent:", agent.name)
    console.log("[v0] Brand data:", brandData)
    console.log("[v0] Content request:", contentRequest)
    console.log("[v0] Previous results keys:", Object.keys(previousResults))

    updateAgentStatus(index, "running", 0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setAgents((prev) =>
        prev.map((a, i) => {
          if (i === index && a.progress < 90) {
            return { ...a, progress: a.progress + 10 }
          }
          return a
        }),
      )
    }, 500)

    try {
      const result = await callAgentAPI(agent.id, previousResults)
      console.log("[v0] Agent result:", agent.name, result)

      clearInterval(progressInterval)

      setWorkflowResults((prev: any) => ({ ...prev, [agent.id]: result }))
      updateAgentStatus(index, "complete", 100)

      return result
    } catch (error) {
      console.error("[v0] Agent error:", agent.name, error)
      clearInterval(progressInterval)
      updateAgentStatus(index, "error", 0)
      return null
    }
  }

  async function callAgentAPI(agentId: string, previousResults: any) {
    console.log("[v0] Calling API for:", agentId)
    console.log("[v0] Previous results:", Object.keys(previousResults))

    switch (agentId) {
      case "brand-analyzer":
        return await callBrandAnalyzer({
          voice: brandData.voice,
          keywords: [contentRequest.topic, contentRequest.platform],
          colors: brandData.designSystem?.customColors || brandData.colors,
          designStyle: brandData.designSystem?.designStyle,
          typography: brandData.designSystem
            ? `${brandData.designSystem.fontPrimary} for headings, ${brandData.designSystem.fontSecondary} for body`
            : undefined,
          referenceUrl: brandData.designSystem?.referenceUrl,
        } as any)

      case "strategist":
        const brandAnalysis = previousResults["brand-analyzer"]
        if (!brandAnalysis) {
          console.error("[v0] Missing brand analysis for strategist")
          throw new Error("Brand analysis is required for content strategist")
        }
        return await callStrategist({
          brandProfile: brandAnalysis,
          topic: contentRequest.topic,
          platforms: [contentRequest.platform],
          tone: contentRequest.tone,
        })

      case "copywriter":
        const strategy = previousResults["strategist"]
        if (!strategy) {
          console.error("[v0] Missing strategy for copywriter")
          throw new Error("Content strategy is required for copywriter")
        }
        return await callCopywriter({
          strategy: strategy,
          maxLength: 280,
          includeHashtags: true,
          includeCTA: true,
        })

      case "image-gen":
        const copyResult = previousResults["copywriter"]
        const brandProfile = previousResults["brand-analyzer"]
        if (!copyResult || !copyResult.caption) {
          console.error("[v0] Missing copy result for image generator")
          throw new Error("Copy result with caption is required for image generator")
        }
        if (!brandProfile) {
          console.error("[v0] Missing brand profile for image generator")
          throw new Error("Brand profile is required for image generator")
        }
        const designStyle = brandData.designSystem?.designStyle || "modern"
        const styleDescriptions: Record<string, string> = {
          modern: "clean lines, bold typography, gradient accents, contemporary aesthetic",
          minimal: "simple, spacious, monochromatic, lots of white space",
          bold: "high contrast, vibrant colors, strong geometric shapes",
          elegant: "refined, sophisticated, serif fonts, luxury feel",
          playful: "rounded corners, bright colors, fun whimsical elements",
          tech: "futuristic, geometric patterns, neon accents, digital aesthetic",
        }
        return await callImageGenerator({
          caption: copyResult.caption,
          brandColors: brandData.designSystem?.customColors || brandData.colors,
          style: `${brandProfile.visualStyle || "modern and vibrant"}, ${styleDescriptions[designStyle] || ""}`,
          aspectRatio: "1:1",
        })

      case "optimizer":
        if (!previousResults["copywriter"] || !previousResults["image-gen"]) {
          console.error("[v0] Missing data for optimizer")
          throw new Error("Copy and image data are required for optimizer")
        }
        return await callOptimizer({
          baseCopy: previousResults["copywriter"],
          image: previousResults["image-gen"],
          platforms: [contentRequest.platform, "twitter", "linkedin"],
        })

      case "qa":
        if (!previousResults["optimizer"]) {
          console.error("[v0] Missing optimizer data for quality checker")
          throw new Error("Optimized content is required for quality checker")
        }
        return await callQualityChecker({
          content: previousResults,
          brandGuidelines: previousResults["brand-analyzer"],
        })

      default:
        throw new Error(`Unknown agent: ${agentId}`)
    }
  }

  function updateAgentStatus(index: number, status: Agent["status"], progress: number) {
    setAgents((prev) => prev.map((agent, i) => (i === index ? { ...agent, status, progress } : agent)))
  }

  return (
    <div className="flex h-full bg-background-subtle relative">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen
          w-80 bg-background border-r border-border overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold">AI Agents at Work</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {agents.map((agent, index) => (
              <AgentCard key={agent.id} agent={agent} isActive={currentAgent?.id === agent.id} />
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 w-full lg:w-auto">
        <header className="lg:hidden sticky top-0 z-30 bg-background border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-heading font-bold">AI Content Studio</h1>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24">
          {showFinalResults ? (
            <FinalResultsView results={workflowResults} brandData={brandData} contentRequest={contentRequest} />
          ) : (
            <>
              {currentAgent && (
                <CurrentAgentView
                  agent={currentAgent}
                  output={workflowResults[currentAgent.id]}
                  onRetry={handleRetry}
                />
              )}
              {isComplete && (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-background rounded-2xl shadow-lg p-6 md:p-8 border border-border">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-heading font-bold mb-2">Workflow Complete!</h2>
                      <p className="text-foreground-muted mb-6">Your content has been generated and optimized.</p>
                      <Button className="gradient-primary text-white" onClick={() => setShowFinalResults(true)}>
                        View Final Content
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <footer className="sticky bottom-0 bg-background border-t border-border p-3 md:p-4">
          <div className="flex justify-end gap-2 md:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              disabled={isComplete}
              className="text-sm"
            >
              <Pause className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">{isPaused ? "Resume" : "Pause"}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-destructive hover:text-destructive text-sm"
            >
              <X className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function AgentCard({ agent, isActive }: { agent: Agent; isActive: boolean }) {
  const Icon = agent.icon

  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all ${isActive ? "border-primary bg-primary/5" : "border-border"}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            agent.status === "complete"
              ? "bg-green-500"
              : agent.status === "running"
                ? "gradient-primary animate-pulse"
                : agent.status === "error"
                  ? "bg-destructive"
                  : "bg-muted"
          }`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1">
          <div className="font-semibold text-sm">{agent.name}</div>
          <div className="text-xs text-foreground-muted">{agent.role}</div>

          {agent.status === "running" && (
            <div className="mt-2">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary transition-all duration-300"
                  style={{ width: `${agent.progress}%` }}
                />
              </div>
              <div className="text-xs text-foreground-muted mt-1">{agent.progress}%</div>
            </div>
          )}

          {agent.status === "complete" && (
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Complete
            </div>
          )}

          {agent.status === "error" && (
            <div className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Error
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CurrentAgentView({ agent, output, onRetry }: { agent: Agent; output: any; onRetry: () => void }) {
  const Icon = agent.icon

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-heading font-bold truncate">{agent.name}</h1>
          <p className="text-sm md:text-base text-foreground-muted">{agent.role}</p>
        </div>
      </div>

      <div className="bg-background rounded-2xl shadow-lg p-4 md:p-8 border border-border">
        {agent.status === "running" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary animate-pulse" />
            <p className="text-lg font-medium">
              Working on it<span className="animate-pulse">...</span>
            </p>
            <p className="text-sm text-foreground-muted mt-2">This may take a few moments</p>
          </div>
        )}

        {agent.status === "complete" && output && <AgentOutput agentId={agent.id} output={output} />}

        {agent.status === "error" && (
          <div className="text-center py-12 space-y-4">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
            <p className="text-lg font-medium text-destructive">An error occurred during step execution</p>
            <p className="text-sm text-foreground-muted">Please check your API keys or settings and try again.</p>
            <Button className="gradient-primary text-white" onClick={onRetry}>
              Retry Agent Step
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function AgentOutput({ agentId, output }: { agentId: string; output: any }) {
  switch (agentId) {
    case "brand-analyzer":
      return (
        <div className="space-y-6">
          {output.brandPersonality && (
            <div>
              <h3 className="font-semibold mb-3">Brand Personality</h3>
              <div className="flex flex-wrap gap-2">
                {output.brandPersonality.map((trait: string) => (
                  <span key={trait} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
          {output.toneAttributes && (
            <div>
              <h3 className="font-semibold mb-3">Tone Attributes</h3>
              <div className="flex flex-wrap gap-2">
                {output.toneAttributes.map((attr: string) => (
                  <span key={attr} className="px-3 py-1.5 rounded-lg bg-muted text-sm">
                    {attr}
                  </span>
                ))}
              </div>
            </div>
          )}
          {output.visualStyle && (
            <div>
              <h3 className="font-semibold mb-3">Visual Style</h3>
              <p className="text-foreground-muted">{output.visualStyle}</p>
            </div>
          )}
          {output.targetAudience && (
            <div>
              <h3 className="font-semibold mb-3">Target Audience</h3>
              <p className="text-foreground-muted">{output.targetAudience}</p>
            </div>
          )}
        </div>
      )

    case "strategist":
      return (
        <div className="space-y-6">
          {output.contentType && (
            <div>
              <h3 className="font-semibold mb-2">Content Type</h3>
              <p className="text-foreground-muted capitalize">{output.contentType}</p>
            </div>
          )}
          {output.objective && (
            <div>
              <h3 className="font-semibold mb-2">Objective</h3>
              <p className="text-foreground-muted">{output.objective}</p>
            </div>
          )}
          {output.keyMessage && (
            <div>
              <h3 className="font-semibold mb-2">Key Message</h3>
              <p className="text-foreground-muted">{output.keyMessage}</p>
            </div>
          )}
          {output.callToAction && (
            <div>
              <h3 className="font-semibold mb-2">Call to Action</h3>
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="text-primary font-medium">{output.callToAction}</p>
              </div>
            </div>
          )}
        </div>
      )

    case "copywriter":
      return (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Generated Caption</h3>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-foreground leading-relaxed">{output.caption}</p>
            </div>
          </div>
          {output.cta && (
            <div>
              <h3 className="font-semibold mb-3">Call to Action</h3>
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="text-primary font-medium">{output.cta}</p>
              </div>
            </div>
          )}
          {output.hashtags && output.hashtags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {output.hashtags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {output.hooks && output.hooks.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Alternative Opening Hooks</h3>
              <div className="space-y-2">
                {output.hooks.map((hook: string, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-muted text-sm">
                    {hook}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )

    case "image-gen":
      return (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Generated Image</h3>
            <img
              src={output.imageUrl || "/placeholder.svg"}
              alt="Generated content"
              className="w-full rounded-lg border border-border"
            />
          </div>
          {output.prompt && (
            <div>
              <h3 className="font-semibold mb-3">Image Prompt</h3>
              <p className="text-sm text-foreground-muted">{output.prompt}</p>
            </div>
          )}
          {output.aspectRatio && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Aspect Ratio</h4>
              <p className="text-sm text-foreground-muted">{output.aspectRatio}</p>
            </div>
          )}
        </div>
      )

    case "optimizer":
      return (
        <div className="space-y-4">
          <h3 className="font-semibold mb-3">Platform Optimizations</h3>
          {output.platforms &&
            Object.entries(output.platforms).map(([platform, data]: [string, any]) => (
              <div key={platform} className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold capitalize">{platform}</h4>
                  {data.hashtags && (
                    <div className="text-xs text-foreground-muted">
                      {Array.isArray(data.hashtags) ? data.hashtags.length : 0} hashtags
                    </div>
                  )}
                </div>
                {data.caption && <p className="text-sm text-foreground-muted mb-3">{data.caption}</p>}
                {data.hashtags && Array.isArray(data.hashtags) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {data.hashtags.map((tag: string) => (
                      <span key={tag} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )

    case "qa":
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className={`text-5xl font-bold mb-2 ${output.passed ? "text-green-600" : "text-orange-600"}`}>
              {output.overallScore}%
            </div>
            <p className="text-foreground-muted">Quality Score</p>
            <div
              className={`inline-block px-4 py-2 rounded-full mt-2 ${output.passed ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
            >
              {output.passed ? "Passed" : "Needs Improvement"}
            </div>
          </div>
          {output.checks && (
            <div>
              <h3 className="font-semibold mb-3">Quality Checks</h3>
              <div className="space-y-3">
                {Object.entries(output.checks).map(([checkName, check]: [string, any]) => (
                  <div key={checkName} className="p-4 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {checkName.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{check.score}%</span>
                        {check.passed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                    </div>
                    {check.feedback && <p className="text-sm text-foreground-muted">{check.feedback}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )

    default:
      return <pre className="text-sm overflow-auto p-4 bg-muted rounded-lg">{JSON.stringify(output, null, 2)}</pre>
  }
}

function FinalResultsView({
  results,
  brandData,
  contentRequest,
}: {
  results: any
  brandData: any
  contentRequest: any
}) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("original")
  const [isDownloading, setIsDownloading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const imageData = results["image-gen"]
  const copyData = results["copywriter"]
  const optimizerData = results["optimizer"]
  const qaData = results["qa"]

  const currentContent =
    selectedPlatform === "original" ? copyData : optimizerData?.platforms?.[selectedPlatform] || copyData

  const aspectRatios: Record<string, string> = {
    original: "aspect-square",
    instagram: "aspect-square",
    twitter: "aspect-video",
    linkedin: "aspect-[1.91/1]",
  }

  async function handleDownload() {
    setIsDownloading(true)
    try {
      const response = await fetch("/api/content/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageData?.imageUrl,
          caption: currentContent?.caption,
          hashtags: currentContent?.hashtags,
          cta: currentContent?.cta,
          platform: selectedPlatform,
          brandName: brandData.name,
        }),
      })

      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${brandData.name}-${selectedPlatform}-content.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Download error:", error)
      alert("Failed to download content. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  async function handleUpload() {
    setIsUploading(true)
    try {
      const response = await fetch("/api/content/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageData?.imageUrl,
          caption: currentContent?.caption,
          hashtags: currentContent?.hashtags,
          cta: currentContent?.cta,
          platform: selectedPlatform,
          brandName: brandData.name,
          brandData,
          contentRequest,
          allResults: results,
        }),
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      alert(`Content saved successfully! ID: ${data.contentId}`)
    } catch (error) {
      console.error("[v0] Upload error:", error)
      alert("Failed to save content. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-heading font-bold mb-2">Your AI-Generated Content</h1>
        <p className="text-sm md:text-base text-foreground-muted">
          Created for {brandData.name} • {contentRequest.platform}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={handleDownload} disabled={isDownloading} className="gradient-primary text-white" size="lg">
          <Download className="w-5 h-5 mr-2" />
          {isDownloading ? "Downloading..." : "Download Content"}
        </Button>
        <Button onClick={handleUpload} disabled={isUploading} variant="outline" size="lg">
          <Upload className="w-5 h-5 mr-2" />
          {isUploading ? "Saving..." : "Save to Library"}
        </Button>
      </div>

      {qaData && (
        <div className="bg-background rounded-2xl shadow-lg p-4 md:p-6 border border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-base md:text-lg font-semibold mb-1">Quality Score</h3>
              <p className="text-xs md:text-sm text-foreground-muted">AI-verified brand consistency</p>
            </div>
            <div className="text-center sm:text-right">
              <div className={`text-3xl md:text-4xl font-bold ${qaData.passed ? "text-green-600" : "text-orange-600"}`}>
                {qaData.overallScore}%
              </div>
              <div
                className={`inline-block px-3 py-1 rounded-full text-xs md:text-sm mt-1 ${qaData.passed ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
              >
                {qaData.passed ? "Passed" : "Needs Review"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-background rounded-2xl shadow-lg border border-border overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-0">
          <div className="bg-muted p-6 md:p-8 flex items-center justify-center">
            {imageData?.imageUrl ? (
              <div
                className={`w-full max-w-md ${aspectRatios[selectedPlatform] || "aspect-square"} overflow-hidden rounded-lg shadow-lg`}
              >
                <img
                  src={imageData.imageUrl || "/placeholder.svg"}
                  alt="Generated content"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full max-w-md aspect-square bg-background rounded-lg flex items-center justify-center">
                <ImageIcon className="w-12 h-12 md:w-16 md:h-16 text-foreground-muted" />
              </div>
            )}
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Viewing</h4>
              <div className="inline-block px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium capitalize">
                {selectedPlatform === "original" ? "Original Version" : selectedPlatform}
              </div>
            </div>

            <h3 className="text-xl md:text-2xl font-semibold mb-4">Caption</h3>
            {currentContent?.caption && (
              <div className="p-4 rounded-lg bg-muted mb-6">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{currentContent.caption}</p>
              </div>
            )}

            {currentContent?.cta && (
              <div className="mb-6">
                <h4 className="text-sm md:text-base font-semibold mb-2">Call to Action</h4>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-primary font-medium">{currentContent.cta}</p>
                </div>
              </div>
            )}

            {currentContent?.hashtags && currentContent.hashtags.length > 0 && (
              <div>
                <h4 className="text-sm md:text-base font-semibold mb-2">Hashtags</h4>
                <div className="flex flex-wrap gap-2">
                  {currentContent.hashtags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {optimizerData?.platforms && (
        <div className="bg-background rounded-2xl shadow-lg p-4 md:p-6 border border-border">
          <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Platform-Optimized Versions</h3>
          <p className="text-xs md:text-sm text-foreground-muted mb-4">
            Click a platform to preview its optimized version
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {Object.entries(optimizerData.platforms).map(([platform, data]: [string, any]) => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedPlatform === platform
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <h4 className="font-semibold capitalize mb-2 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  {platform}
                </h4>
                {data.caption && <p className="text-sm text-foreground-muted mb-3 line-clamp-3">{data.caption}</p>}
                {data.hashtags && Array.isArray(data.hashtags) && data.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {data.hashtags.slice(0, 5).map((tag: string) => (
                      <span key={tag} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                        #{tag}
                      </span>
                    ))}
                    {data.hashtags.length > 5 && (
                      <span className="text-xs px-2 py-1 text-foreground-muted">+{data.hashtags.length - 5} more</span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {copyData?.hooks && copyData.hooks.length > 0 && (
        <div className="bg-background rounded-2xl shadow-lg p-6 md:p-8 border border-border">
          <h3 className="text-xl md:text-2xl font-semibold mb-4">Alternative Opening Hooks</h3>
          <div className="space-y-2">
            {copyData.hooks.map((hook: string, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-muted text-sm">
                {hook}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
