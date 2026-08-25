"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, Home, FolderOpen, Calendar, BarChart3, Palette, Settings, Brain, X, Link2, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { BinjAiLogo } from "@/components/ui/logo"
import { UserButton } from "@clerk/nextjs"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Create Content", href: "/dashboard/create", icon: Sparkles },
  { name: "Messenger", href: "/dashboard/messenger", icon: MessageSquare },
  { name: "AI Studio", href: "/dashboard/create-ai", icon: Brain },
  { name: "Library", href: "/dashboard/library", icon: FolderOpen },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Brand Kit", href: "/dashboard/brand-kit", icon: Palette },
  { name: "Connections", href: "/dashboard/connections", icon: Link2 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()

  // Close on route change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={onClose} />}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[280px] bg-background-subtle border-r border-border z-50 lg:hidden",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center">
            <BinjAiLogo className="text-xl" />
          </Link>
          <button onClick={onClose} className="p-2 hover:bg-background rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 h-12 rounded-lg transition-all",
                  isActive
                    ? "gradient-primary text-white shadow-lg"
                    : "text-foreground-muted hover:bg-background hover:text-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
            <UserButton showName={true} />
          </div>
        </div>
      </aside>
    </>
  )
}
