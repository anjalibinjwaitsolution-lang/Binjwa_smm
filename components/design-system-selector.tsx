"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Palette, Type, Sparkles, LinkIcon } from "lucide-react"

interface DesignSystemData {
  referenceUrl?: string
  fontPrimary: string
  fontSecondary: string
  colorScheme: string
  designStyle: string
  customColors?: string[]
}

interface DesignSystemSelectorProps {
  value: DesignSystemData
  onChange: (data: DesignSystemData) => void
}

const FONT_OPTIONS = [
  { value: "inter", label: "Inter (Modern Sans)" },
  { value: "plus-jakarta-sans", label: "Plus Jakarta Sans (Friendly)" },
  { value: "poppins", label: "Poppins (Geometric)" },
  { value: "montserrat", label: "Montserrat (Clean)" },
  { value: "roboto", label: "Roboto (Classic)" },
  { value: "playfair-display", label: "Playfair Display (Elegant Serif)" },
  { value: "merriweather", label: "Merriweather (Readable Serif)" },
  { value: "space-grotesk", label: "Space Grotesk (Tech)" },
]

const COLOR_SCHEMES = [
  { value: "purple-pink", label: "Purple & Pink (Creative)", colors: ["#8b5cf6", "#ec4899"] },
  { value: "blue-cyan", label: "Blue & Cyan (Tech)", colors: ["#3b82f6", "#06b6d4"] },
  { value: "orange-red", label: "Orange & Red (Bold)", colors: ["#f97316", "#ef4444"] },
  { value: "green-teal", label: "Green & Teal (Fresh)", colors: ["#10b981", "#14b8a6"] },
  { value: "indigo-purple", label: "Indigo & Purple (Professional)", colors: ["#6366f1", "#8b5cf6"] },
  { value: "rose-pink", label: "Rose & Pink (Elegant)", colors: ["#f43f5e", "#ec4899"] },
  { value: "custom", label: "Custom Colors", colors: [] },
]

const DESIGN_STYLES = [
  { value: "modern", label: "Modern", description: "Clean lines, bold typography, gradient accents" },
  { value: "minimal", label: "Minimal", description: "Simple, spacious, monochromatic" },
  { value: "bold", label: "Bold", description: "High contrast, vibrant colors, strong shapes" },
  { value: "elegant", label: "Elegant", description: "Refined, sophisticated, serif fonts" },
  { value: "playful", label: "Playful", description: "Rounded corners, bright colors, fun elements" },
  { value: "tech", label: "Tech", description: "Futuristic, geometric, neon accents" },
]

export default function DesignSystemSelector({ value, onChange }: DesignSystemSelectorProps) {
  const [showCustomColors, setShowCustomColors] = useState(value.colorScheme === "custom")

  const handleColorSchemeChange = (scheme: string) => {
    const selectedScheme = COLOR_SCHEMES.find((s) => s.value === scheme)
    setShowCustomColors(scheme === "custom")

    onChange({
      ...value,
      colorScheme: scheme,
      customColors: selectedScheme?.colors.length ? selectedScheme.colors : value.customColors,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-orange to-accent-green flex items-center justify-center">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white">Design System</h3>
      </div>

      {/* Reference URL */}
      <div className="space-y-2">
        <Label htmlFor="referenceUrl" className="flex items-center gap-2 text-white">
          <LinkIcon className="w-4 h-4" />
          Design Reference URL (Optional)
        </Label>
        <Input
          id="referenceUrl"
          type="url"
          value={value.referenceUrl || ""}
          onChange={(e) => onChange({ ...value, referenceUrl: e.target.value })}
          placeholder="https://example.com/design-inspiration"
          className="font-mono text-sm bg-background-input text-white"
        />
        <p className="text-xs text-foreground-muted">
          Paste a URL to a website or design you'd like to reference for inspiration
        </p>
      </div>

      {/* Typography */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fontPrimary" className="flex items-center gap-2 text-white">
            <Type className="w-4 h-4" />
            Heading Font
          </Label>
          <Select value={value.fontPrimary} onValueChange={(v) => onChange({ ...value, fontPrimary: v })}>
            <SelectTrigger id="fontPrimary" className="bg-background-input text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fontSecondary" className="text-white">
            Body Font
          </Label>
          <Select value={value.fontSecondary} onValueChange={(v) => onChange({ ...value, fontSecondary: v })}>
            <SelectTrigger id="fontSecondary" className="bg-background-input text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Color Scheme */}
      <div className="space-y-2">
        <Label htmlFor="colorScheme" className="text-white">
          Color Scheme
        </Label>
        <Select value={value.colorScheme} onValueChange={handleColorSchemeChange}>
          <SelectTrigger id="colorScheme" className="bg-background-input text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLOR_SCHEMES.map((scheme) => (
              <SelectItem key={scheme.value} value={scheme.value}>
                <div className="flex items-center gap-2">
                  {scheme.colors.length > 0 && (
                    <div className="flex gap-1">
                      {scheme.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                  <span>{scheme.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Colors */}
      {showCustomColors && (
        <div className="space-y-2">
          <Label className="text-white">Custom Colors</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                type="color"
                value={value.customColors?.[0] || "#8b5cf6"}
                onChange={(e) =>
                  onChange({
                    ...value,
                    customColors: [e.target.value, value.customColors?.[1] || "#ec4899"],
                  })
                }
                className="h-14 w-full"
              />
              <p className="text-xs text-foreground-muted mt-2">Primary</p>
            </div>
            <div>
              <Input
                type="color"
                value={value.customColors?.[1] || "#ec4899"}
                onChange={(e) =>
                  onChange({
                    ...value,
                    customColors: [value.customColors?.[0] || "#8b5cf6", e.target.value],
                  })
                }
                className="h-14 w-full"
              />
              <p className="text-xs text-foreground-muted mt-2">Secondary</p>
            </div>
          </div>
        </div>
      )}

      {/* Design Style */}
      <div className="space-y-2">
        <Label htmlFor="designStyle" className="flex items-center gap-2 text-white">
          <Sparkles className="w-4 h-4" />
          Design Style
        </Label>
        <Select value={value.designStyle} onValueChange={(v) => onChange({ ...value, designStyle: v })}>
          <SelectTrigger id="designStyle" className="bg-background-input text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DESIGN_STYLES.map((style) => (
              <SelectItem key={style.value} value={style.value}>
                <div>
                  <div className="font-medium">{style.label}</div>
                  <div className="text-xs text-foreground-muted">{style.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preview */}
      <div className="p-6 rounded-xl border border-border bg-background-card">
        <p className="text-sm font-semibold mb-4 text-white">Design Preview</p>
        <div className="flex flex-wrap items-center gap-4">
          {(value.customColors || COLOR_SCHEMES.find((s) => s.value === value.colorScheme)?.colors || []).map(
            (color, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border border-white/20 shadow-lg flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-mono text-foreground-muted">{color}</span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
