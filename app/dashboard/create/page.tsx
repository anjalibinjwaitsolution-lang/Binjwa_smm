"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic'
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const WizardProgress = dynamic(() => import("@/components/create/wizard-progress").then(mod => mod.WizardProgress), { 
  loading: () => <Skeleton className="w-full h-12 rounded-xl mb-8" />
})
const BrandInputsStep = dynamic(() => import("@/components/create/brand-inputs-step").then(mod => mod.BrandInputsStep), {
  loading: () => <Skeleton className="w-full h-[400px] rounded-xl" />
})
const ContentSettingsStep = dynamic(() => import("@/components/create/content-settings-step").then(mod => mod.ContentSettingsStep), {
  loading: () => <Skeleton className="w-full h-[400px] rounded-xl" />
})
const GenerationLoadingStep = dynamic(() => import("@/components/create/generation-loading-step").then(mod => mod.GenerationLoadingStep), {
  loading: () => <Skeleton className="w-full h-[400px] rounded-xl" />
})
const ReviewStep = dynamic(() => import("@/components/create/review-step").then(mod => mod.ReviewStep), {
  loading: () => <Skeleton className="w-full h-[600px] rounded-xl" />
})
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { InlineAccountSelector } from "@/components/create/inline-account-selector"
import { Sparkles, PenTool, Upload, X, Calendar, Clock, Check, Video, Film, Youtube } from "lucide-react"
import { checkQuota } from "@/lib/api"
import { AccountSelectionModal } from "@/components/create/account-selection-modal"
import { PlatformIcon } from "@/components/ui/platform-icon"
import {
  callBrandAnalyzer,
  callStrategist,
  callCopywriter,
  callImageGenerator,
  callOptimizer,
  callQualityChecker,
} from "@/lib/api-client"



const ALL_17_PLATFORMS = [
  "Instagram", "Facebook", "Twitter", "LinkedIn", "YouTube", "Threads",
  "Pinterest", "WhatsApp", "Bluesky", "TikTok", "Slack", "Telegram",
  "Discord", "Canva", "Medium", "Reddit", "Twitch", "Kick"
]

