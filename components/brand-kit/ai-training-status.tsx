"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, AlertCircle, RefreshCw } from "lucide-react"
import { LogoItem } from "@/app/dashboard/brand-kit/page"

interface AITrainingStatusProps {
  logos: LogoItem[]
  colors: string[]
  voice: string
  primaryFont: string
  secondaryFont: string
}

const trainingMessages = [
  "Reading brand logos...",
  "Extracting color schemes...",
  "Analyzing typography style...",
  "Encoding brand voice & tone guidelines...",
  "Indexing PDF style manuals...",
  "Compiling personalized brand intelligence..."
]

export function AITrainingStatus({
  logos,
  colors,
  voice,
  primaryFont,
  secondaryFont,
}: AITrainingStatusProps) {
  const [isTraining, setIsTraining] = useState(false)
  const [simProgress, setSimProgress] = useState(0)
  const [trainingMessage, setTrainingMessage] = useState("")
  const [isTrained, setIsTrained] = useState(false)

  const checklist = [
    { label: "Logo uploaded", completed: logos.length > 0 },
    { label: "Colors defined", completed: colors.length > 0 },
    { label: "Voice documented", completed: voice.trim().length > 0 },
    { label: "Typography set", completed: !!primaryFont && !!secondaryFont },
  ]

  const actualProgress = Math.round((checklist.filter((item) => item.completed).length / checklist.length) * 100)

  useEffect(() => {
    let interval: NodeJS.Timeout
    let messageInterval: NodeJS.Timeout

    if (isTraining) {
      setSimProgress(0)
      setTrainingMessage(trainingMessages[0])

      interval = setInterval(() => {
        setSimProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsTraining(false)
            setIsTrained(true)
            return 100
          }
          return prev + 5
        })
      }, 200)

      let messageIndex = 1
      messageInterval = setInterval(() => {
        if (messageIndex < trainingMessages.length) {
          setTrainingMessage(trainingMessages[messageIndex])
          messageIndex++
        }
      }, 800)
    }

    return () => {
      clearInterval(interval)
      clearInterval(messageInterval)
    }
  }, [isTraining])

  const handleTrainAI = () => {
    setIsTraining(true)
    setIsTrained(false)
  }

  const displayProgress = isTraining ? simProgress : actualProgress

  return (
    <div className="bg-gradient-to-br from-secondary to-primary rounded-2xl shadow-xl p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-heading font-bold mb-2">
          {isTraining
            ? `AI Training: ${simProgress}%`
            : isTrained
              ? "AI Training: 100% Complete ✓"
              : `AI Brand Training: ${actualProgress}% Complete`}
        </h2>
        <p className="text-white/90 mb-6">
          {isTraining
            ? trainingMessage
            : isTrained
              ? "AI is fully trained and ready to create on-brand copy and assets!"
              : "Help AI understand your brand better by completing all sections"}
        </p>

        <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${displayProgress}%` }}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {checklist.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              {item.completed ? (
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={handleTrainAI}
          disabled={isTraining || actualProgress === 0}
          className="w-full md:w-auto bg-white text-black hover:bg-white/90 h-14 px-8 rounded-xl text-lg font-semibold shadow-lg transition-all"
        >
          {isTraining ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Training Model...
            </>
          ) : isTrained ? (
            "Model Active & Loaded ✓"
          ) : (
            "Train AI on All Assets"
          )}
        </Button>
      </div>
    </div>
  )
}
