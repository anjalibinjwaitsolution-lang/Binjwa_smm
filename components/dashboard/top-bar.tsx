"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Bell, HelpCircle, Trash2, Info, LifeBuoy, Headset, Loader2, User, ShieldAlert, Package, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { fetchApi } from "@/lib/api"

interface NotificationItem {
  id: string
  text: string
  time: string
  read: boolean
}

export function DashboardTopBar() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Mock Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: "1", text: "Your scheduled Instagram post is ready to publish.", time: "10m ago", read: false },
    { id: "2", text: "AI successfully completed training on your brand voice guidelines.", time: "2h ago", read: false },
    { id: "3", text: "Weekly analytics performance report is ready.", time: "1d ago", read: true },
  ])

  const notifRef = useRef<HTMLDivElement>(null)
  const helpRef = useRef<HTMLDivElement>(null)

  // Click outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setShowHelp(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        try {
          const results = await fetchApi(`/search?q=${encodeURIComponent(searchQuery)}`)
          setSearchResults(results)
          setShowSearch(true)
        } catch (error) {
          console.error("Search failed", error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults(null)
        setShowSearch(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const toggleRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n)))
  }

  const deleteNotif = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-[280px] h-20 bg-background-card/80 backdrop-blur-xl border-b border-border z-40">
      <div className="h-full px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Mobile Spacer / Mini-Logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-orange to-accent-green flex items-center justify-center shadow-glow">
            <span className="text-white text-sm font-bold">SG</span>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
            <Input
              type="search"
              placeholder="Search users, admins, plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchQuery.length >= 2) setShowSearch(true) }}
              className="w-full h-12 pl-12 rounded-full bg-white/5 border-white/10 text-white placeholder:text-foreground-muted focus:border-primary/50"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
            )}
            
            {showSearch && searchResults && (
              <div className="absolute top-full left-0 mt-2 w-full bg-background-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="max-h-96 overflow-y-auto p-2">
                  
                  {searchResults.users?.length > 0 && (
                    <div className="mb-2">
                      <h4 className="text-xs font-semibold text-foreground-muted px-3 py-2 uppercase tracking-wider">Users</h4>
                      {searchResults.users.map((u: any) => (
                        <div key={u._id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer" onClick={() => router.push(`/super-admin/users/${u._id}/analytics`)}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20"><User className="w-4 h-4"/></div>
                            <div>
                              <p className="text-sm font-medium text-white">{u.username}</p>
                              <p className="text-xs text-foreground-muted">{u.email}</p>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-foreground-muted" />
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.admins?.length > 0 && (
                    <div className="mb-2">
                      <h4 className="text-xs font-semibold text-foreground-muted px-3 py-2 uppercase tracking-wider">Admins</h4>
                      {searchResults.admins.map((a: any) => (
                        <div key={a._id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer" onClick={() => router.push(`/super-admin/manage-admins`)}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20"><ShieldAlert className="w-4 h-4"/></div>
                            <div>
                              <p className="text-sm font-medium text-white">{a.username}</p>
                              <p className="text-xs text-foreground-muted">{a.email}</p>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-foreground-muted" />
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.plans?.length > 0 && (
                    <div className="mb-2">
                      <h4 className="text-xs font-semibold text-foreground-muted px-3 py-2 uppercase tracking-wider">Plans</h4>
                      {searchResults.plans.map((p: any) => (
                        <div key={p._id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer" onClick={() => router.push(`/super-admin/plans`)}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20"><Package className="w-4 h-4"/></div>
                            <div>
                              <p className="text-sm font-medium text-white">{p.name}</p>
                              <p className="text-xs text-foreground-muted">${p.price}/mo</p>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-foreground-muted" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!searchResults.users?.length && !searchResults.admins?.length && !searchResults.plans?.length && (
                    <div className="p-4 text-center text-sm text-foreground-muted">
                      No results found for "{searchQuery}"
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-3">
          {/* Notifications Button */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowHelp(false)
              }}
              className={`relative rounded-full h-12 w-12 hover:bg-white/5 transition-all ${
                showNotifications ? "bg-white/5 text-primary" : ""
              }`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-background-card" />
              )}
            </Button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-background-card border border-border rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-border/60">
                  <span className="font-heading font-bold text-white text-sm">Notifications ({unreadCount} new)</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-foreground-muted">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => toggleRead(notif.id)}
                        className={`p-3 text-xs hover:bg-white/5 cursor-pointer flex gap-3 transition-colors ${
                          !notif.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex-1 space-y-1">
                          <p className={`text-white ${!notif.read ? "font-semibold" : "text-foreground-muted"}`}>
                            {notif.text}
                          </p>
                          <span className="text-[10px] text-foreground-muted">{notif.time}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotif(notif.id)
                          }}
                          className="text-foreground-muted hover:text-error self-center p-1 rounded hover:bg-background-subtle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Support Tickets Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              title="Support Tickets"
              onClick={() => {
                const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
                if (role === "SUPER_ADMIN") {
                  router.push("/super-admin/tickets");
                } else if (role === "ADMIN") {
                  router.push("/admin/tickets");
                } else {
                  router.push("/dashboard/tickets");
                }
              }}
              className="rounded-full h-12 w-12 hidden sm:flex hover:bg-white/5 hover:text-primary transition-all"
            >
              <Headset className="w-5 h-5" />
            </Button>
          </div>

          {/* Help Button */}
          <div className="relative" ref={helpRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowHelp(!showHelp)
                setShowNotifications(false)
              }}
              className={`rounded-full h-12 w-12 hidden sm:flex hover:bg-white/5 transition-all ${
                showHelp ? "bg-white/5 text-primary" : ""
              }`}
            >
              <HelpCircle className="w-5 h-5" />
            </Button>

            {showHelp && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-background-card border border-border rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-border/60">
                  <span className="font-heading font-bold text-white text-sm">Help & Support</span>
                </div>
                <div className="py-1">
                  <a
                    href="#docs"
                    onClick={(e) => { e.preventDefault(); alert("Help Center / Documentation coming soon!") }}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-foreground-muted hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Info className="w-4 h-4 text-foreground-muted" />
                    Documentation
                  </a>
                  <a
                    href="#support"
                    onClick={(e) => { e.preventDefault(); alert("Support chat is currently offline. Please email support@binj.ai") }}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-foreground-muted hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LifeBuoy className="w-4 h-4 text-foreground-muted" />
                    Contact Support
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Profile Button */}
          <div className="relative flex items-center justify-center h-12 w-12 cursor-pointer group">
             <div className="w-10 h-10 rounded-full bg-[#F16522]/20 text-[#F16522] flex items-center justify-center font-bold uppercase border border-[#F16522]/30 group-hover:bg-[#F16522]/40 transition-colors">
               U
             </div>
             {/* Dropdown Menu on Hover */}
             <div className="absolute top-full right-0 mt-2 w-48 bg-background-card border border-border rounded-xl shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => {
                    localStorage.removeItem("token")
                    localStorage.removeItem("role")
                    localStorage.removeItem("userId")
                    localStorage.removeItem("username")
                    window.location.href = "/login"
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                >
                  Sign Out
                </button>
             </div>
          </div>
        </div>
      </div>
    </header>
  )
}
