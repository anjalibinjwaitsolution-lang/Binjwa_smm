"use client"

import { useEffect, useState } from "react"

const messages = [
  "Analyzing your brand voice...",
  "Generating engaging captions...",
  "Creating stunning visuals...",
  "Optimizing for each platform...",
]

interface GenerationLoadingStepProps {
  progress?: number
  message?: string
}

export function GenerationLoadingStep({ progress: propProgress, message: propMessage }: GenerationLoadingStepProps) {
  const [simProgress, setSimProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)

  const isControlled = propProgress !== undefined

  useEffect(() => {
    if (isControlled) return

    const progressInterval = setInterval(() => {
      setSimProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2
      })
    }, 50)

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 1500)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
    }
  }, [isControlled])

  const progress = isControlled ? propProgress : simProgress
  const displayMessage = isControlled ? propMessage : messages[messageIndex]

  return (
    <div className="bg-background rounded-2xl shadow-sm p-16">
      <div className="max-w-md mx-auto text-center">
        {/* Animated gradient orb */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 gradient-primary rounded-full animate-pulse opacity-50 blur-xl" />
          <div
            className="absolute inset-0 gradient-primary rounded-full animate-spin"
            style={{ animationDuration: "3s" }}
          />
          <div className="absolute inset-4 bg-background rounded-full flex items-center justify-center">
            <div className="w-16 h-16 gradient-primary rounded-full animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">AI is creating your content...</h2>

        <div className="space-y-4 mb-8 h-8 flex items-center justify-center">
          <p className="text-foreground-muted transition-opacity duration-500 opacity-100">
            {displayMessage}
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-4xl font-heading font-bold gradient-text">{progress}%</div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full gradient-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
