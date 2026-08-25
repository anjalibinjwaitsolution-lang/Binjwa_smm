"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Check } from "lucide-react"

export function NotificationsTab() {
  const [settings, setSettings] = useState({
    emailWeekly: true,
    emailProduct: false,
    emailMonthly: true,
    pushPublished: true,
    pushReady: true,
    pushWeekly: false,
    pushMetrics: true,
  })

  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveStatus("Notification preferences saved!")
    setTimeout(() => setSaveStatus(null), 3000)
  }

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="bg-background-card border border-border/50 rounded-2xl p-6 lg:p-8 space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Notification Preferences</h2>
        <p className="text-sm text-foreground-muted">Configure how and when you receive email digests and push alerts</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-xl">
        {/* Email Notifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-primary">Email Digests</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="emailWeekly"
                checked={settings.emailWeekly}
                onCheckedChange={() => toggle("emailWeekly")}
                className="mt-0.5"
              />
              <div className="grid gap-1">
                <label htmlFor="emailWeekly" className="text-sm font-semibold text-white cursor-pointer select-none">
                  Weekly performance summary
                </label>
                <p className="text-xs text-foreground-muted">Get a summary digest of all your posts' performance every Monday morning</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="emailProduct"
                checked={settings.emailProduct}
                onCheckedChange={() => toggle("emailProduct")}
                className="mt-0.5"
              />
              <div className="grid gap-1">
                <label htmlFor="emailProduct" className="text-sm font-semibold text-white cursor-pointer select-none">
                  Product updates & feature releases
                </label>
                <p className="text-xs text-foreground-muted">Stay informed about new AI models and dashboard features</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="emailMonthly"
                checked={settings.emailMonthly}
                onCheckedChange={() => toggle("emailMonthly")}
                className="mt-0.5"
              />
              <div className="grid gap-1">
                <label htmlFor="emailMonthly" className="text-sm font-semibold text-white cursor-pointer select-none">
                  Monthly invoices & billing updates
                </label>
                <p className="text-xs text-foreground-muted">Receive account invoices, billing change receipts, or payment alerts</p>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-border/40" />

        {/* Push Notifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-secondary">Browser Push Alerts</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="pushPublished"
                checked={settings.pushPublished}
                onCheckedChange={() => toggle("pushPublished")}
                className="mt-0.5"
              />
              <div className="grid gap-1">
                <label htmlFor="pushPublished" className="text-sm font-semibold text-white cursor-pointer select-none">
                  Successful publication notifications
                </label>
                <p className="text-xs text-foreground-muted">Get alerted in real-time as scheduled posts are successfully shared</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="pushReady"
                checked={settings.pushReady}
                onCheckedChange={() => toggle("pushReady")}
                className="mt-0.5"
              />
              <div className="grid gap-1">
                <label htmlFor="pushReady" className="text-sm font-semibold text-white cursor-pointer select-none">
                  AI copywriting completions
                </label>
                <p className="text-xs text-foreground-muted">Alert me as soon as complex AI studio campaigns are ready for review</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="pushMetrics"
                checked={settings.pushMetrics}
                onCheckedChange={() => toggle("pushMetrics")}
                className="mt-0.5"
              />
              <div className="grid gap-1">
                <label htmlFor="pushMetrics" className="text-sm font-semibold text-white cursor-pointer select-none">
                  Viral engagement spikes
                </label>
                <p className="text-xs text-foreground-muted">Get alerted if any post spikes by 100%+ in comments or likes activity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-4 pt-4 border-t border-border/40">
          <Button
            type="submit"
            className="bg-white text-black hover:bg-[#f5f5f5] transition-colors rounded-xl h-11 px-8 font-semibold shadow-lg"
          >
            Save Preferences
          </Button>

          {saveStatus && (
            <span className="text-success text-sm font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
              <Check className="w-4 h-4" />
              {saveStatus}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
