"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, AlertTriangle } from 'lucide-react'
import { PlatformIcon } from '@/components/ui/platform-icon'
import { PostItem } from '@/lib/content-store'

interface SelectiveDeleteModalProps {
  post: PostItem | null
  open: boolean
  onClose: () => void
  onConfirmDelete: (selectedPlatforms: string[], deleteFromLocal: boolean) => Promise<void>
  isDeleting: boolean
}

export function SelectiveDeleteModal({
  post,
  open,
  onClose,
  onConfirmDelete,
  isDeleting
}: SelectiveDeleteModalProps) {
  if (!post) return null

  const rawPlatforms = post.platforms || (post.platform ? [post.platform] : [])
  // Clean platform list
  const availablePlatforms = Array.from(new Set(rawPlatforms.map(p => p.trim()))).filter(Boolean)

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(availablePlatforms)
  const [deleteFromLocal, setDeleteFromLocal] = useState<boolean>(true)

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const handleSelectAll = () => {
    if (selectedPlatforms.length === availablePlatforms.length) {
      setSelectedPlatforms([])
    } else {
      setSelectedPlatforms([...availablePlatforms])
    }
  }

  const handleConfirm = async () => {
    await onConfirmDelete(selectedPlatforms, deleteFromLocal)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-background-card border-border text-white rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Trash2 className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold font-heading text-white">
            Selective Post Deletion
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground-muted">
            Choose which connected platforms and channels you want to remove this published content from:
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Post Preview Snippet */}
          <div className="p-3.5 rounded-2xl bg-background-input/60 border border-border/80 flex items-center gap-3">
            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt="Post preview"
                className="w-12 h-12 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                POST
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium line-clamp-2">
                {post.caption || 'Untitled Post'}
              </p>
              <p className="text-[10px] text-foreground-muted mt-0.5">
                Published on {new Date(post.date || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Connected Platforms Selection */}
          {availablePlatforms.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Target Platforms ({selectedPlatforms.length}/{availablePlatforms.length})
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {selectedPlatforms.length === availablePlatforms.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {availablePlatforms.map((plat) => {
                  const isChecked = selectedPlatforms.includes(plat)
                  return (
                    <div
                      key={plat}
                      onClick={() => togglePlatform(plat)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-red-500/10 border-red-500/40 text-white'
                          : 'bg-background-input/30 border-border text-foreground-muted hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <PlatformIcon platform={plat.toLowerCase()} className="w-4 h-4" />
                        <span className="text-sm font-medium">{plat}</span>
                      </div>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => togglePlatform(plat)}
                        className="rounded-md border-border text-red-500"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>No live platform connections attached to this post entry.</span>
            </div>
          )}

          {/* Delete from Local Library Checkbox */}
          <div
            onClick={() => setDeleteFromLocal(!deleteFromLocal)}
            className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
              deleteFromLocal
                ? 'bg-primary/10 border-primary/40 text-white'
                : 'bg-background-input/30 border-border text-foreground-muted'
            }`}
          >
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Remove from Library & Calendar</p>
              <p className="text-xs text-foreground-muted">Deletes this entry permanently from your SMM app dashboard.</p>
            </div>
            <Checkbox
              checked={deleteFromLocal}
              onCheckedChange={(val) => setDeleteFromLocal(Boolean(val))}
              className="rounded-md border-border text-primary"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl text-foreground-muted hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting || (selectedPlatforms.length === 0 && !deleteFromLocal)}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg font-bold px-5"
          >
            {isDeleting ? 'Deleting...' : 'Delete Selected Content'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
