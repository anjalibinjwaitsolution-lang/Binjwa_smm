"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Upload, X } from "lucide-react"
import { useState, useRef } from "react"

interface BrandInputsStepProps {
  formData: any
  setFormData: (data: any) => void
  onNext: () => void
}

export function BrandInputsStep({ formData, setFormData, onNext }: BrandInputsStepProps) {
  const [keywordInput, setKeywordInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && keywordInput.trim()) {
      e.preventDefault()
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()],
      })
      setKeywordInput("")
    }
  }

  const handleRemoveKeyword = (index: number) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((_: string, i: number) => i !== index),
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, logo: file })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setFormData({ ...formData, logo: file })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="bg-background rounded-2xl shadow-sm p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Let's understand your brand</h1>
        <p className="text-foreground-muted">Upload your brand assets so AI can match your style</p>
      </div>

      <div className="space-y-8 max-w-3xl">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Brand Logo</Label>
          <div 
            className="border-2 border-dashed border-primary rounded-2xl p-12 text-center hover:bg-primary/5 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/png, image/jpeg, image/svg+xml"
              onChange={handleFileChange}
            />
            <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">Drop your logo here or click to browse</p>
            <p className="text-sm text-foreground-muted">PNG, JPG or SVG (max 5MB)</p>
          </div>
          {formData.logo && (
            <div className="flex items-center gap-2 text-sm text-success">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Logo uploaded: {formData.logo.name || "File selected"}
            </div>
          )}
        </div>

        {/* Brand Voice */}
        <div className="space-y-2">
          <Label htmlFor="brand-voice">How would you describe your brand voice?</Label>
          <Textarea
            id="brand-voice"
            placeholder="We're friendly, professional, and love helping small businesses grow..."
            className="h-32 rounded-xl resize-none"
            value={formData.brandVoice}
            onChange={(e) => setFormData({ ...formData, brandVoice: e.target.value })}
            maxLength={500}
          />
          <div className="flex justify-between text-xs">
            <span className="text-foreground-muted">This helps AI write in your style</span>
            <span className="text-foreground-muted">{formData.brandVoice.length}/500</span>
          </div>
        </div>

        {/* Brand Keywords */}
        <div className="space-y-2">
          <Label htmlFor="keywords">Keywords that represent your brand</Label>
          <div className="space-y-3">
            <Input
              id="keywords"
              type="text"
              placeholder="Type and press enter..."
              className="h-12 rounded-xl"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleAddKeyword}
            />
            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword: string, index: number) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(index)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Brand Colors */}
        <div className="space-y-2">
          <Label>Pick your brand colors</Label>
          <div className="flex gap-4">
            {formData.colors.map((color: string, index: number) => (
              <div key={index} className="relative">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const newColors = [...formData.colors]
                    newColors[index] = e.target.value
                    setFormData({ ...formData, colors: newColors })
                  }}
                  className="w-20 h-20 rounded-full cursor-pointer shadow-md"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={onNext} className="btn-gradient h-14 px-8 rounded-xl text-lg">
          Next: Content Details →
        </Button>
      </div>
    </div>
  )
}
