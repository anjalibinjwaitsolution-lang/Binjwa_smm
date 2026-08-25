"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface BrandVoiceProps {
  voice: string
  setVoice: (val: string) => void
}

export function BrandVoice({ voice, setVoice }: BrandVoiceProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }, 800)
  }

  return (
    <div className="bg-background rounded-2xl shadow-sm p-6">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Voice & Tone</h2>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brand-voice">Brand Voice</Label>
          <Textarea
            id="brand-voice"
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="h-64 rounded-xl resize-none"
            placeholder="Describe your brand's personality, tone, and communication style..."
            maxLength={1000}
          />
          <div className="flex justify-between text-xs">
            <span className="text-foreground-muted">This helps AI write in your unique style</span>
            <span className="text-foreground-muted">{voice.length}/1000</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Example Prompts</Label>
          <div className="space-y-2">
            <div className="p-3 bg-background-subtle rounded-lg text-sm text-foreground-muted">
              "We speak like a trusted friend who happens to be an expert"
            </div>
            <div className="p-3 bg-background-subtle rounded-lg text-sm text-foreground-muted">
              "Professional but never stuffy, informative but never boring"
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full btn-gradient h-12 rounded-xl font-semibold"
        >
          {isSaving ? "Saving Voice Settings..." : saveSuccess ? "Voice Settings Saved! ✓" : "Save Voice Settings"}
        </Button>
      </div>
    </div>
  )
}
