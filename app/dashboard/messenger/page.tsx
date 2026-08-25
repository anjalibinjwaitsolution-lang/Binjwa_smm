"use client"

import { useState, useEffect } from "react"
import {
  Sparkles,
  MessageSquare,
  Save,
  Bot,
  HandMetal,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Pin,
  PhoneCall,
  Cloud,
  Video,
  Check,
  Send,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Zap,
  Info,
  Palette,
  Tv
} from "lucide-react"
import {
  FaSlack,
  FaTelegram,
  FaDiscord,
  FaMedium,
  FaReddit,
  FaTwitch
} from "react-icons/fa"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

const SOCIAL_PLATFORMS = [
  { id: 'Instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-400', bg: 'from-pink-500/20 to-purple-500/20', border: 'border-pink-500/30' },
  { id: 'Facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-400', bg: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/30' },
  { id: 'LinkedIn', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-300', bg: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' },
  { id: 'Twitter', name: 'Twitter / X', icon: Twitter, color: 'text-gray-300', bg: 'from-gray-500/20 to-slate-500/20', border: 'border-gray-500/30' },
  { id: 'YouTube', name: 'YouTube', icon: Youtube, color: 'text-red-400', bg: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30' },
  { id: 'Threads', name: 'Threads', icon: MessageSquare, color: 'text-white', bg: 'from-neutral-500/20 to-stone-500/20', border: 'border-neutral-500/30' },
  { id: 'Pinterest', name: 'Pinterest', icon: Pin, color: 'text-rose-400', bg: 'from-rose-500/20 to-red-500/20', border: 'border-rose-500/30' },
  { id: 'WhatsApp', name: 'WhatsApp', icon: PhoneCall, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30' },
  { id: 'Bluesky', name: 'Bluesky', icon: Cloud, color: 'text-sky-400', bg: 'from-sky-500/20 to-blue-500/20', border: 'border-sky-500/30' },
  { id: 'TikTok', name: 'TikTok', icon: Video, color: 'text-teal-400', bg: 'from-teal-500/20 to-pink-500/20', border: 'border-teal-500/30' },
  { id: 'Slack', name: 'Slack', icon: FaSlack, color: 'text-purple-400', bg: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30' },
  { id: 'Telegram', name: 'Telegram', icon: FaTelegram, color: 'text-sky-400', bg: 'from-sky-500/20 to-blue-500/20', border: 'border-sky-500/30' },
  { id: 'Discord', name: 'Discord', icon: FaDiscord, color: 'text-indigo-400', bg: 'from-indigo-500/20 to-purple-500/20', border: 'border-indigo-500/30' },
  { id: 'Canva', name: 'Canva', icon: Palette, color: 'text-blue-400', bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30' },
  { id: 'Medium', name: 'Medium', icon: FaMedium, color: 'text-neutral-300', bg: 'from-neutral-500/20 to-stone-500/20', border: 'border-neutral-500/30' },
  { id: 'Reddit', name: 'Reddit', icon: FaReddit, color: 'text-orange-400', bg: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/30' },
  { id: 'Twitch', name: 'Twitch', icon: FaTwitch, color: 'text-purple-400', bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
  { id: 'Kick', name: 'Kick', icon: Tv, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30' },
]

interface PlatformAISettings {
  aiEnabled: boolean
  aiCommentsEnabled: boolean
  dmPrompt: string
  commentPrompt: string
  logToInbox: boolean
}

export default function MessengerPage() {
  const [activePlatform, setActivePlatform] = useState<string>("Instagram")
  const [connections, setConnections] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form State for currently active platform
  const [dmPrompt, setDmPrompt] = useState("")
  const [commentPrompt, setCommentPrompt] = useState("")
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiCommentsEnabled, setAiCommentsEnabled] = useState(false)
  const [logToInbox, setLogToInbox] = useState(true)

  // Simulator State
  const [simInput, setSimInput] = useState("")
  const [simMode, setSimMode] = useState<"dm" | "comment">("dm")
  const [simMessages, setSimMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hello! I am your AI agent. Test your prompt by sending a message below." }
  ])
  const [isSimulating, setIsSimulating] = useState(false)

  // Fetch connections and settings on load
  useEffect(() => {
    fetchConnectionsAndSettings(activePlatform)
  }, [activePlatform])

  const fetchConnectionsAndSettings = async (platformName: string) => {
    setIsLoading(true)
    try {
      // 1. Fetch connected accounts
      const connRes = await fetch("/api/connections")
      if (connRes.ok) {
        const connData = await connRes.json()
        setConnections(connData || {})

        // Check if there's a connected Facebook or Instagram page with saved rules
        const pLower = platformName.toLowerCase()
        if (pLower === "facebook" || pLower === "instagram") {
          const fbConn = connData.facebook
          if (fbConn && Array.isArray(fbConn.pages) && fbConn.pages.length > 0) {
            const firstPage = fbConn.pages[0]
            setDmPrompt(firstPage.nicheInstructions || firstPage.dmPrompt || "")
            setCommentPrompt(firstPage.commentPrompt || firstPage.nicheInstructions || "")
            setAiEnabled(!!firstPage.aiEnabled)
            setAiCommentsEnabled(!!firstPage.aiCommentsEnabled)
            setLogToInbox(firstPage.logToInbox !== undefined ? firstPage.logToInbox : true)
            setIsLoading(false)
            return
          }
          if (pLower === "instagram" && connData.instagram) {
            // Found IG connection; fallback to universal rules below if not in FB page
          }
        }
      }

      // 2. Fetch universal AI settings for the platform
      const localDm = typeof window !== 'undefined' ? localStorage.getItem(`binjwa_dmPrompt_${platformName}`) : null
      const localComment = typeof window !== 'undefined' ? localStorage.getItem(`binjwa_commentPrompt_${platformName}`) : null

      const settingsRes = await fetch(`/api/messenger/settings?platform=${platformName}`)
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        const s: PlatformAISettings = settingsData.aiSettings || {}
        const finalDm = s.dmPrompt !== undefined && s.dmPrompt !== "" ? s.dmPrompt : (localDm || "")
        const finalComment = s.commentPrompt !== undefined && s.commentPrompt !== "" ? s.commentPrompt : (localComment || finalDm || "")
        
        setDmPrompt(finalDm)
        setCommentPrompt(finalComment)
        setAiEnabled(s.aiEnabled !== undefined ? !!s.aiEnabled : true)
        setAiCommentsEnabled(s.aiCommentsEnabled !== undefined ? !!s.aiCommentsEnabled : true)
        setLogToInbox(s.logToInbox !== undefined ? !!s.logToInbox : true)
      } else if (localDm || localComment) {
        setDmPrompt(localDm || "")
        setCommentPrompt(localComment || "")
      }
    } catch (err) {
      console.error("Error loading settings:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const autoSaveSettings = (updates: Partial<{ dmPrompt: string; commentPrompt: string; aiEnabled: boolean; aiCommentsEnabled: boolean; logToInbox: boolean }>) => {
    const newDm = updates.dmPrompt !== undefined ? updates.dmPrompt : dmPrompt
    const newComment = updates.commentPrompt !== undefined ? updates.commentPrompt : commentPrompt
    const newAi = updates.aiEnabled !== undefined ? updates.aiEnabled : aiEnabled
    const newAiComm = updates.aiCommentsEnabled !== undefined ? updates.aiCommentsEnabled : aiCommentsEnabled
    const newLog = updates.logToInbox !== undefined ? updates.logToInbox : logToInbox

    if (typeof window !== 'undefined') {
      localStorage.setItem(`binjwa_dmPrompt_${activePlatform}`, newDm)
      localStorage.setItem(`binjwa_commentPrompt_${activePlatform}`, newComment)
    }

    fetch("/api/messenger/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: activePlatform,
        aiEnabled: newAi,
        aiCommentsEnabled: newAiComm,
        dmPrompt: newDm,
        commentPrompt: newComment,
        logToInbox: newLog
      })
    }).catch(() => {})
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const pLower = activePlatform.toLowerCase()

      autoSaveSettings({ dmPrompt, commentPrompt, aiEnabled, aiCommentsEnabled, logToInbox })

      // If Facebook or Instagram and pages are connected, also save to Facebook page settings
      if ((pLower === "facebook" || pLower === "instagram") && connections.facebook?.pages?.length > 0) {
        for (const page of connections.facebook.pages) {
          await fetch("/api/connections/facebook/page-settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pageId: page.id,
              aiEnabled,
              aiCommentsEnabled,
              nicheInstructions: dmPrompt,
              dmPrompt,
              commentPrompt,
              logToInbox
            })
          })
        }
      }

      toast.success(`${activePlatform} AI Agent settings saved to database & activated!`, {
        description: logToInbox
          ? "Messages and AI responses will log to your Inbox section automatically."
          : "AI auto-reply is active (Inbox logging is disabled as requested)."
      })
    } catch (e) {
      toast.error("Failed to save AI settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDmChange = (val: string) => {
    setDmPrompt(val)
    autoSaveSettings({ dmPrompt: val })
  }

  const handleCommentChange = (val: string) => {
    setCommentPrompt(val)
    autoSaveSettings({ commentPrompt: val })
  }

  const handleCopyDmToComment = () => {
    setCommentPrompt(dmPrompt)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`binjwa_commentPrompt_${activePlatform}`, dmPrompt)
    }
    toast.info("Copied DM Agent prompt to Comment Agent prompt")
  }

  const handleSimulateSend = async () => {
    if (!simInput.trim()) return
    const userMsg = simInput
    setSimInput("")
    setSimMessages(prev => [...prev, { sender: "user", text: userMsg }])
    setIsSimulating(true)

    try {
      const promptToUse = simMode === "comment" ? (commentPrompt || dmPrompt) : dmPrompt
      const res = await fetch("/api/messenger/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageText: userMsg,
          platform: activePlatform,
          prompt: promptToUse,
          isComment: simMode === "comment",
          logToInbox
        })
      })
      if (res.ok) {
        const data = await res.json()
        setSimMessages(prev => [...prev, { sender: "ai", text: data.reply || "No reply generated." }])
        if (data.logged) {
          toast.success(`Message logged to ${activePlatform} Inbox!`)
        }
      } else {
        setSimMessages(prev => [...prev, { sender: "ai", text: "Error connecting to OpenAI simulator." }])
      }
    } catch (e) {
      setSimMessages(prev => [...prev, { sender: "ai", text: "Error simulating reply." }])
    } finally {
      setIsSimulating(false)
    }
  }

  const currentPlatformObj = SOCIAL_PLATFORMS.find(p => p.id === activePlatform) || SOCIAL_PLATFORMS[0]
  const PlatformIconComponent = currentPlatformObj.icon

  const isPlatformConnected = (platformName?: string) => {
    const target = (platformName || activePlatform).toLowerCase()
    if (connections.platforms && Array.isArray(connections.platforms)) {
      const platObj = connections.platforms.find((p: any) => p.id.toLowerCase() === target)
      if (platObj && platObj.connected) return true
    }
    if (target === "facebook") {
      return !!(connections.facebook?.pages?.length > 0)
    }
    if (target === "instagram") {
      return !!(connections.instagram || (connections.facebook?.pages?.length > 0))
    }
    return false
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold text-foreground mb-2 flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            AI Agent Studio & Messenger Automation
          </h2>
          <p className="text-foreground-muted max-w-2xl text-sm">
            Configure platform-specific OpenAI agents. Define the purpose of each agent, set rules for DMs and Comments, and choose whether interactions are logged to your Inbox.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="btn-gradient text-black font-bold px-6 h-11 shadow-lg flex items-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save & Activate Agent</span>
          </Button>
        </div>
      </div>

      {/* Horizontal Platform Switcher Bar (10 Platforms) */}
      <div className="bg-background-subtle/40 border border-border rounded-2xl p-3 backdrop-blur-xl flex items-center gap-2 overflow-x-auto shadow-lg">
        {SOCIAL_PLATFORMS.map((p) => {
          const isSelected = activePlatform === p.id
          const Icon = p.icon
          const connected = isPlatformConnected() && p.id === activePlatform
          return (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap border",
                isSelected
                  ? "bg-white/10 border-primary text-foreground shadow-md font-semibold scale-[1.03]"
                  : "bg-background/30 border-transparent text-foreground-muted hover:text-foreground hover:bg-white/5 hover:border-border"
              )}
            >
              <Icon className={cn("w-4 h-4", p.color)} />
              <span>{p.name}</span>
              {isSelected && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  aiEnabled || aiCommentsEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-foreground-muted"
                )}>
                  {aiEnabled || aiCommentsEnabled ? "Active" : "Ready"}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-foreground-muted text-sm animate-pulse">
          Loading {activePlatform} AI Agent configuration...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main AI Agent Config Area (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-background border border-border/60 rounded-2xl p-6 space-y-6 shadow-xl">
              {/* Active Platform Header Banner */}
              <div className="flex items-center justify-between border-b border-border/40 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <PlatformIconComponent className={cn("w-6 h-6", currentPlatformObj.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-foreground">{activePlatform} AI Agent</h3>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                        OpenAI Powered
                      </span>
                    </div>
                    <p className="text-xs text-foreground-muted">
                      {isPlatformConnected()
                        ? `Connected account ready. Your custom OpenAI prompt will respond automatically.`
                        : `Configure your agent rules now. They will apply as soon as your account is connected.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-semibold text-foreground">
                      {aiEnabled || aiCommentsEnabled ? "Automation ON" : "Automation Standby"}
                    </div>
                    <div className="text-[11px] text-foreground-muted">
                      {logToInbox ? "Logging to Inbox" : "No inbox logging"}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 1: DM AGENT PURPOSE & SYSTEM PROMPT */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    1. Auto-DM Agent Purpose & System Prompt
                  </Label>
                  <span className="text-xs text-foreground-muted">Direct Messages (DMs)</span>
                </div>
                <Textarea
                  value={dmPrompt}
                  onChange={(e) => handleDmChange(e.target.value)}
                  placeholder={`e.g. You are an AI sales and support specialist for our ${activePlatform} account. Greet customers warmly, answer questions about our packages concisely, and encourage them to book a demo at binjwa.com...`}
                  className="bg-background-input border-border/80 focus-visible:border-primary min-h-[110px] text-foreground resize-y font-mono text-xs"
                />
                <p className="text-[11px] text-foreground-muted">
                  This prompt gives full context and purpose to OpenAI when responding to private DMs on {activePlatform}.
                </p>
              </div>

              {/* SECTION 2: COMMENT / CHANNEL AGENT PURPOSE & SYSTEM PROMPT */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    {["Slack", "Telegram", "Discord"].includes(activePlatform)
                      ? "2. Auto-Channel & Group Agent Purpose & System Prompt"
                      : "2. Auto-Comment Agent Purpose & System Prompt"}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyDmToComment}
                    className="h-7 text-[11px] text-primary hover:text-primary/80"
                  >
                    Copy DM Prompt to {["Slack", "Telegram", "Discord"].includes(activePlatform) ? "Channel" : "Comment"} Prompt
                  </Button>
                </div>
                <Textarea
                  value={commentPrompt}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  placeholder={
                    ["Slack", "Telegram", "Discord"].includes(activePlatform)
                      ? `e.g. You are an AI assistant responding to channel posts in ${activePlatform}. Keep replies helpful, concise, professional, and address the team or community clearly...`
                      : `e.g. You are an enthusiastic community manager replying to ${activePlatform} post comments. Keep replies under 2 sentences, energetic, and encourage the commenter to DM us for details...`
                  }
                  className="bg-background-input border-border/80 focus-visible:border-emerald-500/50 min-h-[110px] text-foreground resize-y font-mono text-xs"
                />
                <p className="text-[11px] text-foreground-muted">
                  {["Slack", "Telegram", "Discord"].includes(activePlatform)
                    ? `Define custom AI instructions for channel posts and group messages on ${activePlatform}.`
                    : `You can define a separate, specialized purpose for post comments, or keep it identical to your DM agent.`}
                </p>
              </div>

              {/* SECTION 3: AUTOMATION TRIGGERS & INBOX LOGGING CONTROL */}
              <div className="space-y-4 pt-5 border-t border-border/40">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  3. Automation Triggers & Inbox Logging Option
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Toggle 1: Auto DM */}
                  <div
                    onClick={() => {
                      const next = !aiEnabled
                      setAiEnabled(next)
                      autoSaveSettings({ aiEnabled: next })
                    }}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
                      aiEnabled
                        ? "bg-primary/10 border-primary text-foreground"
                        : "bg-background-subtle/50 border-border/60 text-foreground-muted hover:border-border"
                    )}
                  >
                    <Checkbox
                      checked={aiEnabled}
                      onCheckedChange={(c) => {
                        const next = !!c
                        setAiEnabled(next)
                        autoSaveSettings({ aiEnabled: next })
                      }}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-semibold text-sm text-foreground">Auto-Reply to DMs</div>
                      <div className="text-xs text-foreground-muted mt-0.5">
                        Enable instant AI replies for incoming Direct Messages.
                      </div>
                    </div>
                  </div>

                  {/* Toggle 2: Auto Comment / Auto Channel */}
                  <div
                    onClick={() => {
                      const next = !aiCommentsEnabled
                      setAiCommentsEnabled(next)
                      autoSaveSettings({ aiCommentsEnabled: next })
                    }}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
                      aiCommentsEnabled
                        ? "bg-emerald-500/10 border-emerald-500/50 text-foreground"
                        : "bg-background-subtle/50 border-border/60 text-foreground-muted hover:border-border"
                    )}
                  >
                    <Checkbox
                      checked={aiCommentsEnabled}
                      onCheckedChange={(c) => {
                        const next = !!c
                        setAiCommentsEnabled(next)
                        autoSaveSettings({ aiCommentsEnabled: next })
                      }}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-semibold text-sm text-foreground">
                        {["Slack", "Telegram", "Discord"].includes(activePlatform) ? "Auto-Reply to Channels & Groups" : "Auto-Reply to Comments"}
                      </div>
                      <div className="text-xs text-foreground-muted mt-0.5">
                        {["Slack", "Telegram", "Discord"].includes(activePlatform)
                          ? "Enable instant AI responses for channel messages & group posts."
                          : "Enable AI replies for public post comments."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CHECKBOX 3: LOG MESSAGES TO INBOX (THE KEY REQUIREMENT!) */}
                <div
                  onClick={() => {
                    const next = !logToInbox
                    setLogToInbox(next)
                    autoSaveSettings({ logToInbox: next })
                  }}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5",
                    logToInbox
                      ? "bg-white/5 border-primary/60 text-foreground shadow-sm"
                      : "bg-background-subtle/30 border-border/40 text-foreground-muted"
                  )}
                >
                  <Checkbox
                    checked={logToInbox}
                    onCheckedChange={(c) => {
                      const next = !!c
                      setLogToInbox(next)
                      autoSaveSettings({ logToInbox: next })
                    }}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      Log Messages to Inbox Section (Recommended)
                    </div>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      When checked, every incoming message and automated AI response is logged immediately to your platform Inbox section, where you can inspect conversations and edit AI replies anytime. When unchecked, AI replies instantly but does not save logs to the Inbox.
                    </p>
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON BAR */}
              <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                <span className="text-xs text-foreground-muted flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Settings take effect immediately upon saving.
                </span>
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="btn-gradient text-black font-bold px-8 h-11"
                >
                  {isSaving ? "Saving..." : `Save ${activePlatform} Agent`}
                  <Save className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Column 3: Built-in Live OpenAI Simulator */}
          <div className="space-y-4">
            <div className="bg-background border border-border/60 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h4 className="font-bold text-foreground text-sm">Live OpenAI Simulator</h4>
                </div>
                <div className="flex items-center gap-1 bg-background-subtle p-1 rounded-lg border border-border">
                  <button
                    onClick={() => setSimMode("dm")}
                    className={cn(
                      "px-2.5 py-1 rounded text-[11px] font-semibold transition-all",
                      simMode === "dm" ? "bg-primary text-black" : "text-foreground-muted hover:text-foreground"
                    )}
                  >
                    Test DM
                  </button>
                  <button
                    onClick={() => setSimMode("comment")}
                    className={cn(
                      "px-2.5 py-1 rounded text-[11px] font-semibold transition-all",
                      simMode === "comment" ? "bg-emerald-500 text-black" : "text-foreground-muted hover:text-foreground"
                    )}
                  >
                    Test Comment
                  </button>
                </div>
              </div>

              <p className="text-xs text-foreground-muted">
                Test your <span className="text-foreground font-semibold">{simMode === "dm" ? "DM Agent" : "Comment Agent"}</span> prompt right now before or after saving.
              </p>

              {/* Simulated Chat Thread */}
              <div className="flex-1 min-h-[280px] max-h-[350px] overflow-y-auto space-y-3 p-3 rounded-xl bg-background-subtle/50 border border-border/40">
                {simMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-col max-w-[85%] rounded-xl p-3 text-xs leading-relaxed",
                      m.sender === "user"
                        ? "ml-auto bg-primary text-black font-medium"
                        : "mr-auto bg-background border border-border text-foreground"
                    )}
                  >
                    <span className="text-[9px] opacity-70 mb-1 font-semibold uppercase">
                      {m.sender === "user" ? "Customer Test" : `${activePlatform} AI (${simMode.toUpperCase()})`}
                    </span>
                    <span>{m.text}</span>
                  </div>
                ))}
                {isSimulating && (
                  <div className="mr-auto bg-background border border-border rounded-xl p-3 text-xs text-foreground-muted animate-pulse">
                    Generating OpenAI reply...
                  </div>
                )}
              </div>

              {/* Simulator Input Form */}
              <div className="flex items-center gap-2 pt-2">
                <Input
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSimulateSend()}
                  placeholder={simMode === "dm" ? "Type a test DM..." : "Type a test comment..."}
                  className="bg-background-input border-border/80 text-xs h-9"
                />
                <Button
                  onClick={handleSimulateSend}
                  disabled={isSimulating || !simInput.trim()}
                  className="bg-primary text-black font-bold h-9 px-3"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
