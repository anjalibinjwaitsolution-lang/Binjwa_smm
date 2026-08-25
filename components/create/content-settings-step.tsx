"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PlatformIcon } from "@/components/ui/platform-icon"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Sparkles } from "lucide-react"
import { InlineAccountSelector } from "@/components/create/inline-account-selector"

interface ContentSettingsStepProps {
  formData: any
  setFormData: (data: any) => void
  onNext: () => void
  onBack: () => void
  connectedAccounts: any[]
  selectedAccountIds: Record<string, string[]>
  setSelectedAccountIds: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
}

const platforms = [
  { id: "instagram", name: "Instagram" },
  { id: "facebook", name: "Facebook" },
  { id: "twitter", name: "Twitter" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "youtube", name: "YouTube" },
  { id: "threads", name: "Threads" },
  { id: "pinterest", name: "Pinterest" },
  { id: "whatsapp", name: "WhatsApp" },
  { id: "bluesky", name: "Bluesky" },
  { id: "tiktok", name: "TikTok" },
]

const tones = ["Professional", "Casual", "Inspirational", "Playful", "Educational"]

export function ContentSettingsStep({ 
  formData, 
  setFormData, 
  onNext, 
  onBack,
  connectedAccounts,
  selectedAccountIds,
  setSelectedAccountIds
}: ContentSettingsStepProps) {
  const togglePlatform = (platformId: string) => {
    const platforms = formData.platforms.includes(platformId)
      ? formData.platforms.filter((p: string) => p !== platformId)
      : [...formData.platforms, platformId]
    setFormData({ ...formData, platforms })
  }

  return (
    <div className="bg-background rounded-2xl shadow-sm p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">What do you want to create?</h1>
        <p className="text-foreground-muted">Describe your content idea</p>
      </div>

      <div className="space-y-8 max-w-3xl">
        {/* Content Topic */}
        <div className="space-y-2">
          <Label htmlFor="topic">What's this post about?</Label>
          <Textarea
            id="topic"
            placeholder="e.g., Launch of our new eco-friendly product line..."
            className="h-40 rounded-xl resize-none"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            maxLength={300}
          />
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" className="text-primary border-primary bg-transparent">
              <Sparkles className="w-4 h-4 mr-2" />
              Get AI Suggestions
            </Button>
            <span className="text-xs text-foreground-muted">{formData.topic.length}/300</span>
          </div>
        </div>

        {/* Platforms */}
        <div className="space-y-3">
          <Label>Select Platforms</Label>
          <div className="grid grid-cols-5 gap-4">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={`aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 p-4 ${
                  formData.platforms.includes(platform.id)
                    ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <PlatformIcon platform={platform.id} className="w-8 h-8 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs font-medium text-foreground">{platform.name}</span>
              </button>
            ))}
          </div>
          <InlineAccountSelector 
            selectedPlatforms={formData.platforms}
            allAccounts={connectedAccounts}
            selectedAccountIds={selectedAccountIds}
            setSelectedAccountIds={setSelectedAccountIds}
          />
        </div>

        {/* Tone */}
        <div className="space-y-3">
          <Label>Tone</Label>
          <div className="flex flex-wrap gap-3">
            {tones.map((tone) => (
              <button
                key={tone}
                onClick={() => setFormData({ ...formData, tone })}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  formData.tone === tone
                    ? "gradient-primary text-white shadow-lg"
                    : "bg-background-subtle text-foreground hover:bg-background-muted"
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <Label>Options</Label>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-background-subtle">
              <div>
                <div className="font-medium text-foreground">Include hashtags</div>
                <div className="text-sm text-foreground-muted">Add relevant hashtags to your posts</div>
              </div>
              <Switch
                checked={formData.includeHashtags}
                onCheckedChange={(checked) => setFormData({ ...formData, includeHashtags: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-background-subtle">
              <div>
                <div className="font-medium text-foreground">Add call-to-action</div>
                <div className="text-sm text-foreground-muted">Include a CTA in your captions</div>
              </div>
              <Switch
                checked={formData.includeCTA}
                onCheckedChange={(checked) => setFormData({ ...formData, includeCTA: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-background-subtle">
              <div>
                <div className="font-medium text-foreground">Generate multiple variations</div>
                <div className="text-sm text-foreground-muted">Create 3 different versions to choose from</div>
              </div>
              <Switch
                checked={formData.generateVariations}
                onCheckedChange={(checked) => setFormData({ ...formData, generateVariations: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button onClick={onBack} variant="ghost" className="h-14 px-8 rounded-xl text-lg">
          ← Back
        </Button>
        <Button onClick={onNext} className="btn-gradient h-14 px-8 rounded-xl text-lg">
          Generate with AI →
        </Button>
      </div>
    </div>
  )
}
