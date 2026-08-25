"use client"

import { useState } from "react"
import { BrandKitHeader } from "@/components/brand-kit/brand-kit-header"
import { BrandLogos } from "@/components/brand-kit/brand-logos"
import { BrandColors } from "@/components/brand-kit/brand-colors"
import { BrandTypography } from "@/components/brand-kit/brand-typography"
import { BrandVoice } from "@/components/brand-kit/brand-voice"
import { BrandGuidelines } from "@/components/brand-kit/brand-guidelines"
import { AITrainingStatus } from "@/components/brand-kit/ai-training-status"

export interface LogoItem {
  id: string
  url: string
  isPrimary: boolean
}

export interface GuidelineFile {
  id: string
  name: string
  size: string
  date: string
}

export default function BrandKitPage() {
  const [logos, setLogos] = useState<LogoItem[]>([
    { id: "logo-1", url: "https://placehold.co/150x150/8b5cf6/ffffff?text=Brand+Logo+1", isPrimary: true },
    { id: "logo-2", url: "https://placehold.co/150x150/ec4899/ffffff?text=Logo+2", isPrimary: false },
    { id: "logo-3", url: "https://placehold.co/150x150/3b82f6/ffffff?text=Logo+3", isPrimary: false },
  ])

  const [colors, setColors] = useState<string[]>(["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"])
  const [primaryFont, setPrimaryFont] = useState("plus-jakarta-sans")
  const [secondaryFont, setSecondaryFont] = useState("inter")

  const [voice, setVoice] = useState(
    "We're a friendly, innovative tech company that believes in making complex things simple. Our tone is professional yet approachable, and we love using real-world examples to explain concepts. We avoid jargon and always put our customers first."
  )

  const [guidelines, setGuidelines] = useState<GuidelineFile[]>([
    { id: "guide-1", name: "Brand Guidelines 2024.pdf", size: "2.4 MB", date: "Oct 10, 2024" },
    { id: "guide-2", name: "Social Media Style Guide.pdf", size: "1.8 MB", date: "Oct 5, 2024" },
  ])

  return (
    <div className="space-y-8">
      <BrandKitHeader onUpload={() => document.getElementById("brand-logo-file-input")?.click()} />

      <div className="grid lg:grid-cols-2 gap-6">
        <BrandLogos logos={logos} setLogos={setLogos} />
        <BrandColors colors={colors} setColors={setColors} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <BrandTypography
          primaryFont={primaryFont}
          setPrimaryFont={setPrimaryFont}
          secondaryFont={secondaryFont}
          setSecondaryFont={setSecondaryFont}
        />
        <BrandVoice voice={voice} setVoice={setVoice} />
      </div>

      <BrandGuidelines guidelines={guidelines} setGuidelines={setGuidelines} />

      <AITrainingStatus
        logos={logos}
        colors={colors}
        voice={voice}
        primaryFont={primaryFont}
        secondaryFont={secondaryFont}
      />
    </div>
  )
}
