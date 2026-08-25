"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Sparkles, Brain, FolderOpen, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const mobileNavigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Create", href: "/dashboard/create", icon: Sparkles },
  { name: "AI Studio", href: "/dashboard/create-ai", icon: Brain },
  { name: "Library", href: "/dashboard/library", icon: FolderOpen },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background-card/95 backdrop-blur-xl border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-20 px-2">
        {mobileNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all min-w-[68px]",
                isActive ? "text-white bg-white/10" : "text-foreground-muted hover:text-white hover:bg-white/5",
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "scale-110")} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
