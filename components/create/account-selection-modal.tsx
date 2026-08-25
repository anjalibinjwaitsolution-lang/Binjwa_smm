"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { PlatformIcon } from "@/components/ui/platform-icon"

interface AccountSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (accounts: any[]) => void
  targetPlatforms: string[] // e.g., ["instagram", "twitter"]
}

const platformMetadata: Record<string, { name: string }> = {
  instagram: { name: "Instagram" },
  facebook: { name: "Facebook" },
  twitter: { name: "Twitter" },
  linkedin: { name: "LinkedIn" },
  youtube: { name: "YouTube" },
  threads: { name: "Threads" },
  pinterest: { name: "Pinterest" },
  whatsapp: { name: "WhatsApp" },
  bluesky: { name: "Bluesky" },
  tiktok: { name: "TikTok" },
}

export function AccountSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  targetPlatforms,
}: AccountSelectionModalProps) {
  const [allAccounts, setAllAccounts] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Accounts for the requested platforms
  const relevantAccounts = allAccounts.filter(acc => 
    targetPlatforms.some(p => p.toLowerCase() === acc.platform.toLowerCase())
  )

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await fetch("/api/connections")
        if (res.ok) {
          const data = await res.json()
          if (data.accounts) {
            setAllAccounts(data.accounts)
          }
        }
      } catch (e) {
        console.error("Failed to fetch connections:", e)
      }
    }
    fetchConnections()
  }, [])

  // When opened, determine if we even need to show the modal
  useEffect(() => {
    if (isOpen && relevantAccounts.length > 0) {
      // Group by platform
      const grouped: Record<string, any[]> = {}
      for (const p of targetPlatforms) {
        grouped[p.toLowerCase()] = []
      }
      for (const acc of relevantAccounts) {
        if (grouped[acc.platform.toLowerCase()]) {
          grouped[acc.platform.toLowerCase()].push(acc)
        }
      }

      // Check if ANY platform has multiple accounts
      const hasMulti = Object.values(grouped).some(accounts => accounts.length > 1)
      
      if (!hasMulti) {
        // Automatically select the single accounts and bypass modal
        const autoSelected = Object.values(grouped).flat()
        onConfirm(autoSelected)
      } else {
        // Pre-select all matching accounts by default if modal is shown
        setSelectedIds(relevantAccounts.map(a => a.id))
      }
    }
  }, [isOpen, targetPlatforms, allAccounts.length]) // only run when opened or accounts loaded

  // If there are no multi-account platforms, we bypass, so modal might render for a split second.
  // We can return null if there's no multi accounts, but it's handled by auto-closing in parent usually.
  // For safety, let's just group them here to render only what's needed.
  const grouped: Record<string, any[]> = {}
  for (const p of targetPlatforms) {
    grouped[p.toLowerCase()] = []
  }
  for (const acc of relevantAccounts) {
    if (grouped[acc.platform.toLowerCase()]) {
      grouped[acc.platform.toLowerCase()].push(acc)
    }
  }
  const hasMulti = Object.values(grouped).some(accounts => accounts.length > 1)
  
  if (!isOpen || !hasMulti) return null

  const handleConfirm = () => {
    // Only return selected accounts for the target platforms
    const accountsToPublish = relevantAccounts.filter(a => selectedIds.includes(a.id))
    onConfirm(accountsToPublish)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-background-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white">Select Accounts to Publish</DialogTitle>
          <DialogDescription className="text-foreground-muted">
            Choose the social media accounts where you want to publish this content.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {Object.entries(grouped).map(([platform, accounts]) => {
            if (accounts.length === 0) return null
            const meta = platformMetadata[platform] || { name: platform }
            
            return (
              <div key={platform} className="space-y-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <PlatformIcon platform={platform} className="w-4 h-4" /> {meta.name}
                </h4>
                
                {accounts.length === 1 ? (
                   <div className="flex items-center space-x-3 p-3 border border-border/50 rounded-lg bg-background-input/50 opacity-70">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                      <PlatformIcon platform={platform} className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none text-white">{accounts[0].handle}</p>
                      <p className="text-xs text-foreground-muted">Auto-selected (Only 1 connected)</p>
                    </div>
                  </div>
                ) : (
                  accounts.map((account) => (
                    <div key={account.id} className="flex items-center space-x-3 p-3 border border-border/50 rounded-lg hover:bg-background-subtle cursor-pointer" onClick={() => {
                        if (selectedIds.includes(account.id)) {
                          setSelectedIds(selectedIds.filter(id => id !== account.id))
                        } else {
                          setSelectedIds([...selectedIds, account.id])
                        }
                    }}>
                      <Checkbox
                        id={account.id}
                        checked={selectedIds.includes(account.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds([...selectedIds, account.id])
                          } else {
                            setSelectedIds(selectedIds.filter((id) => id !== account.id))
                          }
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent double trigger
                      />
                      <div className="flex-1 flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-bold">
                          <PlatformIcon platform={platform} className="w-3 h-3" />
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none text-white">{account.handle}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>
        
        <DialogFooter className="sm:justify-between border-t border-border/50 pt-4">
          <Button variant="ghost" onClick={onClose} className="text-foreground-muted hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.length === 0} className="bg-white text-black hover:bg-[#f5f5f5] transition-colors">
            Confirm & Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
