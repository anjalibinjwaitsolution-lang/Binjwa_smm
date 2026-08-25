"use client"

import { Upload, FileText, Download, Trash2 } from "lucide-react"
import { GuidelineFile } from "@/app/dashboard/brand-kit/page"
import { useRef } from "react"

interface BrandGuidelinesProps {
  guidelines: GuidelineFile[]
  setGuidelines: React.Dispatch<React.SetStateAction<GuidelineFile[]>>
}

export function BrandGuidelines({ guidelines, setGuidelines }: BrandGuidelinesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const newGuide: GuidelineFile = {
        id: `guide-${Date.now()}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      }
      setGuidelines([...guidelines, newGuide])
    }
  }

  const handleDelete = (id: string) => {
    setGuidelines(guidelines.filter((g) => g.id !== id))
  }

  const handleDownload = (name: string) => {
    alert(`Downloading ${name}...`)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="bg-background rounded-2xl shadow-sm p-6">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Brand Guidelines</h2>

      {/* Invisible file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        style={{ display: "none" }}
      />

      <div
        onClick={triggerFileInput}
        className="border-2 border-dashed border-primary rounded-xl p-8 text-center hover:bg-primary/5 transition-colors cursor-pointer mb-6"
      >
        <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
        <p className="text-foreground font-medium mb-1">Upload brand guidelines (PDF)</p>
        <p className="text-sm text-foreground-muted">Max 10MB per file</p>
      </div>

      <div className="space-y-3">
        {guidelines.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-background-subtle hover:bg-background-muted transition-colors group"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate">{file.name}</div>
              <div className="text-sm text-foreground-muted">
                {file.size} • {file.date}
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDownload(file.name)}
                className="w-9 h-9 rounded-lg bg-background hover:bg-background-subtle flex items-center justify-center cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(file.id)}
                className="w-9 h-9 rounded-lg bg-error/10 hover:bg-error/20 flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-error" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
