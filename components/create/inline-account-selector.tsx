import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { PlatformIcon } from "@/components/ui/platform-icon"
import React from "react"

const platformMetadata = [
  { id: "instagram", name: "Instagram" },
  { id: "facebook", name: "Facebook" },
  { id: "twitter", name: "Twitter" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "youtube", name: "YouTube" },
  { id: "threads", name: "Threads" },
  { id: "pinterest", name: "Pinterest" },
  { id: "whatsapp", name: "WhatsApp" },
  { id: "bluesky", name: "Bluesky" },
  { id: "tiktok", name: "TikTok" },
]

export function InlineAccountSelector({ 
  selectedPlatforms, 
  allAccounts, 
  selectedAccountIds, 
  setSelectedAccountIds 
}: {
  selectedPlatforms: string[],
  allAccounts: any[],
  selectedAccountIds: Record<string, string[]>,
  setSelectedAccountIds: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
}) {
  if (selectedPlatforms.length === 0 || allAccounts.length === 0) return null

  return (
    <div className="space-y-4 mt-4 animate-in fade-in duration-200">
      {selectedPlatforms.map(platform => {
        const platformNameLower = platform.toLowerCase()
        const accountsForPlatform = allAccounts.filter(acc => acc.platform.toLowerCase() === platformNameLower)
        if (accountsForPlatform.length === 0) return null
        
        const meta = platformMetadata.find(p => p.id === platformNameLower) || { id: platformNameLower, name: platform }
        
        // Auto-select if only 1 account - make it bright, active, and clearly ready to publish!
        if (accountsForPlatform.length === 1) {
          const acc = accountsForPlatform[0]
          return (
            <div key={platform} className="space-y-2">
              <Label className="text-white text-xs flex items-center gap-2 font-medium">
                <PlatformIcon platform={platformNameLower} className="w-4 h-4 shrink-0 text-primary" />
                {meta.name} Account
              </Label>
              <div className="flex items-center justify-between p-3 border border-primary/50 rounded-xl bg-primary/10 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shadow">
                    <PlatformIcon platform={platformNameLower} className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-none text-white">{acc.handle}</p>
                    <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      Connected & Ready to Publish
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-black text-xs font-bold shadow-sm">
                  ✓ Selected
                </div>
              </div>
            </div>
          )
        }
        
        // Multiple accounts dropdown/list
        return (
          <div key={platform} className="space-y-2">
            <Label className="text-white text-xs flex items-center gap-2">
              <PlatformIcon platform={platformNameLower} className="w-4 h-4 shrink-0" />
              Select {meta.name} Accounts
            </Label>
            <div className="space-y-2 bg-background-input/30 p-2 rounded-xl border border-border/50 max-h-[160px] overflow-y-auto">
              {accountsForPlatform.map(acc => {
                const isSelected = selectedAccountIds[platformNameLower]?.includes(acc.id) || false
                return (
                  <div key={acc.id} className="flex items-center space-x-3 p-2 border border-border/30 rounded-lg hover:bg-background-subtle cursor-pointer transition-colors" onClick={() => {
                    setSelectedAccountIds(prev => {
                      const current = prev[platformNameLower] || []
                      const next = current.includes(acc.id) ? current.filter(id => id !== acc.id) : [...current, acc.id]
                      return { ...prev, [platformNameLower]: next }
                    })
                  }}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        setSelectedAccountIds(prev => {
                          const current = prev[platformNameLower] || []
                          const next = checked ? [...current, acc.id] : current.filter(id => id !== acc.id)
                          return { ...prev, [platformNameLower]: next }
                        })
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                    <div className="flex-1 flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-bold">
                        <PlatformIcon platform={platformNameLower} className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-medium text-white">{acc.handle}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
