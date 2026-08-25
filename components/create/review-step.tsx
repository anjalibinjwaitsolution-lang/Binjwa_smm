"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Sparkles, Upload, X, Download, Check, Save, Calendar, Clock } from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { AccountSelectionModal } from "./account-selection-modal"
import { PlatformIcon } from "@/components/ui/platform-icon"

interface ReviewStepProps {
  formData: any
  generatedData: any
  onBack: () => void
}

const platformMetadata: Record<string, { name: string; limit: number }> = {
  instagram: { name: "Instagram", limit: 2200 },
  facebook: { name: "Facebook", limit: 63206 },
  twitter: { name: "Twitter", limit: 280 },
  linkedin: { name: "LinkedIn", limit: 3000 },
  threads: { name: "Threads", limit: 500 },
  pinterest: { name: "Pinterest", limit: 500 },
  whatsapp: { name: "WhatsApp", limit: 1024 },
  bluesky: { name: "Bluesky", limit: 300 },
  tiktok: { name: "TikTok", limit: 2200 },
}

export function ReviewStep({ formData, generatedData, onBack }: ReviewStepProps) {
  const selectedPlatforms = formData?.platforms?.length > 0 ? formData.platforms : ["instagram"]
  const [activePlatform, setActivePlatform] = useState<string>(selectedPlatforms[0])
  const [platformData, setPlatformData] = useState<Record<string, { caption: string; hashtags: string[] }>>({})
  const [newHashtag, setNewHashtag] = useState("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  
  const [isAccountSelectOpen, setIsAccountSelectOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(() => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, "0")
    const d = String(today.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  })
  const [scheduleTime, setScheduleTime] = useState("12:00")

  // Initialize data from API response
  useEffect(() => {
    if (generatedData) {
      const initial: Record<string, { caption: string; hashtags: string[] }> = {}
      selectedPlatforms.forEach((p: string) => {
        const opt = generatedData.optimizer?.platforms?.[p] || generatedData.optimizer?.platforms?.[p.toLowerCase()]
        if (opt) {
          initial[p] = {
            caption: opt.caption || "",
            hashtags: opt.hashtags || [],
          }
        } else {
          initial[p] = {
            caption: generatedData.copy?.caption || "",
            hashtags: generatedData.copy?.hashtags || [],
          }
        }
      })
      setPlatformData(initial)

      if (generatedData.image?.imageUrl) {
        setImageUrl(generatedData.image.imageUrl)
      }
    }
  }, [generatedData, formData])

  const activeData = platformData[activePlatform] || { caption: "", hashtags: [] }
  const currentMetadata = platformMetadata[activePlatform] || { name: activePlatform, limit: 2200 }

  const handleCaptionChange = (val: string) => {
    setPlatformData({
      ...platformData,
      [activePlatform]: {
        ...activeData,
        caption: val,
      },
    })
  }

  const handleRemoveHashtag = (tagIndex: number) => {
    const updatedTags = activeData.hashtags.filter((_, i) => i !== tagIndex)
    setPlatformData({
      ...platformData,
      [activePlatform]: {
        ...activeData,
        hashtags: updatedTags,
      },
    })
  }

  const handleAddHashtag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newHashtag.trim()) {
      e.preventDefault()
      const tag = newHashtag.trim().replace(/^#/, "")
      if (!activeData.hashtags.includes(tag)) {
        setPlatformData({
          ...platformData,
          [activePlatform]: {
            ...activeData,
            hashtags: [...activeData.hashtags, tag],
          },
        })
      }
      setNewHashtag("")
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch("/api/content/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          caption: activeData.caption,
          hashtags: activeData.hashtags,
          cta: generatedData?.copy?.cta || "",
          platform: activePlatform,
          brandName: "My Brand",
        }),
      })

      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `my-brand-${activePlatform}-content.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download error:", error)
      alert("Failed to download ZIP file.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePublishClick = () => {
    setIsAccountSelectOpen(true)
  }

  const handleConfirmPublish = (accountsToPublish: any[]) => {
    setIsAccountSelectOpen(false)
    if (accountsToPublish.length > 0) {
      handleSave("published", accountsToPublish)
    }
  }

  const handleSave = async (status: "draft" | "published" | "scheduled", accountsToPublish?: any[]) => {
    setIsSaving(true)
    setSaveStatus(null)
    let hasError = false
    try {
      const platformPostIds: Record<string, string> = {}

      if (status === "published" || status === "scheduled") {
        const accountsList = accountsToPublish && accountsToPublish.length > 0 ? accountsToPublish : [{ platform: activePlatform.toLowerCase() }]
        
        // Ensure account has an ID for publishing
        for (const acc of accountsList) {
          if (!acc.id) {
            acc.id = `default_${acc.platform}`
          }
        }

        let scheduledPublishTime: number | undefined = undefined;
        if (status === "scheduled" && scheduleDate && scheduleTime) {
          scheduledPublishTime = Math.floor(new Date(`${scheduleDate}T${scheduleTime}`).getTime() / 1000);
        }
        for (const acc of accountsList) {
          const p = acc.platform.toLowerCase()
          const pData = platformData[p] || activeData
          if (['linkedin', 'facebook', 'twitter', 'instagram', 'youtube', 'threads', 'pinterest', 'whatsapp', 'bluesky', 'tiktok'].includes(p)) {
            try {
              const postRes = await fetch(`/api/post/${p}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  caption: pData.caption,
                  imageUrl: imageUrl || undefined,
                  videoUrl: formData?.videoUrl || undefined,
                  authorType: "personal",
                  accountId: acc.id,
                  scheduledPublishTime
                })
              })
              
              if (!postRes.ok) {
                const errData = await postRes.json().catch(()=>({}))
                console.error(`Failed to publish to ${p}:`, errData)
                setSaveStatus((prev) => prev ? `${prev} | Failed: ${p}` : `Failed: ${p}`)
                hasError = true
              } else {
                const postData = await postRes.json()
                if (postData.postId) {
                  platformPostIds[p] = postData.postId
                }
              }
            } catch (err) {
              console.error(`Error publishing to ${p}:`, err)
              setSaveStatus((prev) => prev ? `${prev} | Error: ${p}` : `Error: ${p}`)
              hasError = true
            }
          }
        }
      }

      const response = await fetch("/api/post/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          videoUrl: null,
          caption: activeData.caption,
          hashtags: activeData.hashtags,
          cta: generatedData?.copy?.cta || "",
          platforms: [activePlatform],
          platformSettings: platformPostIds,
          status: status === "draft" ? "Draft" : "pending_approval", // Real API states
          date: status === "scheduled" ? scheduleDate : undefined,
          time: status === "scheduled" ? scheduleTime : undefined,
        }),
      })

      if (!response.ok) throw new Error("Save failed")
      
      const data = await response.json()
      
      // If user wants to publish or schedule, submit for approval
      if (status !== "draft" && data.post?.id) {
         await fetch(`/api/post/${data.post.id}/submit`, { method: "POST" })
      }

      if (!hasError) {
        setSaveStatus(`Success! Content saved to library. ID: ${data.post?.id || 'Draft'}`)
      } else {
        setSaveStatus((prev) => `${prev} | Content saved to library.`)
      }
      setTimeout(() => setSaveStatus(null), 5000)
    } catch (error) {
      console.error("Save error:", error)
      setSaveStatus("Failed to save content.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[65%_35%] gap-6">
      {/* Left Panel - Preview */}
      <div className="bg-background rounded-2xl shadow-sm p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {selectedPlatforms.map((platform: string) => {
              const meta = platformMetadata[platform] || { name: platform }
              return (
                <button
                  key={platform}
                  onClick={() => setActivePlatform(platform)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                    activePlatform === platform
                      ? "gradient-primary text-white shadow-lg"
                      : "bg-background-subtle text-foreground hover:bg-background-muted"
                  }`}
                >
                  <PlatformIcon platform={platform} className="w-4 h-4 shrink-0" />
                  {meta.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Phone Mockup */}
        <div className="max-w-md mx-auto">
          <div className="bg-background-subtle rounded-3xl shadow-2xl p-4 border-8 border-foreground">
            <div className="bg-background rounded-2xl overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <div className="w-10 h-10 rounded-full gradient-primary" />
                <div>
                  <div className="font-semibold text-foreground">My Brand</div>
                  <div className="text-xs text-foreground-muted">Just now</div>
                </div>
              </div>

              {/* Post Image */}
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                {imageUrl ? (
                  <img src={imageUrl} alt="Post preview" className="object-cover w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-foreground-muted text-sm">
                    No preview available
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <button className="hover:opacity-70">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                  <button className="hover:opacity-70">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </button>
                </div>

                {/* Caption & Hashtags preview */}
                <div className="text-sm space-y-1">
                  <span className="font-semibold">My Brand</span>{" "}
                  <span className="text-foreground-muted whitespace-pre-wrap">{activeData.caption}</span>
                  {activeData.hashtags.length > 0 && (
                    <div className="text-primary font-medium mt-1">
                      {activeData.hashtags.map((tag) => `#${tag}`).join(" ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center space-y-1">
            <div className="text-sm text-foreground-muted">
              {activeData.caption.length}/{currentMetadata.limit} characters
            </div>
            <div className="text-xs text-success">Perfect for {currentMetadata.name}</div>
          </div>
        </div>
      </div>

      {/* Right Panel - Edit Controls */}
      <div className="space-y-6">
        <div className="bg-background rounded-2xl shadow-sm p-6 space-y-6">
          {/* Caption Editor */}
          <div className="space-y-2">
            <Label htmlFor="caption">Edit Caption</Label>
            <Textarea
              id="caption"
              value={activeData.caption}
              onChange={(e) => handleCaptionChange(e.target.value)}
              className="h-48 rounded-xl resize-none"
            />
          </div>

          {/* Hashtags Editor */}
          <div className="space-y-2">
            <Label htmlFor="add-hashtag">Hashtags</Label>
            <Input
              id="add-hashtag"
              placeholder="Type hashtag and press Enter..."
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
              onKeyDown={handleAddHashtag}
              className="rounded-xl h-10"
            />
            <div className="flex flex-wrap gap-2 pt-2">
              {activeData.hashtags.map((tag, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-info/10 text-info font-medium text-sm"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveHashtag(index)}
                    className="hover:bg-info/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div className="bg-background rounded-2xl shadow-sm p-4 space-y-3">
          <Label className="text-white">Schedule Post (Optional)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="bg-background-input text-white border-border rounded-xl pl-10"
              />
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
            </div>
            <div className="relative">
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="bg-background-input text-white border-border rounded-xl pl-10"
              />
              <Clock className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => handleSave("scheduled")}
            disabled={isSaving}
            className="w-full h-12 rounded-xl bg-transparent mt-2 border-primary/50 hover:bg-primary/10"
          >
            <Calendar className="w-4 h-4 mr-2 text-primary" />
            <span className="text-primary">Schedule Post</span>
          </Button>
        </div>

        {/* Action Bar */}
        <div className="bg-background rounded-2xl shadow-sm p-4 space-y-3">
          {saveStatus && (
            <div className={`p-3 rounded-lg text-sm text-center font-medium ${saveStatus.includes("Success") ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              {saveStatus}
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full h-12 rounded-xl bg-transparent"
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? "Downloading ZIP..." : "Download ZIP Content"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave("draft")}
            disabled={isSaving}
            className="w-full h-12 rounded-xl bg-transparent"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={handlePublishClick}
            disabled={isSaving}
            className="w-full h-12 rounded-xl btn-gradient"
          >
            <Check className="w-4 h-4 mr-2" />
            Approve & Publish
          </Button>
          <Button
            variant="ghost"
            onClick={onBack}
            className="w-full h-12 rounded-xl text-foreground-muted"
          >
            ← Back to Settings
          </Button>
        </div>
      </div>

      <AccountSelectionModal 
        isOpen={isAccountSelectOpen}
        onClose={() => setIsAccountSelectOpen(false)}
        onConfirm={handleConfirmPublish}
        targetPlatforms={[activePlatform.toLowerCase()]}
      />
    </div>
  )
}
