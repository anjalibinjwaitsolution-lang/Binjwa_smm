"use client"

import { useState, useEffect, useRef } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Check, Loader2 } from "lucide-react"

export function AccountTab() {
  const { user, isLoaded } = useUser()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [avatar, setAvatar] = useState("")
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  
  const { signOut } = useClerk()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteAccount, setDeleteAccount] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteData = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch("/api/user/delete-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAccount }),
      })
      
      if (res.ok) {
        if (deleteAccount) {
          await signOut()
        } else {
          window.location.reload()
        }
      } else {
        alert("Failed to delete data")
      }
    } catch (e) {
      alert("Error deleting data")
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isLoaded && user) {
      setName(user.fullName || "")
      setEmail(user.primaryEmailAddress?.emailAddress || "")
      setAvatar(user.imageUrl)
    }
  }, [isLoaded, user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    try {
      const parts = name.split(" ")
      const firstName = parts[0]
      const lastName = parts.slice(1).join(" ")

      await user.update({
        firstName,
        lastName,
      })

      if (avatarFile) {
        await user.setProfileImage({ file: avatarFile })
      }

      setSaveStatus("Profile saved successfully!")
    } catch (err) {
      console.error(err)
      setSaveStatus("Failed to save profile.")
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "..."

  return (
    <div className="bg-background-card border border-border/50 rounded-2xl p-6 lg:p-8 space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Account Settings</h2>
        <p className="text-sm text-foreground-muted">Update your personal profile information and profile photo</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        {/* Profile Picture */}
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-white/5 shadow-xl">
              <AvatarImage src={avatar} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="bg-transparent border-border hover:bg-background-subtle rounded-xl"
            >
              Change Photo
            </Button>
            <p className="text-xs text-foreground-muted mt-2">JPG, GIF or PNG. Max size 2MB</p>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name" className="text-white">Full Name</Label>
            <Input
              id="account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-background-input text-white border-border rounded-xl h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-email" className="text-white">Email Address (Managed via Clerk)</Label>
            <Input
              id="account-email"
              type="email"
              value={email}
              disabled
              className="bg-background-input/50 text-foreground-muted border-border rounded-xl h-11 opacity-70 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-4 pt-4 border-t border-border/40">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-white text-black hover:bg-[#f5f5f5] transition-colors rounded-xl h-11 px-8 font-semibold shadow-lg"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>

          {saveStatus && (
            <span className={`text-sm font-semibold flex items-center gap-1.5 animate-in fade-in duration-200 ${saveStatus.includes("Failed") ? "text-error" : "text-success"}`}>
              {!saveStatus.includes("Failed") && <Check className="w-4 h-4" />}
              {saveStatus}
            </span>
          )}
        </div>
      </form>

      {/* Danger Zone */}
      <div className="pt-8 mt-8 border-t border-error/20">
        <h3 className="text-xl font-bold text-error mb-2">Danger Zone</h3>
        <p className="text-sm text-foreground-muted mb-6">
          Permanently delete all your social media connections, stored access tokens, generated posts, and analytics data from our servers. This action cannot be undone.
        </p>
        <Button 
          variant="destructive" 
          onClick={() => setShowDeleteModal(true)}
          className="bg-error/10 text-error hover:bg-error hover:text-white border border-error/20 rounded-xl"
        >
          Delete All My Data
        </Button>
      </div>

      {/* Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-background border border-border rounded-2xl p-6 lg:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-error mb-2">Are you absolutely sure?</h2>
            <p className="text-sm text-foreground-muted mb-6">
              This will permanently delete your stored data including connected accounts, posts, and messaging logs.
            </p>

            <div className="space-y-4 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={deleteAccount}
                  onChange={(e) => setDeleteAccount(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-border bg-background-input text-error focus:ring-error"
                />
                <span className="text-sm text-white">
                  Also delete my authentication account (Clerk Auth). You will be logged out immediately.
                </span>
              </label>

              <div className="space-y-2 mt-4">
                <Label className="text-white text-xs uppercase tracking-wider font-semibold">Please type "DELETE" to confirm</Label>
                <Input 
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="bg-background-input text-white border-error/30 focus-visible:ring-error rounded-xl"
                  placeholder="DELETE"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-8">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="rounded-xl border-border hover:bg-background-subtle"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteData}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                className="rounded-xl bg-error hover:bg-error/90 text-white"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