export default function CreatePage() {
  const router = useRouter()
  const [creationMode, setCreationMode] = useState<"ai" | "manual" | "reel" | "video">("ai")

  // AI Mode States
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    logo: null,
    brandVoice: "",
    keywords: [] as string[],
    colors: ["#8b5cf6", "#ec4899", "#3b82f6"],
    topic: "",
    platforms: [] as string[],
    tone: "",
    includeHashtags: true,
    includeCTA: true,
    generateVariations: false,
  })

  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState("")
  const [generatedData, setGeneratedData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const totalSteps = 3

  // Manual Mode States
  const [manualCaption, setManualCaption] = useState("")
  const [manualPlatforms, setManualPlatforms] = useState<string[]>(["Instagram"])
  const [isCustomCaptionEnabled, setIsCustomCaptionEnabled] = useState(false)
  const [perPlatformCaptions, setPerPlatformCaptions] = useState<Record<string, string>>({})
  const [selectedCaptionTab, setSelectedCaptionTab] = useState<string>("Instagram")
  const [manualImage, setManualImage] = useState<string>("")
  const [manualDate, setManualDate] = useState(() => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, "0")
    const d = String(today.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  })
  const [manualTime, setManualTime] = useState("12:00")
  const [manualStatus, setManualStatus] = useState("Published")
  const [isSavingManual, setIsSavingManual] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reel Mode States
  const [reelCaption, setReelCaption] = useState("")
  const [reelPlatforms, setReelPlatforms] = useState<string[]>(["Instagram"])
  const [reelVideo, setReelVideo] = useState<string>("")
  const [reelThumbnail, setReelThumbnail] = useState<string>("")
  const [reelDate, setReelDate] = useState(() => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, "0")
    const d = String(today.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  })
  const [reelTime, setReelTime] = useState("12:00")
  const [reelStatus, setReelStatus] = useState("Published")
  const [isSavingReel, setIsSavingReel] = useState(false)
  const [reelSaveSuccess, setReelSaveSuccess] = useState(false)
  
  const reelVideoInputRef = useRef<HTMLInputElement>(null)
  const reelThumbnailInputRef = useRef<HTMLInputElement>(null)

  // Video Mode States
  const [videoCaption, setVideoCaption] = useState("")
  const [videoPlatforms, setVideoPlatforms] = useState<string[]>(["YouTube"])
  const [videoFileUrl, setVideoFileUrl] = useState<string>("")
  const [videoThumbnail, setVideoThumbnail] = useState<string>("")
  const [videoDate, setVideoDate] = useState(() => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, "0")
    const d = String(today.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  })
  const [videoTime, setVideoTime] = useState("12:00")
  const [videoStatus, setVideoStatus] = useState("Published")
  const [isSavingVideo, setIsSavingVideo] = useState(false)
  const [videoSaveSuccess, setVideoSaveSuccess] = useState(false)

  // Account Selection States
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<Record<string, string[]>>({})
  
  // YouTube specific settings
  const [youtubeTitle, setYoutubeTitle] = useState("")
  const [youtubePrivacy, setYoutubePrivacy] = useState("Public")
  const [youtubeAudience, setYoutubeAudience] = useState("Not Made for Kids")
  const [youtubeTags, setYoutubeTags] = useState("")
  const [youtubePlaylist, setYoutubePlaylist] = useState("")

  const videoInputRef = useRef<HTMLInputElement>(null)
  const videoThumbnailInputRef = useRef<HTMLInputElement>(null)



  useEffect(() => {
    setIsMounted(true)
    const fetchConnections = async () => {
      try {
        const res = await fetch("/api/connections")
        if (res.ok) {
          const data = await res.json()
          if (data.accounts) {
            setConnectedAccounts(data.accounts)
            const initialSelected: Record<string, string[]> = {}
            data.accounts.forEach((acc: any) => {
              const plat = acc.platform?.toLowerCase() || ''
              if (plat) {
                if (!initialSelected[plat]) initialSelected[plat] = []
                initialSelected[plat].push(acc.id)
              }
            })
            setSelectedAccountIds(prev => ({ ...initialSelected, ...prev }))
          }
        }
      } catch (e) {
        console.error("Failed to fetch connections:", e)
      }
    }
    fetchConnections()
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setManualImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleGenerateImage = async () => {
    if (!manualCaption.trim()) {
      alert("Please write a caption first to generate an image based on it!")
      return
    }
    
    setIsGeneratingImage(true)
    try {
      const { callImageGenerator } = await import("@/lib/api-client")
      const result = await callImageGenerator({
        caption: manualCaption,
        aspectRatio: "1:1",
      })
      
      if (result && result.imageUrl) {
        setManualImage(result.imageUrl)
      }
    } catch (error: any) {
      console.error("Failed to generate image:", error)
      alert(error.message || "Failed to generate image")
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleReelVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      alert("Video size must be less than 50MB.")
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      if (video.duration > 60) {
        alert("Video duration must be 60 seconds or less.")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setReelVideo(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
    video.src = objectUrl
  }

  const handleReelThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setReelThumbnail(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500 * 1024 * 1024) {
      alert("Video size must be less than 500MB.")
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setVideoFileUrl(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
    video.src = objectUrl
  }

  const handleVideoThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setVideoThumbnail(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }


  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCaption || manualPlatforms.length === 0) {
      alert("Please provide a caption and select at least one platform.")
      return
    }

    executeManualSubmit()
  }

  const executeManualSubmit = async () => {
    setIsSavingManual(true)
    try {
      // Check quota
      try {
        await checkQuota(manualStatus === "Published" ? 'POST_PUBLISHED' : 'POST_SCHEDULED', 1);
      } catch (e: any) {
        alert(e.message || "Quota exceeded");
        setIsSavingManual(false);
        return;
      }

      const platformPostIds: Record<string, string> = {}

      if (manualStatus === "Published" || manualStatus === "Scheduled") {
        let scheduledPublishTime: number | undefined = undefined;
        if (manualStatus === "Scheduled" && manualDate && manualTime) {
          scheduledPublishTime = Math.floor(new Date(`${manualDate}T${manualTime}`).getTime() / 1000);
        }

        // Collect accounts to publish to based on inline selection
        const accountsToPublish: any[] = []
        for (const platform of manualPlatforms) {
          const lower = platform.toLowerCase()
          const platformAccs = connectedAccounts.filter(a => a.platform.toLowerCase() === lower)
          
          if (platformAccs.length === 0) {
             accountsToPublish.push({
               id: `default_${lower}`,
               platform: platform,
               name: `${platform}`
             })
             continue
          }

          if (selectedAccountIds[lower] && selectedAccountIds[lower].length > 0) {
            selectedAccountIds[lower].forEach(id => {
              const acc = connectedAccounts.find(a => a.id === id)
              if (acc) accountsToPublish.push(acc)
            })
          } else {
             if (platformAccs.length >= 1) {
               accountsToPublish.push(platformAccs[0])
             }
          }
        }
          
        if (accountsToPublish.length === 0) {
           alert("No accounts selected for publishing.")
           setIsSavingManual(false)
           return
        }

        for (const acc of accountsToPublish) {
          const platform = acc.platform.toLowerCase()
          if (platform) {
            try {
              const postRes = await fetch(`/api/post/${platform}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  caption: (isCustomCaptionEnabled && perPlatformCaptions[acc.platform]) ? perPlatformCaptions[acc.platform] : manualCaption,
                  imageUrl: manualImage || undefined,
                  authorType: "personal",
                  accountId: acc.id,
                  channelId: acc.id,
                  scheduledPublishTime
                })
              })
              
              if (postRes.ok) {
                const postData = await postRes.json()
                if (postData.postId || postData.id) {
                  platformPostIds[platform] = postData.postId || postData.id
                }
              } else {
                const errData = await postRes.json().catch(()=>({}))
                let errorMsg = errData.error || errData.message || (errData.diagnostics?.cause ? `${errData.diagnostics.cause}` : null) || `Failed to publish to ${platform}`
                if (errData.diagnostics?.howToFix && Array.isArray(errData.diagnostics.howToFix)) {
                  errorMsg += `\n\nHow to Fix:\n${errData.diagnostics.howToFix.join('\n')}`
                }
                console.warn(`Social API publish error for ${platform}:`, errorMsg)
                alert(`${platform.toUpperCase()} Publishing Notice:\n${errorMsg}`)
              }
            } catch (err: any) {
              console.error(`Error publishing to ${platform}:`, err)
              alert(`${platform.toUpperCase()} Publishing Error: ${err.message || err}`)
            }
          }
        }
      }

      const response = await fetch("/api/content/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: manualImage || undefined,
          caption: manualCaption,
          platforms: manualPlatforms,
          status: manualStatus,
          date: manualDate,
          time: manualTime,
          platformPostIds,
        }),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => {
          setSaveSuccess(false)
          router.push("/dashboard/library")
        }, 1500)
      } else {
        alert("Failed to save post.")
      }
    } catch (err) {
      console.error("Failed to create manual post:", err)
      alert("Error saving manual post.")
    } finally {
      setIsSavingManual(false)
    }
  }

  const handleReelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reelCaption || reelPlatforms.length === 0) {
      alert("Please provide a caption and select at least one platform.")
      return
    }
    if (!reelVideo) {
      alert("Please upload a video for your reel.")
      return
    }

    executeReelSubmit()
  }

  const executeReelSubmit = async () => {
    setIsSavingReel(true)
    try {
      // Check quota
      try {
        await checkQuota(reelStatus === "Published" ? 'POST_PUBLISHED' : 'POST_SCHEDULED', 1);
      } catch (e: any) {
        alert(e.message || "Quota exceeded");
        setIsSavingReel(false);
        return;
      }

      const platformPostIds: Record<string, string> = {}

      if (reelStatus === "Published" || reelStatus === "Scheduled") {
        let scheduledPublishTime: number | undefined = undefined;
        if (reelStatus === "Scheduled" && reelDate && reelTime) {
          scheduledPublishTime = Math.floor(new Date(`${reelDate}T${reelTime}`).getTime() / 1000);
        }

        const accountsToPublish: any[] = []
        for (const platform of reelPlatforms) {
          const lower = platform.toLowerCase()
          const platformAccs = connectedAccounts.filter(a => a.platform.toLowerCase() === lower)
          
          if (platformAccs.length === 0) {
             accountsToPublish.push({
               id: `default_${lower}`,
               platform: platform,
               name: `${platform}`
             })
             continue
          }

          if (selectedAccountIds[lower] && selectedAccountIds[lower].length > 0) {
            selectedAccountIds[lower].forEach(id => {
              const acc = connectedAccounts.find(a => a.id === id)
              if (acc) accountsToPublish.push(acc)
            })
          } else {
             if (platformAccs.length >= 1) {
               accountsToPublish.push(platformAccs[0])
             }
          }
        }

        if (accountsToPublish.length === 0) {
           alert("No accounts selected for publishing.")
           setIsSavingReel(false)
           return
        }

        for (const acc of accountsToPublish) {
          const platform = acc.platform.toLowerCase()
          if (platform) {
            try {
              const postRes = await fetch(`/api/post/${platform}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  caption: reelCaption,
                  videoUrl: reelVideo,
                  authorType: "personal",
                  accountId: acc.id,
                  scheduledPublishTime
                })
              })
              
              if (postRes.ok) {
                const postData = await postRes.json()
                if (postData.postId || postData.id) {
                  platformPostIds[platform] = postData.postId || postData.id
                }
              }
            } catch (err) {
              console.error(`Error publishing reel to ${platform}:`, err)
            }
          }
        }
      }

      const response = await fetch("/api/content/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: reelVideo,
          imageUrl: reelThumbnail || undefined,
          caption: reelCaption,
          platforms: reelPlatforms,
          status: reelStatus,
          date: reelDate,
          time: reelTime,
          platformPostIds: platformPostIds,
          youtubeSettings: reelPlatforms.includes("YouTube") ? {
            title: youtubeTitle,
            privacy: youtubePrivacy,
            audience: youtubeAudience,
            tags: youtubeTags,
            playlist: youtubePlaylist
          } : undefined
        }),
      })

      if (response.ok) {
        setReelSaveSuccess(true)
        setTimeout(() => {
          setReelSaveSuccess(false)
          router.push("/dashboard/library")
        }, 1500)
      } else {
        alert("Failed to save reel.")
      }
    } catch (err) {
      console.error("Failed to create reel:", err)
      alert("Error saving reel.")
    } finally {
      setIsSavingReel(false)
    }
  }

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoCaption || videoPlatforms.length === 0) {
      alert("Please provide a caption and select at least one platform.")
      return
    }
    if (!videoFileUrl) {
      alert("Please upload a video.")
      return
    }

    executeVideoSubmit()
  }

  const executeVideoSubmit = async () => {
    setIsSavingVideo(true)
    try {
      // Check quota
      try {
        await checkQuota(videoStatus === "Published" ? 'POST_PUBLISHED' : 'POST_SCHEDULED', 1);
      } catch (e: any) {
        alert(e.message || "Quota exceeded");
        setIsSavingVideo(false);
        return;
      }

      const platformPostIds: Record<string, string> = {}

      if (videoStatus === "Published" || videoStatus === "Scheduled") {
        let scheduledPublishTime: number | undefined = undefined;
        if (videoStatus === "Scheduled" && videoDate && videoTime) {
          scheduledPublishTime = Math.floor(new Date(`${videoDate}T${videoTime}`).getTime() / 1000);
        }

        const accountsToPublish: any[] = []
        for (const platform of videoPlatforms) {
          const lower = platform.toLowerCase()
          const platformAccs = connectedAccounts.filter(a => a.platform.toLowerCase() === lower)
          
          if (platformAccs.length === 0) {
             accountsToPublish.push({
               id: `default_${lower}`,
               platform: platform,
               name: `${platform}`
             })
             continue
          }

          if (selectedAccountIds[lower] && selectedAccountIds[lower].length > 0) {
            selectedAccountIds[lower].forEach(id => {
              const acc = connectedAccounts.find(a => a.id === id)
              if (acc) accountsToPublish.push(acc)
            })
          } else {
             if (platformAccs.length >= 1) {
               accountsToPublish.push(platformAccs[0])
             }
          }
        }

        if (accountsToPublish.length === 0) {
           alert("No accounts selected for publishing.")
           setIsSavingVideo(false)
           return
        }

        for (const acc of accountsToPublish) {
          const platform = acc.platform.toLowerCase()
          if (platform) {
            try {
              const postRes = await fetch(`/api/post/${platform}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  caption: videoCaption,
                  videoUrl: videoFileUrl,
                  authorType: "personal",
                  accountId: acc.id,
                  scheduledPublishTime
                })
              })
              
              if (postRes.ok) {
                const postData = await postRes.json()
                if (postData.postId || postData.id) {
                  platformPostIds[platform] = postData.postId || postData.id
                }
              }
            } catch (err) {
              console.error(`Error publishing video to ${platform}:`, err)
            }
          }
        }
      }

      const response = await fetch("/api/content/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoFileUrl,
          imageUrl: videoThumbnail || undefined,
          caption: videoCaption,
          platforms: videoPlatforms,
          status: videoStatus,
          date: videoDate,
          time: videoTime,
          platformPostIds: platformPostIds,
          youtubeSettings: videoPlatforms.includes("YouTube") ? {
            title: youtubeTitle,
            privacy: youtubePrivacy,
            audience: youtubeAudience,
            tags: youtubeTags,
            playlist: youtubePlaylist
          } : undefined
        }),
      })

      if (response.ok) {
        setVideoSaveSuccess(true)
        setTimeout(() => {
          setVideoSaveSuccess(false)
          router.push("/dashboard/library")
        }, 1500)
      } else {
        alert("Failed to save video.")
      }
    } catch (err) {
      console.error("Failed to create video:", err)
      alert("Error saving video.")
    } finally {
      setIsSavingVideo(false)
    }
  }



  const handleNext = async () => {
    if (currentStep === 2) {
      setCurrentStep(3)
      setGenerationProgress(0)
      setError(null)

      try {
        // Step 1: Brand Analyzer
        setGenerationMessage("Analyzing brand assets and voice...")
        setGenerationProgress(10)
        const brandAnalysis = await callBrandAnalyzer({
          voice: formData.brandVoice,
          keywords: formData.keywords,
          colors: formData.colors,
        })
        console.log("Brand Analysis completed:", brandAnalysis)

        // Step 2: Content Strategist
        setGenerationMessage("Planning content strategy...")
        setGenerationProgress(30)
        const strategy = await callStrategist({
          brandProfile: brandAnalysis,
          topic: formData.topic,
          platforms: formData.platforms.length > 0 ? formData.platforms : ["instagram"],
          tone: formData.tone || "Casual",
        })
        console.log("Content Strategy completed:", strategy)

        // Step 3: Copywriter
        setGenerationMessage("Generating post copy...")
        setGenerationProgress(50)
        const copy = await callCopywriter({
          strategy: strategy,
          maxLength: formData.platforms.includes("twitter") ? 280 : 500,
          includeHashtags: formData.includeHashtags,
          includeCTA: formData.includeCTA,
        })
        console.log("Copy generation completed:", copy)

        // Step 4: Visual Creator
        setGenerationMessage("Generating stunning custom image...")
        setGenerationProgress(70)
        const image = await callImageGenerator({
          caption: copy.caption,
          brandColors: formData.colors,
          style: `${brandAnalysis.visualStyle || "modern and vibrant"}`,
          aspectRatio: "1:1",
        })
        console.log("Image generation completed:", image)

        // Step 5: Platform Optimizer
        setGenerationMessage("Tailoring content for selected networks...")
        setGenerationProgress(85)
        const optimizer = await callOptimizer({
          baseCopy: copy,
          image: image,
          platforms: formData.platforms.length > 0 ? formData.platforms : ["instagram"],
        })
        console.log("Platform optimization completed:", optimizer)

        // Step 6: Quality Checker
        setGenerationMessage("Running brand consistency check...")
        setGenerationProgress(95)
        const qa = await callQualityChecker({
          content: {
            "brand-analyzer": brandAnalysis,
            strategist: strategy,
            copywriter: copy,
            "image-gen": image,
            optimizer: optimizer,
          },
          brandGuidelines: brandAnalysis,
        })
        console.log("Quality check completed:", qa)

        setGenerationProgress(100)
        setGeneratedData({
          brandAnalysis,
          strategy,
          copy,
          image,
          optimizer,
          qa,
        })
        setCurrentStep(4)
      } catch (err: any) {
        console.error("AI Generation Error:", err)
        setError(err.message || "Failed to generate content. Please try again.")
        setGenerationMessage("Generation stopped due to an error.")
      }
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Mode Selector Tab Header */}
      <div className="flex bg-background-card p-1 rounded-2xl border border-border/50 max-w-2xl mx-auto">
        <button
          onClick={() => setCreationMode("ai")}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            creationMode === "ai"
              ? "bg-white text-black hover:bg-[#f5f5f5] transition-colors shadow-lg"
              : "text-foreground-muted hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Creator Studio
        </button>
        <button
          onClick={() => setCreationMode("manual")}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            ["manual", "reel", "video"].includes(creationMode)
              ? "bg-white text-black hover:bg-[#f5f5f5] transition-colors shadow-lg"
              : "text-foreground-muted hover:text-white"
          }`}
        >
          <PenTool className="w-4 h-4" />
          Direct Publisher
        </button>
      </div>

      {creationMode === "ai" && (
        <div>
          {currentStep <= totalSteps && <WizardProgress currentStep={currentStep} totalSteps={totalSteps} />}

          <div className="mt-8">
            {currentStep === 1 && <BrandInputsStep formData={formData} setFormData={setFormData} onNext={handleNext} />}
            {currentStep === 2 && (
              <ContentSettingsStep 
                formData={formData} 
                setFormData={setFormData} 
                onNext={handleNext} 
                onBack={handleBack} 
                connectedAccounts={connectedAccounts}
                selectedAccountIds={selectedAccountIds}
                setSelectedAccountIds={setSelectedAccountIds}
              />
            )}
            {currentStep === 3 && (
              <div className="space-y-6">
                <GenerationLoadingStep progress={generationProgress} message={generationMessage} />
                {error && (
                  <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-4">
                    <p className="text-destructive font-medium">{error}</p>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-2 bg-foreground text-background font-medium rounded-xl hover:opacity-90 transition-opacity"
                    >
                      Go Back & Edit Settings
                    </button>
                  </div>
                )}
              </div>
            )}
            {currentStep === 4 && (
              <ReviewStep
                formData={formData}
                generatedData={generatedData}
                onBack={() => setCurrentStep(2)}
              />
            )}
          </div>
        </div>
      )}
      
      {["manual", "reel", "video"].includes(creationMode) && (
        <div className="bg-background-card border border-border/50 rounded-3xl p-6 lg:p-10 space-y-8 animate-in fade-in duration-200">
          <div>
            <h2 className="text-3xl font-heading font-bold text-white mb-2">Direct Publisher</h2>
            <p className="text-sm text-foreground-muted">Publish images, reels, and videos across your social networks from one place.</p>
          </div>
          
          <div className="flex bg-background-input p-1 rounded-xl border border-border/50 max-w-fit">
            <button type="button" onClick={() => setCreationMode("manual")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${creationMode === "manual" ? "bg-background-card text-white shadow-sm border border-border/50" : "text-foreground-muted hover:text-white"}`}>Image Post</button>
            <button type="button" onClick={() => setCreationMode("reel")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${creationMode === "reel" ? "bg-background-card text-white shadow-sm border border-border/50" : "text-foreground-muted hover:text-white"}`}>Reel (Short-form)</button>
            <button type="button" onClick={() => setCreationMode("video")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${creationMode === "video" ? "bg-background-card text-white shadow-sm border border-border/50" : "text-foreground-muted hover:text-white"}`}>Video (Long-form)</button>
          </div>

          {creationMode === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-8 animate-in fade-in duration-200">

          <div className="grid lg:grid-cols-[1fr_300px] gap-8">
            <div className="space-y-6">
              {/* Caption Section with Platform Customizer */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <Label htmlFor="manual-caption" className="text-white text-base font-semibold">Caption & Content</Label>
                  <div className="flex items-center gap-3 bg-background-input p-1 rounded-xl border border-border/50 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsCustomCaptionEnabled(false)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${!isCustomCaptionEnabled ? 'bg-primary text-black font-semibold shadow-xs' : 'text-foreground-muted hover:text-white'}`}
                    >
                      Same Caption for All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCaptionEnabled(true)
                        if (manualPlatforms.length > 0 && !selectedCaptionTab) {
                          setSelectedCaptionTab(manualPlatforms[0])
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${isCustomCaptionEnabled ? 'bg-primary text-black font-semibold shadow-xs' : 'text-foreground-muted hover:text-white'}`}
                    >
                      Custom Caption per Platform
                    </button>
                  </div>
                </div>

                {!isCustomCaptionEnabled ? (
                  <Textarea
                    id="manual-caption"
                    placeholder="Write your main post caption here..."
                    value={manualCaption}
                    onChange={(e) => setManualCaption(e.target.value)}
                    rows={7}
                    required={!isCustomCaptionEnabled}
                    className="bg-background-input text-white border-border rounded-2xl"
                  />
                ) : (
                  <div className="space-y-3 bg-background-card/50 p-4 rounded-2xl border border-border/50">
                    <div className="flex flex-wrap gap-2">
                      {manualPlatforms.map((plat) => (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => setSelectedCaptionTab(plat)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            selectedCaptionTab === plat
                              ? 'bg-white text-black border-white shadow-xs'
                              : 'bg-background-input border-border text-foreground-muted hover:text-white'
                          }`}
                        >
                          {plat} {plat === 'Instagram' ? '📷' : plat === 'Facebook' ? '📘' : plat === 'LinkedIn' ? '💼' : plat === 'Twitter' ? '🐦' : '▶️'}
                        </button>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
                        <span>Caption tailored for <strong className="text-white">{selectedCaptionTab}</strong></span>
                        {selectedCaptionTab === 'Instagram' && <span className="text-primary text-[11px]">Tip: Include 10-25 relevant #hashtags for maximum reach</span>}
                      </div>
                      <Textarea
                        placeholder={`Write custom caption tailored for ${selectedCaptionTab}...`}
                        value={perPlatformCaptions[selectedCaptionTab] !== undefined ? perPlatformCaptions[selectedCaptionTab] : manualCaption}
                        onChange={(e) => {
                          const val = e.target.value
                          setPerPlatformCaptions(prev => ({ ...prev, [selectedCaptionTab]: val }))
                        }}
                        rows={7}
                        className="bg-background-input text-white border-border rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Scheduling Details */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-date" className="text-white">Publication Date</Label>
                  <div className="relative">
                    <Input
                      id="manual-date"
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      required
                      className="bg-background-input text-white border-border rounded-xl pl-10 h-11"
                    />
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-time" className="text-white">Publication Time</Label>
                  <div className="relative">
                    <Input
                      id="manual-time"
                      type="time"
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      required
                      className="bg-background-input text-white border-border rounded-xl pl-10 h-11"
                    />
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Status</Label>
                  <Select value={manualStatus} onValueChange={(val) => setManualStatus(val)}>
                    <SelectTrigger className="bg-background-input text-white border-border rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Platforms */}
              <div className="space-y-3">
                <Label className="text-white">Target Platforms</Label>
                <div className="flex flex-wrap gap-3">
                  {ALL_17_PLATFORMS.map((platform) => {
                    const isSelected = manualPlatforms.includes(platform)
                    return (
                      <button
                        type="button"
                        key={platform}
                        onClick={() => {
                          const updated = isSelected
                            ? manualPlatforms.filter((p) => p !== platform)
                            : [...manualPlatforms, platform]
                          setManualPlatforms(updated.length > 0 ? updated : [platform])
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-primary border-primary text-black"
                            : "bg-transparent border-border text-gray-300 hover:text-white hover:border-white"
                        }`}
                      >
                        {platform}
                      </button>
                    )
                  })}
                </div>
                <InlineAccountSelector 
                  selectedPlatforms={manualPlatforms}
                  allAccounts={connectedAccounts}
                  selectedAccountIds={selectedAccountIds}
                  setSelectedAccountIds={setSelectedAccountIds}
                />
              </div>
            </div>

            {/* Visual Attachment Upload */}
            <div className="space-y-4">
              <Label className="text-white">Visual Attachment</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-background border border-border border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden group"
              >
                {manualImage ? (
                  <>
                    {manualImage.startsWith("data:video/") || /\.(mp4|webm|mov)$/i.test(manualImage) ? (
                      <video src={manualImage} controls className="object-cover w-full h-full absolute inset-0" />
                    ) : (
                      <img src={manualImage} alt="Manual upload preview" className="object-cover w-full h-full absolute inset-0" />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    {manualImage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setManualImage("")
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-foreground-muted mb-3 group-hover:text-primary transition-colors" />
                    <p className="text-sm text-foreground-muted mb-1">Click to browse or drag and drop</p>
                    <p className="text-xs text-foreground-muted/60">JPG, PNG or GIF (Max 10MB)</p>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*,video/mp4,video/quicktime,video/webm"
                className="hidden"
              />
              {manualImage && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setManualImage("")}
                  className="w-full text-xs text-error hover:bg-error/10 h-8 rounded-xl"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Remove Image
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40 mt-8">
            <Button
              type="submit"
              disabled={isSavingManual || saveSuccess}
              className="bg-white text-black hover:bg-[#f5f5f5] transition-colors rounded-xl h-12 px-8 font-semibold shadow-lg min-w-[160px] flex items-center justify-center gap-2"
            >
              {isSavingManual ? (
                "Saving Post..."
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved! Redirecting...
                </>
              ) : (
                manualStatus === "Draft" ? "Save Draft" :
                manualStatus === "Scheduled" ? "Schedule Post" :
                "Publish Now"
              )}
            </Button>
          </div>
        </form>
          )}

          {creationMode === "reel" && (
            <form onSubmit={handleReelSubmit} className="space-y-8 animate-in fade-in duration-200">

          <div className="grid lg:grid-cols-[1fr_300px] gap-8">
            <div className="space-y-6">
              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="reel-caption" className="text-white">Caption & Hashtags</Label>
                <Textarea
                  id="reel-caption"
                  placeholder="Write your reel caption and add hashtags..."
                  value={reelCaption}
                  onChange={(e) => setReelCaption(e.target.value)}
                  rows={8}
                  required
                  className="bg-background-input text-white border-border rounded-2xl"
                />
              </div>

              {/* Scheduling Details */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reel-date" className="text-white">Publication Date</Label>
                  <div className="relative">
                    <Input
                      id="reel-date"
                      type="date"
                      value={reelDate}
                      onChange={(e) => setReelDate(e.target.value)}
                      required
                      className="bg-background-input text-white border-border rounded-xl pl-10 h-11"
                    />
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reel-time" className="text-white">Publication Time</Label>
                  <div className="relative">
                    <Input
                      id="reel-time"
                      type="time"
                      value={reelTime}
                      onChange={(e) => setReelTime(e.target.value)}
                      required
                      className="bg-background-input text-white border-border rounded-xl pl-10 h-11"
                    />
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Status</Label>
                  <Select value={reelStatus} onValueChange={(val) => setReelStatus(val)}>
                    <SelectTrigger className="bg-background-input text-white border-border rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Platforms */}
              <div className="space-y-3">
                <Label className="text-white">Target Platforms</Label>
                <div className="flex flex-wrap gap-3">
                  {ALL_17_PLATFORMS.map((platform) => {
                    const isSelected = reelPlatforms.includes(platform)
                    return (
                      <button
                        type="button"
                        key={platform}
                        onClick={() => {
                          const updated = isSelected
                            ? reelPlatforms.filter((p) => p !== platform)
                            : [...reelPlatforms, platform]
                          setReelPlatforms(updated.length > 0 ? updated : [platform])
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-primary border-primary text-black"
                            : "bg-transparent border-border text-gray-300 hover:text-white hover:border-white"
                        }`}
                      >
                        {platform}
                      </button>
                    )
                  })}
                </div>
                <InlineAccountSelector 
                  selectedPlatforms={reelPlatforms}
                  allAccounts={connectedAccounts}
                  selectedAccountIds={selectedAccountIds}
                  setSelectedAccountIds={setSelectedAccountIds}
                />
              </div>
            </div>

            {/* Visual Attachment Upload */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-white">Video Reel <span className="text-xs text-foreground-muted font-normal">(Max 60s, 50MB)</span></Label>
                <div
                  onClick={() => reelVideoInputRef.current?.click()}
                  className="aspect-[9/16] bg-background border border-border border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden group"
                >
                  {reelVideo ? (
                    <>
                      <video src={reelVideo} className="object-cover w-full h-full absolute inset-0 rounded-2xl" autoPlay loop muted playsInline />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Video className="w-8 h-8 text-foreground-muted mx-auto" />
                      <p className="text-xs font-semibold text-white">Upload Video</p>
                      <p className="text-[10px] text-foreground-muted">MP4, MOV, WebM</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={reelVideoInputRef}
                  onChange={handleReelVideoUpload}
                  accept="video/mp4,video/quicktime,video/webm"
                  className="hidden"
                />
                {reelVideo && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setReelVideo("")}
                    className="w-full text-xs text-error hover:bg-error/10 h-8 rounded-xl"
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Remove Video
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-white">Optional Thumbnail</Label>
                <div
                  onClick={() => reelThumbnailInputRef.current?.click()}
                  className="aspect-square bg-background border border-border border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden group"
                >
                  {reelThumbnail ? (
                    <>
                      <img src={reelThumbnail} alt="Thumbnail" className="object-cover w-full h-full absolute inset-0 rounded-2xl" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-foreground-muted mx-auto" />
                      <p className="text-xs font-semibold text-white">Upload Cover</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={reelThumbnailInputRef}
                  onChange={handleReelThumbnailUpload}
                  accept="image/*"
                  className="hidden"
                />
                {reelThumbnail && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setReelThumbnail("")}
                    className="w-full text-xs text-error hover:bg-error/10 h-8 rounded-xl"
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Remove Cover
                  </Button>
                )}
              </div>
            </div>
          </div>

          {reelPlatforms.includes("YouTube") && (
            <div className="bg-background-input/30 border border-border/50 rounded-2xl p-6 space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <PlatformIcon platform="youtube" className="w-5 h-5" />
                  YouTube Specific Settings
                </h3>
                <p className="text-sm text-foreground-muted">Configure metadata specifically for YouTube Shorts.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3 sm:col-span-2">
                  <Label className="text-white">Video Title <span className="text-error">*</span></Label>
                  <Input 
                    value={youtubeTitle} 
                    onChange={e => setYoutubeTitle(e.target.value)} 
                    placeholder="Enter an engaging title for your YouTube Short" 
                    className="bg-background-input text-white border-border rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-white">Privacy Status</Label>
                  <Select value={youtubePrivacy} onValueChange={setYoutubePrivacy}>
                    <SelectTrigger className="bg-background-input text-white border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Unlisted">Unlisted</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-white">Audience</Label>
                  <Select value={youtubeAudience} onValueChange={setYoutubeAudience}>
                    <SelectTrigger className="bg-background-input text-white border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Made for Kids">No, it's not made for kids</SelectItem>
                      <SelectItem value="Made for Kids">Yes, it's made for kids</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 sm:col-span-2">
                  <Label className="text-white">Tags (comma separated)</Label>
                  <Input 
                    value={youtubeTags} 
                    onChange={e => setYoutubeTags(e.target.value)} 
                    placeholder="e.g. social media, marketing, tutorial" 
                    className="bg-background-input text-white border-border rounded-xl"
                  />
                </div>
                <div className="space-y-3 sm:col-span-2">
                  <Label className="text-white">Add to Playlist (Optional)</Label>
                  <Input 
                    value={youtubePlaylist} 
                    onChange={e => setYoutubePlaylist(e.target.value)} 
                    placeholder="Enter playlist name or ID" 
                    className="bg-background-input text-white border-border rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40 mt-8">
            <Button
              type="submit"
              disabled={isSavingReel || reelSaveSuccess || !reelVideo}
              className="bg-white text-black hover:bg-[#f5f5f5] transition-colors rounded-xl h-12 px-8 font-semibold shadow-lg min-w-[160px] flex items-center justify-center gap-2"
            >
              {isSavingReel ? (
                "Saving Reel..."
              ) : reelSaveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved! Redirecting...
                </>
              ) : (
                reelStatus === "Draft" ? "Save Draft" :
                reelStatus === "Scheduled" ? "Schedule Reel" :
                "Publish Reel Now"
              )}
            </Button>
          </div>
        </form>
          )}

          {creationMode === "video" && (
            <form onSubmit={handleVideoSubmit} className="space-y-8 animate-in fade-in duration-200">

          <div className="grid lg:grid-cols-[1fr_300px] gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="video-caption" className="text-white">Title & Description</Label>
                <Textarea
                  id="video-caption"
                  placeholder="Write your video description and title..."
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                  rows={8}
                  required
                  className="bg-background-input text-white border-border rounded-2xl"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="video-date" className="text-white">Publication Date</Label>
                  <div className="relative">
                    <Input
                      id="video-date"
                      type="date"
                      value={videoDate}
                      onChange={(e) => setVideoDate(e.target.value)}
                      required
                      className="bg-background-input text-white border-border rounded-xl pl-10 h-11"
                    />
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video-time" className="text-white">Publication Time</Label>
                  <div className="relative">
                    <Input
                      id="video-time"
                      type="time"
                      value={videoTime}
                      onChange={(e) => setVideoTime(e.target.value)}
                      required
                      className="bg-background-input text-white border-border rounded-xl pl-10 h-11"
                    />
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Status</Label>
                  <Select value={videoStatus} onValueChange={(val) => setVideoStatus(val)}>
                    <SelectTrigger className="bg-background-input text-white border-border rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-white">Target Platforms</Label>
                <div className="flex flex-wrap gap-3">
                  {ALL_17_PLATFORMS.map((platform) => {
                    const isSelected = videoPlatforms.includes(platform)
                    return (
                      <button
                        type="button"
                        key={platform}
                        onClick={() => {
                          const updated = isSelected
                            ? videoPlatforms.filter((p) => p !== platform)
                            : [...videoPlatforms, platform]
                          setVideoPlatforms(updated.length > 0 ? updated : [platform])
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-primary border-primary text-black"
                            : "bg-transparent border-border text-gray-300 hover:text-white hover:border-white"
                        }`}
                      >
                        {platform}
                      </button>
                    )
                  })}
                </div>
                <InlineAccountSelector 
                  selectedPlatforms={videoPlatforms}
                  allAccounts={connectedAccounts}
                  selectedAccountIds={selectedAccountIds}
                  setSelectedAccountIds={setSelectedAccountIds}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-white">Video File <span className="text-xs text-foreground-muted font-normal">(Max 500MB)</span></Label>
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className="aspect-video bg-background border border-border border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden group"
                >
                  {videoFileUrl ? (
                    <>
                      <video src={videoFileUrl} className="object-cover w-full h-full absolute inset-0 rounded-2xl" autoPlay loop muted playsInline />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Film className="w-8 h-8 text-foreground-muted mx-auto" />
                      <p className="text-xs font-semibold text-white">Upload Video</p>
                      <p className="text-[10px] text-foreground-muted">MP4, MOV, WebM</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleVideoUpload}
                  accept="video/mp4,video/quicktime,video/webm"
                  className="hidden"
                />
                {videoFileUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setVideoFileUrl("")}
                    className="w-full text-xs text-error hover:bg-error/10 h-8 rounded-xl"
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Remove Video
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-white">Video Thumbnail</Label>
                <div
                  onClick={() => videoThumbnailInputRef.current?.click()}
                  className="aspect-video bg-background border border-border border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden group"
                >
                  {videoThumbnail ? (
                    <>
                      <img src={videoThumbnail} alt="Thumbnail" className="object-cover w-full h-full absolute inset-0 rounded-2xl" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-foreground-muted mx-auto" />
                      <p className="text-xs font-semibold text-white">Upload Thumbnail</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={videoThumbnailInputRef}
                  onChange={handleVideoThumbnailUpload}
                  accept="image/*"
                  className="hidden"
                />
                {videoThumbnail && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setVideoThumbnail("")}
                    className="w-full text-xs text-error hover:bg-error/10 h-8 rounded-xl"
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Remove Thumbnail
                  </Button>
                )}
              </div>
            </div>
          </div>

          {videoPlatforms.includes("YouTube") && (
            <div className="bg-background-input/30 border border-border/50 rounded-2xl p-6 space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <PlatformIcon platform="youtube" className="w-5 h-5" />
                  YouTube Specific Settings
                </h3>
                <p className="text-sm text-foreground-muted">Configure metadata specifically for YouTube videos.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3 sm:col-span-2">
                  <Label className="text-white">Video Title <span className="text-error">*</span></Label>
                  <Input 
                    value={youtubeTitle} 
                    onChange={e => setYoutubeTitle(e.target.value)} 
                    placeholder="Enter an engaging title for your video" 
                    className="bg-background-input text-white border-border rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-white">Privacy Status</Label>
                  <Select value={youtubePrivacy} onValueChange={setYoutubePrivacy}>
                    <SelectTrigger className="bg-background-input text-white border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Unlisted">Unlisted</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-white">Audience</Label>
                  <Select value={youtubeAudience} onValueChange={setYoutubeAudience}>
                    <SelectTrigger className="bg-background-input text-white border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Made for Kids">No, it's not made for kids</SelectItem>
                      <SelectItem value="Made for Kids">Yes, it's made for kids</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 sm:col-span-2">
                  <Label className="text-white">Tags (comma separated)</Label>
                  <Input 
                    value={youtubeTags} 
                    onChange={e => setYoutubeTags(e.target.value)} 
                    placeholder="e.g. social media, marketing, tutorial" 
                    className="bg-background-input text-white border-border rounded-xl"
                  />
                </div>
                <div className="space-y-3 sm:col-span-2">
                  <Label className="text-white">Add to Playlist (Optional)</Label>
                  <Input 
                    value={youtubePlaylist} 
                    onChange={e => setYoutubePlaylist(e.target.value)} 
                    placeholder="Enter playlist name or ID" 
                    className="bg-background-input text-white border-border rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40 mt-8">
            <Button
              type="submit"
              disabled={isSavingVideo || videoSaveSuccess || !videoFileUrl}
              className="bg-white text-black hover:bg-[#f5f5f5] transition-colors rounded-xl h-12 px-8 font-semibold shadow-lg min-w-[160px] flex items-center justify-center gap-2"
            >
              {isSavingVideo ? (
                "Saving Video..."
              ) : videoSaveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved! Redirecting...
                </>
              ) : (
                videoStatus === "Draft" ? "Save Draft" :
                videoStatus === "Scheduled" ? "Schedule Video" :
                "Publish Video Now"
              )}
            </Button>
          </div>
            </form>
          )}
        </div>
      )}

    </div>
  )
}
