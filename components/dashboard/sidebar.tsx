"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Sparkles, Home, FolderOpen, Calendar, BarChart3, Palette, Settings, Brain, Link2, MessageSquare, CreditCard, LogOut, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { BinjAiLogo } from "@/components/ui/logo"
import { useEffect, useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Create Content", href: "/dashboard/create", icon: Sparkles },
  { name: "Inbox", href: "/dashboard/inbox", icon: MessageSquare },
  { name: "Messenger", href: "/dashboard/messenger", icon: Bot },
  { name: "AI Studio", href: "/dashboard/create-ai", icon: Brain },
  { name: "Library", href: "/dashboard/library", icon: FolderOpen },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Brand Kit", href: "/dashboard/brand-kit", icon: Palette },
  { name: "Connections", href: "/dashboard/connections", icon: Link2 },
  { name: "Support Tickets", href: "/dashboard/tickets", icon: MessageSquare },
  { name: "Plan", href: "/dashboard/plan", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [username, setUsername] = useState<string>("")

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "User")
  }, [])

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("userId")
    localStorage.removeItem("username")
    router.push("/login")
  }

  return (
    <aside className="max-lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-background-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-border">
        <Link href="/dashboard" className="flex items-center">
          <BinjAiLogo className="text-2xl" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 h-12 rounded-xl transition-all font-medium",
                isActive ? "bg-white text-black shadow-lg" : "text-foreground-muted hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Card */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#F16522]/20 text-[#F16522] flex items-center justify-center font-bold uppercase">
               {username.charAt(0)}
             </div>
             <span className="text-sm font-medium text-white truncate max-w-[100px]">{username}</span>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-red-400 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
