"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const fonts = ["Inter", "Plus Jakarta Sans", "Poppins", "Montserrat", "Roboto", "Open Sans", "Lato", "Raleway"]

interface BrandTypographyProps {
  primaryFont: string
  setPrimaryFont: (val: string) => void
  secondaryFont: string
  setSecondaryFont: (val: string) => void
}

export function BrandTypography({
  primaryFont,
  setPrimaryFont,
  secondaryFont,
  setSecondaryFont,
}: BrandTypographyProps) {
  // Find correct display font name (defaults to index values if not in list)
  const getFontFamily = (value: string) => {
    const matched = fonts.find(f => f.toLowerCase().replace(/\s+/g, "-") === value)
    return matched || value
  }

  return (
    <div className="bg-background rounded-2xl shadow-sm p-6">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Brand Fonts</h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Primary Font (Headings)</Label>
          <Select value={primaryFont} onValueChange={setPrimaryFont}>
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((font) => (
                <SelectItem key={font} value={font.toLowerCase().replace(/\s+/g, "-")}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="p-4 bg-background-subtle rounded-lg">
            <p className="text-3xl font-heading font-bold" style={{ fontFamily: getFontFamily(primaryFont) }}>Aa Bb Cc</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Secondary Font (Body)</Label>
          <Select value={secondaryFont} onValueChange={setSecondaryFont}>
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((font) => (
                <SelectItem key={font} value={font.toLowerCase().replace(/\s+/g, "-")}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="p-4 bg-background-subtle rounded-lg">
            <p className="text-base" style={{ fontFamily: getFontFamily(secondaryFont) }}>The quick brown fox jumps over the lazy dog</p>
          </div>
        </div>
      </div>
    </div>
  )
}
