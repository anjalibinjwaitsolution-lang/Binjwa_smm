"use client"

import { useState } from "react"
import { SettingsSidebar } from "@/components/settings/settings-sidebar"
import { AccountTab } from "@/components/settings/account-tab"
import { APITab } from "@/components/settings/api-tab"
import { YouTubeConsoleTab } from "@/components/settings/youtube-console-tab"
import { AIPreferencesTab } from "@/components/settings/ai-preferences-tab"
import { BillingTab } from "@/components/settings/billing-tab"
import { NotificationsTab } from "@/components/settings/notifications-tab"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account")

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-8">
      <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div>
        {activeTab === "account" && <AccountTab />}
        {activeTab === "api" && <APITab />}
        {activeTab === "youtube-console" && <YouTubeConsoleTab />}
        {activeTab === "ai" && <AIPreferencesTab />}
        {activeTab === "billing" && <BillingTab />}
        {activeTab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  )
}
