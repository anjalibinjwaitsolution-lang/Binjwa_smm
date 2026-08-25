"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, Loader2, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

import { MessageSquare, Cloud, X, Play, RefreshCw, Unlink2 } from "lucide-react"
import { PlatformIcon } from "@/components/ui/platform-icon"
import { FaTelegram } from "react-icons/fa"
import { cn } from "@/lib/utils"

export interface ConnectedAccount {
  id: string
  handle: string
  accountType: "Personal" | "Business"
  lastSynced: string
  aiEnabled?: boolean
  accessToken?: string
}

export interface Platform {
  id: string
  name: string
  connected: boolean
  accounts: ConnectedAccount[]
  permissions: string[]
}

const DEFAULT_PLATFORMS: Platform[] = [
  {
    id: "instagram",
    name: "Instagram Business",
    connected: false,
    accounts: [],
    permissions: ["Publish posts", "Read insights", "Manage comments"],
  },
  {
    id: "facebook",
    name: "Facebook Pages",
    connected: false,
    accounts: [],
    permissions: ["Publish posts", "Read insights", "Manage comments"],
  },
  {
    id: "twitter",
    name: "Twitter",
    connected: false,
    accounts: [],
    permissions: ["Publish tweets", "Read analytics"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    connected: false,
    accounts: [],
    permissions: ["Publish posts", "Read analytics"],
  },
  {
    id: "youtube",
    name: "YouTube",
    connected: false,
    accounts: [],
    permissions: ["Upload videos", "Manage playlists", "Read analytics"],
  },
  {
    id: "threads",
    name: "Threads",
    connected: false,
    accounts: [],
    permissions: ["Publish posts", "Read analytics"],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    connected: false,
    accounts: [],
    permissions: ["Publish pins", "Read analytics"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    connected: false,
    accounts: [],
    permissions: ["Send messages", "Manage templates"],
  },
  {
    id: "bluesky",
    name: "Bluesky",
    connected: false,
    accounts: [],
    permissions: ["Publish posts", "Read analytics"],
  },
  {
    id: "tiktok",
    name: "TikTok",
    connected: false,
    accounts: [],
    permissions: ["Publish videos", "Read analytics"],
  },
  {
    id: "slack",
    name: "Slack Workspaces",
    connected: false,
    accounts: [],
    permissions: ["Publish messages", "Manage channels", "Read analytics"],
  },
  {
    id: "telegram",
    name: "Telegram Channels",
    connected: false,
    accounts: [],
    permissions: ["Publish messages", "Manage bot replies", "Read analytics"],
  },
  {
    id: "discord",
    name: "Discord Servers",
    connected: false,
    accounts: [],
    permissions: ["Send messages", "Manage channels", "Read analytics"],
  },
  {
    id: "canva",
    name: "Canva Workspaces",
    connected: false,
    accounts: [],
    permissions: ["Access workspaces", "Export designs", "Publish graphics"],
  },
  {
    id: "medium",
    name: "Medium Publications",
    connected: false,
    accounts: [],
    permissions: ["Publish articles", "Read publications", "Read analytics"],
  },
  {
    id: "reddit",
    name: "Reddit Subreddits",
    connected: false,
    accounts: [],
    permissions: ["Submit posts", "Manage subreddits", "Read analytics"],
  },
  {
    id: "twitch",
    name: "Twitch Channels",
    connected: false,
    accounts: [],
    permissions: ["Announce streams", "Manage channel chat", "Read analytics"],
  },
  {
    id: "kick",
    name: "Kick Channels",
    connected: false,
    accounts: [],
    permissions: ["Announce streams", "Manage channel chat", "Read analytics"],
  }
]



export function ConnectionsTab() {
  const [hasMounted, setHasMounted] = useState(false)
  const [platforms, setPlatforms] = useState<Platform[]>(DEFAULT_PLATFORMS)

  // Dialog State for Connecting
  const [isConnectOpen, setIsConnectOpen] = useState(false)
  const [selectedPlatformToConnect, setSelectedPlatformToConnect] = useState<Platform | null>(null)
  const [handleInput, setHandleInput] = useState("")
  const [accountTypeInput, setAccountTypeInput] = useState<"Personal" | "Business">("Business")
  const [checkedPermissions, setCheckedPermissions] = useState<boolean[]>([])
  const [isConnecting, setIsConnecting] = useState(false)

  // Dialog State for Disconnecting
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false)
  const [selectedPlatformToDisconnect, setSelectedPlatformToDisconnect] = useState<Platform | null>(null)
  const [selectedAccountToDisconnect, setSelectedAccountToDisconnect] = useState<ConnectedAccount | null>(null)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [deleteHistory, setDeleteHistory] = useState(false)
  const [deleteScheduled, setDeleteScheduled] = useState(false)
  const [deleteMessages, setDeleteMessages] = useState(false)

  // Dialog State for Page Selection
  const [isPageSelectionOpen, setIsPageSelectionOpen] = useState(false)
  const [fetchedPagesForSelection, setFetchedPagesForSelection] = useState<any[]>([])
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])
  const [pendingConnectionData, setPendingConnectionData] = useState<any>(null)

  // Dialog State for Telegram Bot Token & Channel Selection
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false)
  const [telegramBotToken, setTelegramBotToken] = useState("")
  const [isSavingTelegramBot, setIsSavingTelegramBot] = useState(false)
  const [stepTelegram, setStepTelegram] = useState<'token' | 'select'>('token')
  const [discoveredTelegramChannels, setDiscoveredTelegramChannels] = useState<any[]>([])
  const [selectedTgChannelIds, setSelectedTgChannelIds] = useState<string[]>([])
  const [customChannelInput, setCustomChannelInput] = useState("")
  const [isCheckingCustomChat, setIsCheckingCustomChat] = useState(false)
  const [inlineChatInput, setInlineChatInput] = useState("")

  useEffect(() => {
    setHasMounted(true)

    // Fetch from backend API
    fetch("/api/connections", { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.platforms) {
          setPlatforms(data.platforms)
        }
      })
      .catch(err => console.error("Error fetching connections:", err))


    // Event listener for LinkedIn OAuth popup callback
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin || ''
      const isAllowed = origin === window.location.origin || 
                        origin.includes('vercel.app') || 
                        origin.includes('localhost') ||
                        (process.env.NEXT_PUBLIC_APP_URL && origin.includes(process.env.NEXT_PUBLIC_APP_URL))
      if (!isAllowed) return
      
      if (event.data.type === "LINKEDIN_AUTH_SUCCESS") {
        const { profile } = event.data
        toast.success(`Successfully connected ${profile.name}!`)
        
        // Update local state with new connected account
        setPlatforms(prev => prev.map(p => {
          if (p.id === "linkedin") {
            const newAccount: ConnectedAccount = {
              id: profile.id,
              handle: profile.name,
              accountType: "Business",
              lastSynced: "Just now",
            }
            const newAccounts = [...p.accounts.filter(a => a.id !== profile.id), newAccount]
            return {
              ...p,
              connected: true,
              accounts: newAccounts
            }
          }
          return p
        }))
        setIsConnecting(false)
        setIsConnectOpen(false)
      } else if (event.data.type === "LINKEDIN_AUTH_ERROR") {
        toast.error(`LinkedIn Connection Failed: ${event.data.error}`)
        setIsConnecting(false)
      } else if (event.data.type === "FACEBOOK_AUTH_SUCCESS") {
        const { profile } = event.data
        if (profile.fetchedPages && profile.fetchedPages.length > 0) {
          setFetchedPagesForSelection(profile.fetchedPages)
          setPendingConnectionData(profile)
          setSelectedPageIds(profile.fetchedPages.map((p: any) => p.id)) // select all by default
          setIsPageSelectionOpen(true)
        } else {
          toast.error("No Facebook pages found.")
        }
        setIsConnecting(false)
        setIsConnectOpen(false)
      } else if (event.data.type === "FACEBOOK_AUTH_ERROR") {
        toast.error(`Facebook Connection Failed: ${event.data.error}`)
        setIsConnecting(false)
      } else if (event.data.type === "TWITTER_AUTH_SUCCESS") {
        const { profile } = event.data
        toast.success(`Successfully connected ${profile.name}!`)
        
        setPlatforms(prev => prev.map(p => {
          if (p.id === "twitter") {
            const newAccount: ConnectedAccount = {
              id: profile.id,
              handle: profile.handle,
              accountType: "Business",
              lastSynced: "Just now",
            }
            const newAccounts = [...p.accounts.filter(a => a.id !== profile.id), newAccount]
            return { ...p, connected: true, accounts: newAccounts }
          }
          return p
        }))
        setIsConnecting(false)
        setIsConnectOpen(false)
      } else if (event.data.type === "TWITTER_AUTH_ERROR") {
        toast.error(`Twitter Connection Failed: ${event.data.error}`)
        setIsConnecting(false)
      } else if (event.data.type === "INSTAGRAM_AUTH_SUCCESS") {
        const { profile } = event.data
        toast.success(`Successfully connected ${profile.name || profile.username}!`)
        
        setPlatforms(prev => prev.map(p => {
          if (p.id === "instagram") {
            const newAccount: ConnectedAccount = {
              id: profile.id,
              handle: profile.username || profile.name,
              accountType: "Business",
              lastSynced: "Just now",
            }
            const newAccounts = [...p.accounts.filter(a => a.id !== profile.id), newAccount]
            return { ...p, connected: true, accounts: newAccounts }
          }
          return p
        }))
        setIsConnecting(false)
        setIsConnectOpen(false)
      } else if (event.data.type === "INSTAGRAM_AUTH_ERROR") {
        toast.error(`Instagram Connection Failed: ${event.data.error}`)
        setIsConnecting(false)
      } else if (event.data.type === "YOUTUBE_AUTH_SUCCESS") {
        const { profile } = event.data
        toast.success(`Successfully connected ${profile.name || profile.handle}!`)
        
        setPlatforms(prev => prev.map(p => {
          if (p.id === "youtube") {
            const newAccount: ConnectedAccount = {
              id: profile.id,
              handle: profile.handle || profile.name,
              accountType: "Personal", // YT is generally personal or brand channel, personal maps well here
              lastSynced: "Just now",
            }
            const newAccounts = [...p.accounts.filter(a => a.id !== profile.id), newAccount]
            return { ...p, connected: true, accounts: newAccounts }
          }
          return p
        }))
        setIsConnecting(false)
        setIsConnectOpen(false)
      } else if (event.data.type === "YOUTUBE_AUTH_ERROR") {
        toast.error(`YouTube Connection Failed: ${event.data.error}`)
        setIsConnecting(false)
      } else if (event.data.type && event.data.type.endsWith("_AUTH_SUCCESS")) {
        // Generic handler for all platforms
        const platformKey = event.data.type.split("_")[0].toLowerCase();
        const { profile } = event.data;
        toast.success(`Successfully connected ${profile?.name || profile?.username || platformKey}!`)
        
        setPlatforms(prev => prev.map(p => {
          if (p.id === platformKey) {
            const newAccount: ConnectedAccount = {
              id: profile?.id || `${platformKey}_1`,
              handle: profile?.username || profile?.name || `${platformKey} Account`,
              accountType: "Business",
              lastSynced: "Just now",
            }
            const newAccounts = [...p.accounts.filter(a => a.id !== (profile?.id || '')), newAccount]
            return { ...p, connected: true, accounts: newAccounts }
          }
          return p
        }))

        // Refetch backend connections to keep state 100% in sync
        fetch("/api/connections", { cache: 'no-store' })
          .then(res => res.json())
          .then(data => {
            if (data.platforms) setPlatforms(data.platforms)
          })
          .catch(() => {})

        setIsConnecting(false)
        setIsConnectOpen(false)
      } else if (event.data.type && event.data.type.endsWith("_AUTH_ERROR")) {
        const platformKey = event.data.type.split("_")[0].toLowerCase();
        toast.error(`${platformKey.toUpperCase()} Connection Failed: ${event.data.error}`)
        setIsConnecting(false)
      }
    }

    window.addEventListener("message", handleMessage)


    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  const handlePageSelectionSubmit = async () => {
    if (!pendingConnectionData) return
    setIsConnecting(true)

    const selectedPagesData = fetchedPagesForSelection.filter(p => selectedPageIds.includes(p.id))

    try {
      const response = await fetch('/api/connections/facebook/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionData: pendingConnectionData,
          selectedPages: selectedPagesData
        })
      })

      if (!response.ok) {
        throw new Error('Database save failed')
      }

      setPlatforms(prev => prev.map(p => {
        if (p.id === "facebook") {
          const newAccounts = selectedPagesData.map((page: any) => ({
            id: page.id,
            handle: page.name,
            accountType: "Business" as "Personal" | "Business",
            lastSynced: "Just now",
            aiEnabled: page.aiEnabled || false,
            accessToken: page.accessToken
          }))
          return { ...p, connected: true, accounts: newAccounts }
        }
        return p
      }))
      toast.success("Successfully connected selected pages!")
    } catch (e) {
      toast.error("Failed to save selected pages.")
    }

    setIsConnecting(false)
    setIsPageSelectionOpen(false)
    setPendingConnectionData(null)
    setFetchedPagesForSelection([])
  }

  const handleSaveTelegramBotToken = async () => {
    if (!telegramBotToken.trim()) {
      toast.error("Please enter a valid Telegram Bot Token from @BotFather")
      return
    }

    setIsSavingTelegramBot(true)
    try {
      if (stepTelegram === 'token') {
        const res = await fetch('/api/connections/telegram/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: telegramBotToken.trim(),
            customChannelInput: customChannelInput.trim(),
            discoverOnly: true
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to verify Telegram Bot')

        const fetched = data.fetchedChannels || []
        setDiscoveredTelegramChannels(fetched)
        setSelectedTgChannelIds(fetched.map((c: any) => c.id))
        setStepTelegram('select')
        toast.success(`Discovered ${fetched.length} channel(s) for ${data.botName}! Select channels to connect.`)
      } else {
        const res = await fetch('/api/connections/telegram/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: telegramBotToken.trim(),
            selectedChannelIds: selectedTgChannelIds
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to connect Telegram Bot')

        toast.success(`Successfully connected ${data.botName} (${data.username})!`)

        setPlatforms(prev => prev.map(p => {
          if (p.id === "telegram") {
            const newAccounts: ConnectedAccount[] = (data.channels || []).map((ch: any) => ({
              id: ch.id,
              handle: ch.name,
              accountType: "Business",
              lastSynced: "Just now"
            }))
            if (newAccounts.length === 0) {
              newAccounts.push({
                id: data.username,
                handle: data.botName,
                accountType: "Business",
                lastSynced: "Just now"
              })
            }
            return { ...p, connected: true, accounts: newAccounts }
          }
          return p
        }))

        setIsTelegramModalOpen(false)
        setStepTelegram('token')
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save Telegram Bot")
    } finally {
      setIsSavingTelegramBot(false)
    }
  }

  const handleAddCustomChatInline = async () => {
    if (!inlineChatInput.trim()) {
      toast.error("Please enter a channel username (e.g. @bhinwa_ward) or group ID")
      return
    }
    setIsCheckingCustomChat(true)
    try {
      const res = await fetch('/api/connections/telegram/check-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramBotToken.trim(),
          chatInput: inlineChatInput.trim()
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch channel details')

      const newCh = data.channel
      setDiscoveredTelegramChannels(prev => {
        if (prev.some(c => c.id === newCh.id)) return prev
        return [...prev, newCh]
      })
      setSelectedTgChannelIds(prev => prev.includes(newCh.id) ? prev : [...prev, newCh.id])
      setInlineChatInput("")
      toast.success(`Successfully fetched "${newCh.name}"!`)
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch chat details")
    } finally {
      setIsCheckingCustomChat(false)
    }
  }

  const handleConnectOpen = async (platform: Platform) => {
    if (platform.id === "telegram") {
      setIsTelegramModalOpen(true)
      setIsConnecting(false)
      return
    }

    setIsConnecting(true)

    try {
      const res = await fetch(`/api/connections/${platform.id}`, { method: 'POST' })
      const data = await res.json()
      
      if (data.url) {
        // Open in popup to allow cross-window communication
        const width = 600
        const height = 700
        const left = (window.innerWidth / 2) - (width / 2)
        const top = (window.innerHeight / 2) - (height / 2)
        window.open(data.url, 'OAuth', `width=${width},height=${height},top=${top},left=${left}`)
      } else {
        toast.error(`Failed to get OAuth URL for ${platform.name}`)
        setIsConnecting(false)
      }
    } catch (e) {
      toast.error(`Failed to connect ${platform.name}`)
      setIsConnecting(false)
    }
  }

  // Open Disconnect Dialog
  const handleDisconnectOpen = (platform: Platform, account: ConnectedAccount) => {
    setSelectedPlatformToDisconnect(platform)
    setSelectedAccountToDisconnect(account)
    setIsDisconnectOpen(true)
  }

  const handleDisconnectClose = () => {
    if (isDisconnecting) return
    setIsDisconnectOpen(false)
    setSelectedPlatformToDisconnect(null)
    setSelectedAccountToDisconnect(null)
    setDeleteHistory(false)
    setDeleteScheduled(false)
    setDeleteMessages(false)
  }

  const handleDisconnectSubmit = async () => {
    if (!selectedPlatformToDisconnect || !selectedAccountToDisconnect) return

    setIsDisconnecting(true)

    try {
      await fetch("/api/auth/disconnect-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformId: selectedPlatformToDisconnect.id,
          accountId: selectedAccountToDisconnect.id,
          deleteHistory,
          deleteScheduled,
          deleteMessages,
        })
      })

      // Also trigger specific platform disconnect route as fallback if needed
      try {
        await fetch(`/api/auth/${selectedPlatformToDisconnect.id}/disconnect`, { method: "POST" })
      } catch (e) {}

      const updatedPlatforms = platforms.map((p) => {
        if (p.id === selectedPlatformToDisconnect.id) {
          const remainingAccounts = p.accounts.filter((acc) => acc.id !== selectedAccountToDisconnect.id)
          return {
            ...p,
            connected: remainingAccounts.length > 0,
            accounts: remainingAccounts,
          }
        }
        return p
      })

      setPlatforms(updatedPlatforms)
      localStorage.setItem("social_connections", JSON.stringify(updatedPlatforms))
      setIsDisconnecting(false)
      setIsDisconnectOpen(false)
      toast.success(`Successfully disconnected ${selectedAccountToDisconnect.handle} from ${selectedPlatformToDisconnect.name}.`)
      setSelectedPlatformToDisconnect(null)
      setSelectedAccountToDisconnect(null)
      setDeleteHistory(false)
      setDeleteScheduled(false)
      setDeleteMessages(false)
    } catch (error) {
      toast.error("Failed to disconnect account.")
      setIsDisconnecting(false)
    }
  }

  if (!hasMounted) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-heading font-bold text-foreground mb-2">Connected Accounts</h2>
          <p className="text-foreground-muted">Manage your social media integrations</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-background rounded-2xl shadow-sm p-6 space-y-4 border border-border/40">
              <div className="flex items-start gap-4">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-heading font-bold text-foreground mb-2">Connected Accounts</h2>
        <p className="text-foreground-muted">Link and manage multiple social media profiles for your brand</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {platforms.map((platform) => (
          <div key={platform.id} className="bg-background rounded-2xl shadow-sm p-6 border border-border/40 flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-background-subtle flex items-center justify-center flex-shrink-0 border border-border">
                  <PlatformIcon platform={platform.id} className="w-8 h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-heading font-bold text-foreground mb-1">{platform.name}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${platform.connected ? "bg-success" : "bg-foreground-subtle/40"}`} />
                    <span className="text-foreground-muted">
                      {platform.connected ? `${platform.accounts.length} account(s) connected` : "Not connected"}
                    </span>
                  </div>
                </div>
              </div>

              {platform.connected && (
                <div className="space-y-3 mt-4 border-t border-border/20 pt-4">
                  <p className="text-sm font-semibold text-white">Connected Profiles:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {platform.accounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-background-subtle border border-border/45"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate">{account.handle}</span>
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 rounded-md border border-border/60 bg-secondary/80 text-foreground-muted font-normal">
                              {account.accountType}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-foreground-muted block mt-0.5">Synced {account.lastSynced}</span>
                        </div>
                        <button
                          onClick={() => handleDisconnectOpen(platform, account)}
                          className="p-1.5 hover:bg-error/15 text-foreground-muted hover:text-error rounded-lg transition-colors ml-2"
                          title="Disconnect account"
                        >
                          <Trash2 className="w-3.8 h-3.8" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant={platform.connected ? "outline" : "default"}
              className={`w-full h-12 rounded-xl mt-6 flex items-center justify-center gap-1.5 ${
                platform.connected
                  ? "border-border text-white hover:bg-white/5 bg-transparent"
                  : "btn-gradient text-black"
              }`}
              onClick={() => handleConnectOpen(platform)}
            >
              {platform.connected ? (
                <>
                  <Plus className="w-4 h-4" />
                  Link Another Profile
                </>
              ) : (
                "Connect Account"
              )}
            </Button>
          </div>
        ))}
      </div>


      {/* Disconnect Confirmation Dialog */}
      <Dialog open={isDisconnectOpen} onOpenChange={handleDisconnectClose}>
        <DialogContent className="sm:max-w-[400px] bg-[#0f0f0f] border-border text-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold font-heading text-white">
              Disconnect Profile?
            </DialogTitle>
            <DialogDescription className="text-foreground-muted text-sm leading-relaxed">
              Are you sure you want to disconnect <span className="text-white font-medium">{selectedAccountToDisconnect?.handle}</span> from {selectedPlatformToDisconnect?.name}?
              <br /><br />
              This will revoke access for this specific handle. Other profiles linked to {selectedPlatformToDisconnect?.name} will not be affected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="delete-history" 
                checked={deleteHistory}
                onCheckedChange={(c) => setDeleteHistory(!!c)}
              />
              <div className="space-y-1 leading-none mt-1">
                <Label htmlFor="delete-history" className="text-white font-medium cursor-pointer">
                  Remove analytics and library history
                </Label>
                <p className="text-[11px] text-foreground-muted mt-1.5">Remove all past post history and analytics associated with this page.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="delete-scheduled" 
                checked={deleteScheduled}
                onCheckedChange={(c) => setDeleteScheduled(!!c)}
              />
              <div className="space-y-1 leading-none mt-1">
                <Label htmlFor="delete-scheduled" className="text-white font-medium cursor-pointer">
                  Remove scheduled calendar posts
                </Label>
                <p className="text-[11px] text-foreground-muted mt-1.5">Remove any upcoming scheduled posts targeted for this page.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox 
                id="delete-messages" 
                checked={deleteMessages}
                onCheckedChange={(c) => setDeleteMessages(!!c)}
              />
              <div className="space-y-1 leading-none mt-1">
                <Label htmlFor="delete-messages" className="text-white font-medium cursor-pointer">
                  Remove inbox messages
                </Label>
                <p className="text-[11px] text-foreground-muted mt-1.5">Remove all stored direct messages and comment logs for this page.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="ghost"
              onClick={handleDisconnectClose}
              disabled={isDisconnecting}
              className="w-full sm:flex-1 h-12 rounded-xl border border-border text-white hover:bg-white/5 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnectSubmit}
              disabled={isDisconnecting}
              className="w-full sm:flex-1 h-12 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Selection Dialog */}
      <Dialog open={isPageSelectionOpen} onOpenChange={(open) => !isConnecting && setIsPageSelectionOpen(open)}>
        <DialogContent className="sm:max-w-[425px] bg-[#0f0f0f] border-border text-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold font-heading text-white">
              Select Pages to Connect
            </DialogTitle>
            <DialogDescription className="text-foreground-muted text-sm leading-relaxed">
              Choose which Facebook Pages you want to manage with Binjwa SSM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4 max-h-64 overflow-y-auto pr-2">
            {fetchedPagesForSelection.map((page) => (
              <div key={page.id} className="flex items-center gap-3 p-3 rounded-xl bg-background-subtle border border-border">
                <Checkbox
                  id={`page-${page.id}`}
                  checked={selectedPageIds.includes(page.id)}
                  onCheckedChange={(checked) => {
                    setSelectedPageIds(prev => 
                      checked ? [...prev, page.id] : prev.filter(id => id !== page.id)
                    )
                  }}
                  disabled={isConnecting}
                />
                <Label htmlFor={`page-${page.id}`} className="text-sm font-semibold text-white cursor-pointer flex-1">
                  {page.name}
                </Label>
              </div>
            ))}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setIsPageSelectionOpen(false)}
              disabled={isConnecting}
              className="w-full sm:flex-1 h-12 rounded-xl border border-border text-white hover:bg-white/5 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePageSelectionSubmit}
              disabled={isConnecting || selectedPageIds.length === 0}
              className="w-full sm:flex-1 h-12 rounded-xl btn-gradient text-black font-semibold flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                "Connect Selected"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Telegram Bot Token & Channel Selection Modal */}
      <Dialog open={isTelegramModalOpen} onOpenChange={(open) => { setIsTelegramModalOpen(open); if(!open) setStepTelegram('token'); }}>
        <DialogContent className="sm:max-w-[480px] bg-[#0f0f0f] border-border text-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <FaTelegram className="w-5 h-5 text-[#0088cc]" />
              {stepTelegram === 'token' ? 'Connect Telegram Bot' : 'Select Telegram Channels & Groups'}
            </DialogTitle>
            <DialogDescription className="text-foreground-muted text-sm leading-relaxed">
              {stepTelegram === 'token'
                ? 'Enter your Bot Token provided by Telegram @BotFather. All active channels and group chats owned or managed by your bot will be fetched.'
                : 'Choose explicitly which Telegram channels and group chats will be managed by Binjwa SMM & AI Auto-Reply:'}
            </DialogDescription>
          </DialogHeader>

          {stepTelegram === 'token' ? (
            <div className="space-y-4 my-4">
              <div className="space-y-2">
                <Label htmlFor="telegram-token" className="text-xs font-medium text-foreground-muted">
                  Telegram Bot Token (from @BotFather)
                </Label>
                <Input
                  id="telegram-token"
                  type="text"
                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  className="bg-background-subtle border-border text-white font-mono text-xs h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram-custom-channel" className="text-xs font-medium text-foreground-muted">
                  Add Channel / Group Username or ID (Optional)
                </Label>
                <Input
                  id="telegram-custom-channel"
                  type="text"
                  placeholder="e.g. @bhinwa_ward or -1004442633781"
                  value={customChannelInput}
                  onChange={(e) => setCustomChannelInput(e.target.value)}
                  className="bg-background-subtle border-border text-white font-mono text-xs h-11"
                />
                <p className="text-[11px] text-foreground-muted">
                  If your bot was recently created or added to a channel, enter the channel handle (e.g. <code>@bhinwa_ward</code>) to fetch its details directly live from Telegram!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 my-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add channel (@bhinwa_ward) or Group ID..."
                  value={inlineChatInput}
                  onChange={(e) => setInlineChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomChatInline(); } }}
                  className="bg-background-subtle border-border text-white text-xs h-10 flex-1 font-mono"
                />
                <Button
                  type="button"
                  onClick={handleAddCustomChatInline}
                  disabled={isCheckingCustomChat}
                  className="h-10 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white text-xs font-semibold px-4 rounded-xl flex items-center gap-1 shrink-0"
                >
                  {isCheckingCustomChat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add
                </Button>
              </div>

              <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2">
                {discoveredTelegramChannels.length === 0 ? (
                  <div className="text-xs text-foreground-muted py-6 text-center bg-background-subtle/70 rounded-xl space-y-1 px-4">
                    <p className="font-semibold text-white">No explicit channels auto-discovered yet.</p>
                    <p className="text-[11px] leading-relaxed">
                      Type your channel handle above (e.g. <code>@bhinwa_ward</code>) and click <strong>+ Add</strong> to fetch its title live from Telegram!
                    </p>
                  </div>
                ) : (
                  discoveredTelegramChannels.map((ch) => {
                    const isChecked = selectedTgChannelIds.includes(ch.id)
                    return (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setSelectedTgChannelIds(prev =>
                            isChecked ? prev.filter(id => id !== ch.id) : [...prev, ch.id]
                          )
                        }}
                        className={cn(
                          "flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all",
                          isChecked ? "bg-[#0088cc]/10 border-[#0088cc]/50" : "bg-background-subtle/50 border-border hover:bg-background-subtle"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => {}}
                            className="border-white/30 data-[state=checked]:bg-[#0088cc] data-[state=checked]:border-[#0088cc]"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">{ch.name}</span>
                            <span className="text-[11px] text-foreground-muted font-mono">{ch.id}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-[#0088cc]/20 border-[#0088cc]/40 text-sky-300">
                          {ch.id.startsWith('-') ? 'Group Chat' : 'Channel'}
                        </Badge>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                if (stepTelegram === 'select') {
                  setStepTelegram('token')
                } else {
                  setIsTelegramModalOpen(false)
                }
              }}
              disabled={isSavingTelegramBot}
              className="w-full sm:flex-1 h-11 rounded-xl border border-border text-white hover:bg-white/5 bg-transparent"
            >
              {stepTelegram === 'select' ? 'Back' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSaveTelegramBotToken}
              disabled={isSavingTelegramBot}
              className="w-full sm:flex-1 h-11 rounded-xl bg-[#0088cc] hover:bg-[#0088cc]/90 text-white font-semibold flex items-center justify-center gap-2"
            >
              {isSavingTelegramBot ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {stepTelegram === 'token' ? 'Fetching Channels...' : 'Saving Connection...'}</>
              ) : (
                stepTelegram === 'token' ? "Fetch Bot & Channels" : `Connect Selected (${selectedTgChannelIds.length})`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
