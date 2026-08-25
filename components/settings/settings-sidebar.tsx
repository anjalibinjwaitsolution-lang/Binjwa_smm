"use client"

import { User, Link2, Key, Bot, CreditCard, Bell } from "lucide-react"

interface SettingsSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const tabs = [
  { id: "account", label: "Account", icon: User },
  { id: "api", label: "API & Licensing", icon: Key },
  { id: "youtube-console", label: "YouTube Console", icon: Link2 },
  { id: "ai", label: "AI Preferences", icon: Bot },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
]

export function SettingsSidebar({ activeTab, setActiveTab }: SettingsSidebarProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-heading font-bold text-foreground mb-6">Settings</h1>
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 h-14 rounded-lg transition-all ${
              activeTab === tab.id
                ? "gradient-primary text-white shadow-lg"
                : "text-foreground hover:bg-background-subtle"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
