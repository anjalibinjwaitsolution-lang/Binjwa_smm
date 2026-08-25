"use client"

import { useState, useEffect } from "react"
import { LibraryHeader } from "@/components/library/library-header"
import { LibraryFilters } from "@/components/library/library-filters"
import { LibraryGrid } from "@/components/library/library-grid"
import { LibraryList } from "@/components/library/library-list"
import { LibraryEmpty } from "@/components/library/library-empty"
import { PostItem } from "@/lib/content-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Calendar, CheckSquare, Download, CalendarRange, Trash } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SelectiveDeleteModal } from "@/components/library/SelectiveDeleteModal"
import { useToast } from "@/components/ui/use-toast"

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [selectedPlatform, setSelectedPlatform] = useState("All")
  const [sortBy, setSortBy] = useState("newest")

  // Modals / Overlays State
  const [editingPost, setEditingPost] = useState<PostItem | null>(null)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/content/upload?t=${Date.now()}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setPosts(data.content || [])
      }
    } catch (err) {
      console.error("Error fetching library:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Action Handlers
  const handleSelectiveDelete = async (selectedPlatforms: string[], deleteFromLocal: boolean) => {
    if (!postToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch("/api/post/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: postToDelete,
          selectedPlatforms,
          deleteFromLocal
        })
      })
      const data = await res.json()
      
      if (res.ok) {
        let msg = "Post processing complete."
        if (data.platformResults && Object.keys(data.platformResults).length > 0) {
          const successCount = Object.values(data.platformResults).filter((r: any) => r.success).length
          const failedPlatforms = Object.entries(data.platformResults)
            .filter(([_, r]: [string, any]) => !r.success)
            .map(([platform, r]: [string, any]) => `${platform} (${r.error})`)
            
          if (failedPlatforms.length > 0) {
            msg = `Deleted from selected platforms. Failed on: ${failedPlatforms.join(", ")}.`
          } else {
            msg = `Content deleted from ${successCount} selected platform(s)${deleteFromLocal ? ' and local library' : ''}.`
          }
        } else if (deleteFromLocal) {
          msg = "Post deleted from library."
        }
        
        toast({
          title: "Success",
          description: msg,
        })
        
        if (deleteFromLocal) {
          setSelectedPosts((prev) => prev.filter((pId) => pId !== postToDelete))
        }
        setPostToDelete(null)
        fetchPosts()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete post",
          variant: "destructive"
        })
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to delete post",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDelete = (id: string) => {
    setPostToDelete(id)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete the ${selectedPosts.length} selected posts?`)) return
    try {
      const res = await fetch("/api/post/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedPosts }),
      })
      if (res.ok) {
        toast({
          title: "Success",
          description: `${selectedPosts.length} posts deleted successfully.`,
        })
        setSelectedPosts([])
        fetchPosts()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete selected posts",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Failed bulk deletion:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred during bulk deletion",
        variant: "destructive",
      })
    }
  }

  const handleDuplicate = async (id: string) => {
    const postToDuplicate = posts.find((p) => p.id === id)
    if (!postToDuplicate) return

    try {
      const res = await fetch("/api/content/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: postToDuplicate.imageUrl,
          caption: `${postToDuplicate.caption} (Copy)`,
          platform: postToDuplicate.platforms[0]?.toLowerCase() || "instagram",
          status: "Draft",
        }),
      })
      if (res.ok) {
        fetchPosts()
      }
    } catch (err) {
      console.error("Failed to duplicate post:", err)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPost) return

    try {
      const res = await fetch("/api/content/upload", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPost.id,
          caption: editingPost.caption,
          platforms: editingPost.platforms,
          status: editingPost.status,
          date: editingPost.date,
        }),
      })

      if (res.ok) {
        setEditingPost(null)
        fetchPosts()
      }
    } catch (err) {
      console.error("Failed to update post:", err)
    }
  }

  const handleBulkReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rescheduleDate || selectedPosts.length === 0) return

    try {
      // Loop or execute sequential updates
      for (const id of selectedPosts) {
        await fetch("/api/content/upload", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, date: rescheduleDate, status: "Scheduled" }),
        })
      }
      setShowRescheduleDialog(false)
      setSelectedPosts([])
      fetchPosts()
    } catch (err) {
      console.error("Failed bulk reschedule:", err)
    }
  }

  const handleBulkExport = () => {
    const postsToExport = posts.filter((p) => selectedPosts.includes(p.id))
    const fileData = JSON.stringify(postsToExport, null, 2)
    const blob = new Blob([fileData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `exported-posts-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Filter & Sort Logic
  const filteredAndSortedPosts = posts
    .filter((post) => {
      // Search Match
      const matchesSearch =
        post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.platforms.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))

      // Status Match
      const matchesStatus = selectedStatus === "All" || post.status === selectedStatus

      // Platform Match
      const matchesPlatform = selectedPlatform === "All" || post.platforms.includes(selectedPlatform)

      return matchesSearch && matchesStatus && matchesPlatform
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      if (sortBy === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      if (sortBy === "engagement") {
        const engA = a.engagement ? a.engagement.likes + a.engagement.comments : 0
        const engB = b.engagement ? b.engagement.likes + b.engagement.comments : 0
        return engB - engA
      }
      return 0
    })

  return (
    <div className="space-y-6 min-h-[70vh]">
      <LibraryHeader totalPosts={posts.length} />

      <LibraryFilters
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedPlatform={selectedPlatform}
        setSelectedPlatform={setSelectedPlatform}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin" />
          <p className="text-foreground-muted font-medium animate-pulse">Loading library assets...</p>
        </div>
      ) : filteredAndSortedPosts.length === 0 ? (
        <LibraryEmpty />
      ) : viewMode === "grid" ? (
        <LibraryGrid
          posts={filteredAndSortedPosts}
          selectedPosts={selectedPosts}
          setSelectedPosts={setSelectedPosts}
          onEdit={setEditingPost}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      ) : (
        <LibraryList
          posts={filteredAndSortedPosts}
          selectedPosts={selectedPosts}
          setSelectedPosts={setSelectedPosts}
          onEdit={setEditingPost}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      )}

      {/* Floating Action Bar for Selections */}
      {selectedPosts.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background rounded-full shadow-2xl px-6 py-3.5 flex items-center gap-4 z-40 border border-border animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="font-semibold text-sm">{selectedPosts.length} posts selected</span>
          <div className="h-4 w-px bg-background-muted/30" />
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="p-2.5 rounded-full bg-error hover:bg-error/90 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Delete Selected"
            >
              <Trash className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={() => setShowRescheduleDialog(true)}
              className="p-2.5 rounded-full bg-info hover:bg-info/90 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Reschedule Selected"
            >
              <CalendarRange className="w-4 h-4" />
              Reschedule
            </button>
            <button
              onClick={handleBulkExport}
              className="p-2.5 rounded-full bg-success hover:bg-success/90 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Export Selected"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={() => setSelectedPosts([])}
              className="px-4 py-2.5 rounded-full bg-background-muted text-foreground hover:bg-background transition-colors text-xs font-semibold"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-background-card border border-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-heading font-bold text-white">Edit Post Settings</h3>
              <button
                onClick={() => setEditingPost(null)}
                className="text-foreground-muted hover:text-white p-1 rounded-full hover:bg-background-subtle"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-6">
              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="edit-caption" className="text-white">Caption</Label>
                <Textarea
                  id="edit-caption"
                  value={editingPost.caption}
                  onChange={(e) => setEditingPost({ ...editingPost, caption: e.target.value })}
                  rows={4}
                  required
                  className="bg-background-input text-white border-border"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-white">Status</Label>
                <Select
                  value={editingPost.status}
                  onValueChange={(val) => setEditingPost({ ...editingPost, status: val })}
                >
                  <SelectTrigger className="bg-background-input text-white border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="edit-date" className="text-white">Schedule Date</Label>
                <div className="relative">
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingPost.date}
                    onChange={(e) => setEditingPost({ ...editingPost, date: e.target.value })}
                    required
                    className="bg-background-input text-white border-border pl-10"
                  />
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                </div>
              </div>

              {/* Platforms */}
              <div className="space-y-2">
                <Label className="text-white">Platforms</Label>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Instagram", "Facebook", "Twitter", "LinkedIn", "YouTube", "Threads",
                    "Pinterest", "WhatsApp", "Bluesky", "TikTok", "Slack", "Telegram",
                    "Discord", "Canva", "Medium", "Reddit", "Twitch", "Kick"
                  ].map((platform) => {
                    const isSelected = editingPost.platforms.includes(platform)
                    return (
                      <button
                        type="button"
                        key={platform}
                        onClick={() => {
                          const updated = isSelected
                            ? editingPost.platforms.filter((p) => p !== platform)
                            : [...editingPost.platforms, platform]
                          setEditingPost({ ...editingPost, platforms: updated })
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                          isSelected
                            ? "bg-primary border-primary text-black"
                            : "bg-transparent border-border text-gray-300 hover:text-white hover:border-white"
                        }`}
                      >
                        {platform}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingPost(null)}
                  className="rounded-xl h-11 text-foreground-muted hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl h-11 bg-white text-black hover:bg-[#f5f5f5] transition-colors shadow-lg"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Date Dialog */}
      {showRescheduleDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-background-card border border-border w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-heading font-bold text-white">Bulk Reschedule</h3>
              <button
                onClick={() => setShowRescheduleDialog(false)}
                className="text-foreground-muted hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleBulkReschedule} className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-reschedule-date" className="text-white">Choose New Publication Date</Label>
                <div className="relative">
                  <Input
                    id="bulk-reschedule-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                    className="bg-background-input text-white border-border pl-10"
                  />
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowRescheduleDialog(false)}
                  className="rounded-xl text-foreground-muted hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-white text-black hover:bg-[#f5f5f5] transition-colors shadow-lg"
                >
                  Apply Date
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <SelectiveDeleteModal
        post={posts.find(p => p.id === postToDelete) || null}
        open={postToDelete !== null}
        onClose={() => setPostToDelete(null)}
        onConfirmDelete={handleSelectiveDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
