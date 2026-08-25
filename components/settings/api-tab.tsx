"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Copy, RefreshCw, Upload } from "lucide-react"

export function APITab() {
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold text-foreground mb-2">API & Licensing</h2>
        <p className="text-foreground-muted">Manage your API access and white-label settings</p>
      </div>

      {/* API Access */}
      <div className="bg-background rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="text-xl font-heading font-bold text-foreground">API Access</h3>

        <div className="space-y-2">
          <Label>Your API Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                value="sk_live_1a2b3c4d5e6f7g8h9i0j"
                readOnly
                className="h-12 rounded-xl font-mono pr-12"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl bg-transparent">
              <Copy className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl text-error border-error bg-transparent"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-foreground-muted">
            Keep your API key secure. Regenerating will invalidate the old key.
          </p>
        </div>
      </div>

      {/* Webhook */}
      <div className="bg-background rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="text-xl font-heading font-bold text-foreground">Webhook Endpoint</h3>

        <div className="space-y-2">
          <Label>Webhook URL</Label>
          <Input type="url" placeholder="https://your-domain.com/webhook" className="h-12 rounded-xl" />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="bg-transparent">
            Test Webhook
          </Button>
          <Button className="btn-gradient">Save</Button>
        </div>
      </div>

      {/* White-Label */}
      <div className="bg-background rounded-2xl shadow-sm p-6 space-y-6 ring-2 ring-primary/20">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-heading font-bold text-foreground mb-1">White-Label License</h3>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 text-warning text-sm font-medium">
              Enterprise License
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Your License Key</Label>
            <div className="flex gap-2">
              <Input type="text" value="WL-2024-XXXX-XXXX" readOnly className="h-12 rounded-xl font-mono" />
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl bg-transparent">
                <Copy className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <Button className="w-full btn-gradient h-12 rounded-xl">
            <Upload className="w-4 h-4 mr-2" />
            Download Self-Hosted Version
          </Button>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label>Custom Domain</Label>
              <Input type="url" placeholder="https://your-brand.com" className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label>White-Label Logo</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
                <p className="text-sm text-foreground-muted">Upload your logo (150x150px)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Primary Color</Label>
              <input type="color" defaultValue="#8b5cf6" className="w-full h-12 rounded-xl cursor-pointer" />
            </div>

            <Button className="w-full btn-gradient h-12 rounded-xl">Save White-Label Settings</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
