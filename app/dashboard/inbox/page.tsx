"use client"

import { useState, useEffect, useRef } from "react"
import {
  Inbox,
  User,
  Bot,
  Clock,
  Send,
  MessageCircle,
  Search,
  CheckCircle2,
  Edit2,
  Sparkles,
  UserCheck,
  Filter,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  MessageSquare,
  Pin,
  PhoneCall,
  Cloud,
  Video,
  AlertCircle,
  X,
  Check,
  ArrowLeft,
  Grid,
  ChevronRight,
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
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

function formatMessageTime(timeInput?: string | Date): string {
  if (!timeInput) return 'Just now'
  try {
    const d = new Date(timeInput)
    if (isNaN(d.getTime())) return 'Recently'

    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })

    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()

    if (isToday) {
      return timeStr
    }

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${timeStr}`
    }

    const monthDay = d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    return `${monthDay}, ${timeStr}`
  } catch (e) {
    return 'Recently'
  }
}

interface InboxMessage {
  id: string
  sender: 'customer' | 'ai' | 'admin'
  senderName?: string
  text: string
  timestamp: string
  isEdited?: boolean
  mediaUrl?: string
  mediaType?: 'image' | 'video' | 'document' | 'audio'
  mediaName?: string
  reactions?: string
}

interface InboxConversation {
  id: string
  personName: string
  personHandle: string
  personAvatar: string
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'Twitter' | 'YouTube' | 'Threads' | 'Pinterest' | 'WhatsApp' | 'Bluesky' | 'TikTok' | string
  type: 'dm' | 'comment'
  postCaption?: string
  aiAutoReplyActive: boolean
  needsReview: boolean
  unreadCount: number
  updatedAt: string
  messages: InboxMessage[]
}

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

export default function InboxPage() {
  const [conversations, setConversations] = useState<InboxConversation[]>([])
  const [activePlatform, setActivePlatform] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<'all' | 'review' | 'comments' | 'dms'>('all')
  const [replyText, setReplyText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedConversation = conversations.find(c => c.id === selectedId) || null

  // Auto-scroll to bottom of chat thread when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

  useEffect(() => {
    fetchConversations()

    // 1. Subscribe to Supabase Realtime push events for instant push updates
    const channel = supabase
      .channel('realtime-inbox-logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_logs' }, () => {
        fetchConversations()
      })
      .subscribe()

    // 2. Fast background polling fallback (every 2.5 seconds)
    const interval = setInterval(() => {
      fetchConversations()
    }, 2500)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  // Auto-select first conversation so input chatbox and controls are immediately active
  useEffect(() => {
    if (conversations.length > 0) {
      if (!selectedId || !conversations.some(c => c.id === selectedId)) {
        const matching = activePlatform
          ? conversations.find(c => matchesPlatform(c.platform, activePlatform))
          : conversations[0]
        if (matching) {
          setSelectedId(matching.id)
        }
      }
    }
  }, [conversations, activePlatform, selectedId])

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/inbox")
      if (res.ok) {
        const data = await res.json()
        const convList = Array.isArray(data) ? data : (data.conversations || [])
        if (Array.isArray(convList)) {
          setConversations(convList)
        }
      }
    } catch (err) {
      console.error("Failed to fetch inbox:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPlatform = (platform: string | null) => {
    setActivePlatform(platform)
    if (platform) {
      const platformConvs = conversations.filter(
        c => c.platform.toLowerCase() === platform.toLowerCase()
      )
      if (platformConvs.length > 0) {
        setSelectedId(platformConvs[0].id)
      } else {
        setSelectedId(null)
      }
    } else {
      setSelectedId(null)
    }
  }

  const activePlatformData = SOCIAL_PLATFORMS.find(
    p => p.id.toLowerCase() === activePlatform?.toLowerCase()
  )

  const getPlatformIcon = (platform: string, className = "w-4 h-4") => {
    const p = SOCIAL_PLATFORMS.find(p => p.id.toLowerCase() === platform.toLowerCase())
    if (!p) return <Linkedin className={className} />
    const IconComponent = p.icon
    return <IconComponent className={cn(className, p.color)} />
  }

  const matchesPlatform = (convPlat: string, targetPlat: string) => {
    const c = (convPlat || "").toLowerCase()
    const t = (targetPlat || "").toLowerCase()
    return c === t || c.includes(t) || t.includes(c)
  }

  const platformConversations = activePlatform
    ? conversations.filter(conv => matchesPlatform(conv.platform, activePlatform))
    : []

  const filteredConversations = platformConversations.filter(conv => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      conv.personName.toLowerCase().includes(query) ||
      conv.personHandle.toLowerCase().includes(query) ||
      conv.messages.some(m => m.text.toLowerCase().includes(query)) ||
      (conv.postCaption && conv.postCaption.toLowerCase().includes(query))

    if (!matchesSearch) return false

    if (filter === 'review') return conv.needsReview
    if (filter === 'comments') return conv.type === 'comment'
    if (filter === 'dms') return conv.type === 'dm'
    return true
  })

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return
    const textToSend = replyText.trim()
    setReplyText("")
    setIsSending(true)

    const newMsg: InboxMessage = {
      id: `msg-admin-${Date.now()}`,
      sender: 'admin',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Immediately update UI state so message never vanishes
    setConversations(prev =>
      prev.map(c => (c.id === selectedConversation.id ? { ...c, messages: [...c.messages, newMsg] } : c))
    )

    try {
      const res = await fetch("/api/inbox/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          pageId: selectedConversation.personHandle || selectedConversation.id,
          senderId: selectedConversation.id,
          messageText: textToSend
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.conversations && Array.isArray(data.conversations) && data.conversations.length > 0) {
          setConversations(data.conversations)
        }
        toast.success("Reply sent live to Telegram!")
      } else {
        toast.error("Failed to deliver reply")
      }
    } catch (err) {
      toast.error("Error sending reply")
    } finally {
      setIsSending(false)
    }
  }

  const handleGenerateAIReply = () => {
    if (!selectedConversation) return
    const customerMsg = [...selectedConversation.messages].reverse().find(m => m.sender === 'customer')
    const customerText = customerMsg ? customerMsg.text : "your inquiry"

    let aiSuggestion = `Thanks for reaching out! We can certainly help you with that. Would you like our team to schedule a quick walk-through?`
    if (customerText.toLowerCase().includes("price") || customerText.toLowerCase().includes("pricing") || customerText.toLowerCase().includes("plan")) {
      aiSuggestion = `Hi ${selectedConversation.personName}! Our pricing starts at Free for 3 profiles, with Growth plans at $49/mo for unlimited AI features and 15 profiles. Would you like a 14-day trial link?`
    } else if (customerText.toLowerCase().includes("reel") || customerText.toLowerCase().includes("video")) {
      aiSuggestion = `Hey ${selectedConversation.personName}! Yes, you can upload MP4/MOV reels, pick custom covers, and schedule across Instagram, Facebook, and LinkedIn seamlessly.`
    } else if (customerText.toLowerCase().includes("role") || customerText.toLowerCase().includes("admin")) {
      aiSuggestion = `Hi ${selectedConversation.personName}! Yes, our Role-Based Access Control is completely live with dedicated Super Admin and Admin dashboards.`
    }

    setReplyText(aiSuggestion)
    toast.success("AI generated a tailored reply suggestion!")
  }

  const handleSaveEditMessage = async (msgId: string) => {
    if (!editText.trim() || !selectedConversation) return
    try {
      const res = await fetch("/api/inbox/edit-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          messageId: msgId,
          newText: editText
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.conversations) {
          setConversations(data.conversations)
        } else {
          await fetchConversations()
        }
        setEditingMessageId(null)
        setEditText("")
        toast.success("Reply edited successfully!")
      }
    } catch (err) {
      toast.error("Failed to edit reply")
    }
  }

  const handleToggleAI = async (convId: string, active: boolean) => {
    try {
      const res = await fetch("/api/inbox/toggle-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, active })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.conversations) {
          setConversations(data.conversations)
        }
        toast.success(
          active
            ? "AI Auto-Reply resumed for this conversation"
            : "AI Auto-Reply paused. You are now in manual control."
        )
      }
    } catch (err) {
      toast.error("Failed to toggle AI Auto-Reply")
    }
  }


  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold text-foreground mb-2 flex items-center gap-2">
            <Inbox className="w-8 h-8 text-primary" />
            AI Inbox & Messenger
          </h2>
          <p className="text-foreground-muted">
            Separate chatboxes for every platform. Click any platform icon to open its inbox and reply to DMs & Comments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activePlatform && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectPlatform(null)}
              className="border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
            >
              <Grid className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchConversations}
            className="border-border hover:bg-white/5"
          >
            Refresh Inbox
          </Button>
        </div>
      </div>

      {/* Horizontal Platform Icon Switcher Bar */}
      <div className="bg-background-subtle/40 border border-border rounded-2xl p-3 backdrop-blur-xl flex items-center gap-2 overflow-x-auto shadow-lg">
        <button
          onClick={() => handleSelectPlatform(null)}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
            !activePlatform
              ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
              : "bg-background/40 text-foreground-muted hover:text-foreground hover:bg-white/5"
          )}
        >
          <Grid className="w-4 h-4" />
          All Platforms ({conversations.length})
        </button>
        <div className="h-6 w-px bg-border flex-shrink-0" />
        {SOCIAL_PLATFORMS.map((p) => {
          const count = conversations.filter(c => matchesPlatform(c.platform, p.id)).length
          const isSelected = activePlatform?.toLowerCase() === p.id.toLowerCase()
          const Icon = p.icon
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPlatform(p.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border",
                isSelected
                  ? "bg-white/10 border-primary text-foreground shadow-md font-semibold scale-[1.03]"
                  : "bg-background/30 border-transparent text-foreground-muted hover:text-foreground hover:bg-white/5 hover:border-border"
              )}
            >
              <Icon className={cn("w-4 h-4", p.color)} />
              <span>{p.name}</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                isSelected ? "bg-primary/30 text-primary" : "bg-white/5 text-foreground-muted"
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* View 1: ALL PLATFORMS HUB (When activePlatform === null) */}
      {!activePlatform ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Grid className="w-5 h-5 text-primary" />
              Select a Platform Inbox
            </h3>
            <span className="text-xs text-foreground-muted">
              Click any platform card or icon above to inspect and manage person-specific DMs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {SOCIAL_PLATFORMS.map((p) => {
              const pConvs = conversations.filter(c => matchesPlatform(c.platform, p.id))
              const unreadCount = pConvs.reduce((acc, curr) => acc + curr.unreadCount, 0)
              const dmCount = pConvs.filter(c => c.type === 'dm').length
              const commentCount = pConvs.filter(c => c.type === 'comment').length
              const Icon = p.icon

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPlatform(p.id)}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl",
                    p.border,
                    p.bg
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-background/80 border border-border/80 shadow-md">
                      <Icon className={cn("w-6 h-6", p.color)} />
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow-sm animate-pulse">
                        {unreadCount} Unread
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {p.name}
                  </h4>

                  <p className="text-xs text-foreground-muted mb-4">
                    {pConvs.length === 0 ? "No active conversations" : `${pConvs.length} Active Conversations`}
                  </p>

                  <div className="flex items-center justify-between text-xs border-t border-border/40 pt-3 text-foreground-muted">
                    <div className="flex items-center gap-3">
                      <span>{dmCount} DMs</span>
                      <span>•</span>
                      <span>{commentCount} Comments</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* View 2: SPECIFIC PLATFORM INBOX (When activePlatform is selected) */
        <div className="space-y-4">
          {/* Top Back Header for specific Platform */}
          <div className="flex items-center justify-between bg-background-subtle/50 border border-border px-5 py-3 rounded-2xl">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectPlatform(null)}
                className="gap-1.5 text-foreground-muted hover:text-foreground hover:bg-white/5 -ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>All Platforms</span>
              </Button>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                {getPlatformIcon(activePlatform, "w-5 h-5")}
                <h3 className="font-bold text-foreground text-lg">
                  {activePlatformData?.name || activePlatform} Inbox
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                  {platformConversations.length} People
                </span>
              </div>
            </div>

            <span className="text-xs text-foreground-muted hidden md:inline">
              Clicking a person's DM opens their conversation on the right
            </span>
          </div>

          {/* Main 2-Column Chat Interface for That Platform */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[calc(100vh-170px)] min-h-[600px] rounded-2xl border border-border bg-background-subtle/40 backdrop-blur-xl overflow-hidden shadow-2xl">
            {/* Left Column: People / DM List for This Platform */}
            <div className="lg:col-span-4 border-r border-border flex flex-col h-full min-h-0 bg-background-subtle/30">
              {/* Search bar & filter pills */}
              <div className="p-4 border-b border-border space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-foreground-muted" />
                  <Input
                    placeholder={`Search ${activePlatform} people & DMs...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background/60 border-border text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-2.5 text-foreground-muted hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'review', label: 'Needs Review' },
                    { id: 'dms', label: 'DMs' },
                    { id: 'comments', label: ['slack', 'telegram', 'discord'].includes(activePlatform?.toLowerCase() || '') ? 'Channels' : 'Comments' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id as any)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                        filter === tab.id
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-background/40 text-foreground-muted hover:text-foreground hover:bg-background/70"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* People DM List Scroll Area */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border/40">
                {isLoading ? (
                  <div className="p-8 text-center text-foreground-muted text-sm">
                    Loading {activePlatform} conversations...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-foreground-muted text-sm space-y-3">
                    <MessageCircle className="w-8 h-8 mx-auto text-foreground-muted/40" />
                    <p className="font-semibold text-foreground">No real conversations yet</p>
                    <p className="text-xs">
                      When customers message or comment on your connected {activePlatform} account, real-time conversations will appear here.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = "/dashboard/messenger"
                      }}
                      className="border-primary/50 text-primary hover:bg-primary/10 gap-1.5 mt-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Open AI Messenger & Simulator
                    </Button>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = selectedId === conv.id
                    const lastMsg = conv.messages[conv.messages.length - 1]
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedId(conv.id)}
                        className={cn(
                          "p-4 cursor-pointer transition-all hover:bg-white/5 flex items-start gap-3",
                          isSelected && "bg-white/10 border-l-4 border-l-primary"
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={conv.personAvatar}
                            alt={conv.personName}
                            className="w-11 h-11 rounded-full object-cover border border-border"
                          />
                          <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-background border border-border">
                            {getPlatformIcon(conv.platform)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {conv.personName}
                            </span>
                            <span className="text-[11px] text-foreground-muted whitespace-nowrap">
                              {lastMsg?.timestamp || "Recently"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs text-foreground-muted truncate">
                              {conv.personHandle}
                            </span>
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1",
                                conv.type === "dm"
                                  ? "bg-purple-500/20 text-purple-300"
                                  : "bg-blue-500/20 text-blue-300"
                              )}
                            >
                              {conv.type === "dm"
                                ? "DM"
                                : (["slack", "telegram", "discord"].includes(conv.platform.toLowerCase()) ? "Channel" : "Comment")}
                            </span>
                          </div>

                          <p className="text-xs text-foreground-muted truncate">
                            {lastMsg?.text || "No messages yet"}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                                conv.aiAutoReplyActive
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              )}
                            >
                              {conv.aiAutoReplyActive ? (
                                <>
                                  <Bot className="w-3 h-3" /> AI Active
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3" /> Manual
                                </>
                              )}
                            </span>

                            {conv.needsReview && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-medium">
                                <AlertCircle className="w-3 h-3" /> Review
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right Column: Person DM Section & Manual Control */}
            <div className="lg:col-span-8 flex flex-col h-full min-h-0 bg-background/40">
              {selectedConversation ? (
                <>
                  {/* Top Bar of Person DM */}
                  <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background/60">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedConversation.personAvatar}
                        alt={selectedConversation.personName}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground">
                            {selectedConversation.personName}
                          </h3>
                          {getPlatformIcon(selectedConversation.platform)}
                        </div>
                        <div className="text-xs text-foreground-muted flex items-center gap-2">
                          <span>{selectedConversation.personHandle}</span>
                          <span>•</span>
                          <span className="capitalize">
                            {selectedConversation.platform} {selectedConversation.type === "dm" ? "Direct Message (DM)" : "Feed Comment"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Auto-Reply Manual Control Switch */}
                    <div className="flex items-center gap-3 bg-background-subtle/80 border border-border px-3.5 py-2 rounded-xl">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          {selectedConversation.aiAutoReplyActive ? (
                            <>
                              <Bot className="w-3.5 h-3.5 text-emerald-400" />
                              AI Auto-Reply Enabled
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                              Manual Control (AI Paused)
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-foreground-muted">
                          {selectedConversation.aiAutoReplyActive
                            ? "AI replies automatically"
                            : "You control replies manually"}
                        </div>
                      </div>
                      <Switch
                        checked={selectedConversation.aiAutoReplyActive}
                        onCheckedChange={(val) => handleToggleAI(selectedConversation.id, val)}
                      />
                    </div>
                  </div>

                  {/* Post reference if comment */}
                  {selectedConversation.postCaption && (
                    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between text-xs text-primary">
                      <span className="truncate">
                        <strong>Commented on Post:</strong> "{selectedConversation.postCaption}"
                      </span>
                    </div>
                  )}

                  {/* Chat Messages History */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                    {selectedConversation.messages.map((msg) => {
                      const isCustomer = msg.sender === "customer"
                      const isEditing = editingMessageId === msg.id

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col max-w-[80%] space-y-1",
                            isCustomer ? "items-start" : "items-end ml-auto"
                          )}
                        >
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
                              {isCustomer
                                ? (msg.senderName || selectedConversation.personName)
                                : msg.sender === "ai"
                                ? "AI Auto-Reply"
                                : "Admin Reply"}
                            </span>
                            <span className="text-[11px] text-foreground-muted">
                              {formatMessageTime(msg.timestamp)}
                            </span>
                            {msg.isEdited && (
                              <span className="text-[10px] text-primary italic">
                                (edited)
                              </span>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="w-full min-w-[280px] bg-background border border-border rounded-xl p-3 space-y-2">
                              <Textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="text-sm min-h-[70px] bg-background-subtle"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingMessageId(null)}
                                  className="text-xs h-7"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEditMessage(msg.id)}
                                  className="text-xs h-7 bg-primary hover:bg-primary/90"
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "p-4 rounded-2xl text-sm leading-relaxed shadow-md relative group transition-all",
                                isCustomer
                                  ? "bg-background-subtle/80 text-foreground border border-border/60 rounded-tl-none"
                                  : msg.sender === "ai"
                                  ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border border-blue-500/30 rounded-tr-none"
                                  : "bg-primary/20 text-white border border-primary/30 rounded-tr-none"
                              )}
                            >
                              {msg.mediaUrl && (
                                <div className="mb-2 rounded-xl overflow-hidden border border-white/10 max-w-xs">
                                  {msg.mediaType === "video" ? (
                                    <video src={msg.mediaUrl} controls className="max-h-56 w-full object-cover rounded-xl" />
                                  ) : msg.mediaType === "audio" ? (
                                    <audio src={msg.mediaUrl} controls className="w-full" />
                                  ) : (
                                    <img src={msg.mediaUrl} alt={msg.mediaName || "Attachment"} className="max-h-56 w-full object-cover rounded-xl" />
                                  )}
                                </div>
                              )}
                              <p className="whitespace-pre-wrap">{msg.text}</p>

                              {msg.reactions && (
                                <div className="mt-1 flex items-center gap-1 bg-background/80 border border-white/10 px-2 py-0.5 rounded-full text-xs w-fit shadow-sm">
                                  <span>{msg.reactions}</span>
                                </div>
                              )}

                              {!isCustomer && (
                                <button
                                  onClick={() => {
                                    setEditingMessageId(msg.id)
                                    setEditText(msg.text)
                                  }}
                                  className="absolute -top-3 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border text-foreground px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 shadow-md hover:bg-white/10"
                                >
                                  <Edit2 className="w-3 h-3 text-primary" />
                                  Edit Reply
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Composer Input Bar */}
                  <div className="flex-shrink-0 p-4 border-t border-border bg-background/90 backdrop-blur-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateAIReply}
                          className="border-primary/40 text-primary hover:bg-primary/10 text-xs flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Generate AI Reply
                        </Button>
                      </div>

                      <span className="text-[11px] text-foreground-muted">
                        Press Shift + Enter for new line
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Textarea
                        placeholder={`Reply to ${selectedConversation.personName} (${selectedConversation.platform} ${selectedConversation.type === "dm" ? "DM" : "Comment"})...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendReply()
                          }
                        }}
                        className="min-h-[64px] max-h-[140px] text-sm bg-background/60 border-border"
                      />
                      <Button
                        onClick={handleSendReply}
                        disabled={isSending || !replyText.trim()}
                        className="h-auto px-6 bg-primary hover:bg-primary/90 flex flex-col items-center justify-center gap-1"
                      >
                        <Send className="w-4 h-4" />
                        <span className="text-xs">Send</span>
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col p-6 space-y-4 bg-background/60">
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                      <MessageCircle className="w-10 h-10 mx-auto" />
                    </div>
                    <h4 className="font-bold text-foreground text-lg">Send Live Message / Direct Reply</h4>
                    <p className="text-xs text-foreground-muted max-w-sm">
                      Select any conversation on the left to inspect multi-turn history, or use the live composer below to send a message directly to your connected {activePlatform || 'Social'} channel!
                    </p>
                  </div>

                  <div className="border border-border rounded-2xl p-4 bg-background-subtle/80 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-primary" />
                        Quick Reply Composer
                      </span>
                      <span className="text-[11px] text-foreground-muted">Delivers live via Webhook API</span>
                    </div>

                    <Textarea
                      placeholder={`Type your reply to send live to ${activePlatform || 'Telegram'}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="min-h-[80px] text-sm bg-background border-border"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateAIReply}
                        className="border-primary/40 text-primary hover:bg-primary/10 text-xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Suggest AI Reply
                      </Button>

                      <Button
                        onClick={() => {
                          if (filteredConversations.length > 0) {
                            setSelectedId(filteredConversations[0].id)
                            handleSendReply()
                          } else {
                            toast.error("Please connect a channel or select a conversation first")
                          }
                        }}
                        disabled={isSending || !replyText.trim()}
                        className="bg-primary hover:bg-primary/90 text-xs px-5 gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Live Reply
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
