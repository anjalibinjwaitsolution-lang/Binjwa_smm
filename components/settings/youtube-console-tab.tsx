"use client"

import { useState, useEffect } from "react"
import { Youtube, Key, Shield, Link2, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Platform, ConnectedAccount } from "@/components/settings/connections-tab"

export function YouTubeConsoleTab() {
  const [clientId, setClientId] = useState("5179821847-us4pf5b013o34inn6hrhcf37hr8rbncl.apps.googleusercontent.com")
  const [clientSecret, setClientSecret] = useState("***************************")
  const [redirectUri, setRedirectUri] = useState("")
  
  const [youtubePlatform, setYoutubePlatform] = useState<Platform | null>(null)

  useEffect(() => {
    setRedirectUri(`${window.location.origin}/api/auth/youtube/callback`)
    
    // Load connection status
    const stored = localStorage.getItem("social_connections")
    if (stored) {
      try {
        const parsed: Platform[] = JSON.parse(stored)
        const yt = parsed.find(p => p.id === "youtube")
        if (yt) setYoutubePlatform(yt)
      } catch (e) {
        console.error("Failed to parse connections", e)
      }
    }
  }, [])

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
          <Youtube className="w-6 h-6 text-red-500" />
          YouTube Console
        </h2>
        <p className="text-foreground-muted mt-2">
          Configure YouTube API credentials and manage developer settings for YouTube integrations.
        </p>
      </div>

      {/* Developer API Configuration */}
      <div className="bg-background-card rounded-2xl border border-border/50 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            OAuth 2.0 Credentials
          </h3>
          <p className="text-sm text-foreground-muted mt-1">
            These credentials are required to authenticate users via the Google API. (Environment variables override these in production).
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Google Client ID</Label>
            <Input 
              value={clientId} 
              onChange={e => setClientId(e.target.value)} 
              className="bg-background-input border-border/50 font-mono text-sm"
              readOnly
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-white">Google Client Secret</Label>
            <Input 
              type="password"
              value={clientSecret} 
              onChange={e => setClientSecret(e.target.value)} 
              className="bg-background-input border-border/50 font-mono text-sm"
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Authorized Redirect URI</Label>
            <div className="flex gap-2">
              <Input 
                value={redirectUri} 
                className="bg-background-input border-border/50 font-mono text-sm"
                readOnly
              />
              <Button variant="outline" className="shrink-0" onClick={() => navigator.clipboard.writeText(redirectUri)}>
                Copy
              </Button>
            </div>
            <p className="text-xs text-foreground-muted">Must perfectly match the Authorized redirect URIs in Google Cloud Console.</p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-background-card rounded-2xl border border-border/50 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Connection Status
          </h3>
          <p className="text-sm text-foreground-muted mt-1">
            Current OAuth status for the YouTube API.
          </p>
        </div>

        <div className="bg-background-input rounded-xl border border-border/50 p-4">
          {youtubePlatform && youtubePlatform.connected && youtubePlatform.accounts.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-500 font-medium">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Connected
              </div>
              <div className="space-y-3 pt-3 border-t border-border/40">
                {youtubePlatform.accounts.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{(acc as any).name || acc.handle}</p>
                      <p className="text-xs text-foreground-muted">ID: {acc.id}</p>
                    </div>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md">Valid Token</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-yellow-500 font-medium">
              <AlertCircle className="w-5 h-5" />
              Not Connected
            </div>
          )}
        </div>

        <p className="text-xs text-foreground-muted italic">
          Note: To connect, disconnect, or reconnect YouTube channels, please use the main Connections tab. This developer console is for monitoring API health and credentials.
        </p>
      </div>
    </div>
  )
}
