"use client"

import { Upload, Star, Trash2 } from "lucide-react"
import { LogoItem } from "@/app/dashboard/brand-kit/page"
import { useRef } from "react"

interface BrandLogosProps {
  logos: LogoItem[]
  setLogos: React.Dispatch<React.SetStateAction<LogoItem[]>>
}

export function BrandLogos({ logos, setLogos }: BrandLogosProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newLogo: LogoItem = {
          id: `logo-${Date.now()}`,
          url: event.target?.result as string,
          isPrimary: logos.length === 0,
        }
        setLogos([...logos, newLogo])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMakePrimary = (id: string) => {
    setLogos(
      logos.map((logo) => ({
        ...logo,
        isPrimary: logo.id === id,
      }))
    )
  }

  const handleDelete = (id: string) => {
    const target = logos.find((l) => l.id === id)
    const filtered = logos.filter((l) => l.id !== id)
    if (target?.isPrimary && filtered.length > 0) {
      filtered[0].isPrimary = true
    }
    setLogos(filtered)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="bg-background rounded-2xl shadow-sm p-6">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Your Logos</h2>

      {/* Invisible file input */}
      <input
        type="file"
        id="brand-logo-file-input"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      <div
        onClick={triggerFileInput}
        className="border-2 border-dashed border-primary rounded-xl p-8 text-center hover:bg-primary/5 transition-colors cursor-pointer mb-6"
      >
        <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
        <p className="text-foreground font-medium mb-1">Drop your logo here or click to browse</p>
        <p className="text-sm text-foreground-muted">PNG, JPG or SVG (max 5MB)</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {logos.map((logo) => (
          <div
            key={logo.id}
            className={`relative aspect-square bg-background-subtle rounded-lg border-2 p-4 group hover:border-primary transition-all ${
              logo.isPrimary ? "border-primary ring-2 ring-primary/20" : "border-border"
            }`}
          >
            <img src={logo.url} alt="Brand logo" className="object-contain p-2 w-full h-full" />

            {logo.isPrimary && (
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
            )}

            <div className="absolute inset-0 bg-foreground/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {!logo.isPrimary && (
                <button
                  onClick={() => handleMakePrimary(logo.id)}
                  className="w-8 h-8 rounded-full bg-background flex items-center justify-center hover:bg-background/90"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleDelete(logo.id)}
                className="w-8 h-8 rounded-full bg-error flex items-center justify-center hover:bg-error/90"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ))}
        <div
          onClick={triggerFileInput}
          className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
        >
          <Upload className="w-8 h-8 text-foreground-muted" />
        </div>
      </div>
    </div>
  )
}
