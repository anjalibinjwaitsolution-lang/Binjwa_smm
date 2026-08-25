"use client"

import { useState } from "react"
import AgentOrchestrator from "@/components/agents/agent-orchestrator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles } from "lucide-react"
import { checkQuota } from "@/lib/api"
import DesignSystemSelector from "@/components/design-system-selector"

export default function CreateAIPage() {
  const [isStarted, setIsStarted] = useState(false)
  const [brandData, setBrandData] = useState({
    name: "binj.Ai",
    colors: ["#8b5cf6", "#ec4899"],
    voice: "Professional, innovative, and creative",
  })
  const [contentRequest, setContentRequest] = useState({
    platform: "instagram",
    topic: "AI-powered social media content creation",
    tone: "exciting",
  })

  const [designSystem, setDesignSystem] = useState<{
    fontPrimary: string
    fontSecondary: string
    colorScheme: string
    designStyle: string
    customColors?: string[]
    referenceUrl?: string
  }>({
    fontPrimary: "plus-jakarta-sans",
    fontSecondary: "inter",
    colorScheme: "purple-pink",
    designStyle: "modern",
    customColors: ["#8b5cf6", "#ec4899"],
  })

  if (isStarted) {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <AgentOrchestrator
          brandData={{
            ...brandData,
            designSystem,
          }}
          contentRequest={contentRequest}
          onCancel={() => setIsStarted(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent-orange to-accent-green flex items-center justify-center shadow-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-white">AI Content Studio</h1>
          <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
            Let our AI agents create stunning social media content for your brand
          </p>
        </div>

        <div className="bg-background-card rounded-3xl border border-border p-8 lg:p-10 space-y-10">
          {/* Brand Information */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Brand Information</h2>

            <div className="space-y-2">
              <Label htmlFor="brandName" className="text-white">
                Brand Name
              </Label>
              <Input
                id="brandName"
                value={brandData.name}
                onChange={(e) => setBrandData({ ...brandData, name: e.target.value })}
                placeholder="Your Brand Name"
                className="bg-background-input text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandVoice" className="text-white">
                Brand Voice & Tone
              </Label>
              <Textarea
                id="brandVoice"
                value={brandData.voice}
                onChange={(e) => setBrandData({ ...brandData, voice: e.target.value })}
                placeholder="Describe your brand's personality and tone..."
                rows={3}
                className="bg-background-input text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Brand Colors</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    type="color"
                    value={brandData.colors[0]}
                    onChange={(e) => setBrandData({ ...brandData, colors: [e.target.value, brandData.colors[1]] })}
                    className="h-12 w-full"
                  />
                  <p className="text-xs text-foreground-muted mt-1">Primary Color</p>
                </div>
                <div>
                  <Input
                    type="color"
                    value={brandData.colors[1]}
                    onChange={(e) => setBrandData({ ...brandData, colors: [brandData.colors[0], e.target.value] })}
                    className="h-12 w-full"
                  />
                  <p className="text-xs text-foreground-muted mt-1">Secondary Color</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <DesignSystemSelector value={designSystem} onChange={setDesignSystem} />
          </div>

          {/* Content Request */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Content Details</h2>

            <div className="space-y-2">
              <Label htmlFor="platform" className="text-white">
                Target Platform
              </Label>
              <Select
                value={contentRequest.platform}
                onValueChange={(value) => setContentRequest({ ...contentRequest, platform: value })}
              >
                <SelectTrigger id="platform" className="bg-background-input text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter / X</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="threads">Threads</SelectItem>
                  <SelectItem value="pinterest">Pinterest</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="bluesky">Bluesky</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic" className="text-white">
                Content Topic
              </Label>
              <Input
                id="topic"
                value={contentRequest.topic}
                onChange={(e) => setContentRequest({ ...contentRequest, topic: e.target.value })}
                placeholder="What should this post be about?"
                className="bg-background-input text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone" className="text-white">
                Content Tone
              </Label>
              <Select
                value={contentRequest.tone}
                onValueChange={(value) => setContentRequest({ ...contentRequest, tone: value })}
              >
                <SelectTrigger id="tone" className="bg-background-input text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="exciting">Exciting</SelectItem>
                  <SelectItem value="informative">Informative</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                  <SelectItem value="inspirational">Inspirational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={async () => {
              try {
                await checkQuota('AI_CREDIT', 1);
                setIsStarted(true);
              } catch (e: any) {
                alert(e.message || "Quota exceeded");
              }
            }}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-br from-accent-orange to-accent-green text-white"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start AI Generation
          </Button>
        </div>
      </div>
    </div>
  )
}
