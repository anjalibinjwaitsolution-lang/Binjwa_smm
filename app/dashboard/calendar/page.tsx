"use client"

import { useState, useEffect } from "react"
import { PostItem } from "@/lib/content-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Heart, Trash2, Clock } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/use-toast"

const ALL_17_PLATFORMS = [
  "Instagram", "Facebook", "Twitter", "LinkedIn", "YouTube", "Threads",
  "Pinterest", "WhatsApp", "Bluesky", "TikTok", "Slack", "Telegram",
  "Discord", "Canva", "Medium", "Reddit", "Twitch", "Kick"
]

const platformColors: Record<string, string> = {
  Instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  Facebook: "bg-blue-600",
  Twitter: "bg-sky-500",
  LinkedIn: "bg-blue-700",
  YouTube: "bg-red-600",
  Threads: "bg-neutral-800",
  Pinterest: "bg-red-600",
  WhatsApp: "bg-green-500",
  Bluesky: "bg-blue-400",
  TikTok: "bg-black",
  Slack: "bg-purple-700",
  Telegram: "bg-sky-600",
  Discord: "bg-indigo-600",
  Canva: "bg-blue-500",
  Medium: "bg-neutral-900",
  Reddit: "bg-orange-600",
  Twitch: "bg-purple-600",
  Kick: "bg-green-600",
}

const statusColors: Record<string, string> = {
  Published: "bg-success",
  Scheduled: "bg-info",
  Draft: "bg-muted text-foreground",
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function CalendarPage() {
  const [posts, setPosts] = useState<PostItem[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  // Modal States
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  // Form states for creating a new post
  const [createDate, setCreateDate] = useState("")
  const [createTime, setCreateTime] = useState("12:00")
  const [createCaption, setCreateCaption] = useState("")
  const [createPlatforms, setCreatePlatforms] = useState<string[]>(["Instagram"])
  const [createStatus, setCreateStatus] = useState("Scheduled")
  const [isCreating, setIsCreating] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Drag and Drop States
  const [draggedPost, setDraggedPost] = useState<PostItem | null>(null)
  const [rescheduleData, setRescheduleData] = useState<{ post: PostItem; newDate: string } | null>(null)
  const [isRescheduling, setIsRescheduling] = useState(false)

  const { toast } = useToast()

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      const res = await fetch(`/api/content/upload?t=${Date.now()}`, {
        headers: userId ? { "x-user-id": userId } : {}
      })
      if (!res.ok) throw new Error("Failed to fetch posts")
      const data = await res.json()
      setPosts(data.posts || data.content || [])
    } catch (err) {
      console.error("Error fetching calendar posts:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    fetchPosts()
  }, [])

  if (!isMounted || (loading && posts.length === 0)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-foreground-muted">Loading your content calendar...</p>
      </div>
    )
  }

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const setToday = () => {
    setCurrentDate(new Date())
  }

  // Get date strings helper
  const formatDateKey = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  // Generate calendar grid
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthStart = new Date(year, month, 1)
  const startDayOfWeek = monthStart.getDay()
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate()
  
  const cells: { date: Date; isCurrentMonth: boolean }[] = []

  // Prev Month padding days
  const prevMonthDays = new Date(year, month, 0).getDate()
  const prevYear = month === 0 ? year - 1 : year
  const prevMonthIdx = month === 0 ? 11 : month - 1
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    cells.push({
      date: new Date(prevYear, prevMonthIdx, prevMonthDays - i),
      isCurrentMonth: false,
    })
  }

  // Current Month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    cells.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    })
  }

  // Next Month padding days (fill to 42 cells)
  const remaining = 42 - cells.length
  const nextYear = month === 11 ? year + 1 : year
  const nextMonthIdx = month === 11 ? 0 : month + 1
  for (let i = 1; i <= remaining; i++) {
    cells.push({
      date: new Date(nextYear, nextMonthIdx, i),
      isCurrentMonth: false,
    })
  }

  // Action: Save Edit Post
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPost) return

    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      const res = await fetch("/api/content/upload", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {})
        },
        body: JSON.stringify({
          id: selectedPost.id,
          caption: selectedPost.caption,
          platforms: selectedPost.platforms,
          status: selectedPost.status,
          date: selectedPost.date,
          time: selectedPost.time,
        }),
      })

      if (res.ok) {
        setSelectedPost(null)
        fetchPosts()
      }
    } catch (err) {
      console.error("Failed to update post:", err)
    }
  }

  // Action: Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createCaption || !createDate) return

    setIsCreating(true)
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      const res = await fetch("/api/content/upload", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {})
        },
        body: JSON.stringify({
          caption: createCaption,
          platform: createPlatforms[0]?.toLowerCase() || "instagram",
          platforms: createPlatforms,
          status: createStatus,
          date: createDate,
          time: createTime,
        }),
      })

      if (res.ok) {
        setIsCreateModalOpen(false)
        setCreateCaption("")
        setCreatePlatforms(["Instagram"])
        setCreateStatus("Scheduled")
        fetchPosts()
        toast({
          title: "Success",
          description: "Post scheduled successfully.",
        })
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast({
          title: "Error",
          description: errorData.error || "Failed to schedule post.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Failed to create post:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Action: Delete Post
  const confirmDelete = async () => {
    if (!postToDelete) return
    setIsDeleting(true)
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      const res = await fetch(`/api/post/delete?id=${postToDelete}`, { 
        method: "DELETE",
        headers: userId ? { "x-user-id": userId } : {}
      })
      const data = await res.json()
      if (res.ok) {
        let msg = "Scheduled post deleted."
        if (data.platformResults && Object.keys(data.platformResults).length > 0) {
          const successCount = Object.values(data.platformResults).filter((r: any) => r.success).length
          const failedPlatforms = Object.entries(data.platformResults)
            .filter(([_, r]: [string, any]) => !r.success)
            .map(([platform, r]: [string, any]) => `${platform} (${r.error})`)
            
          if (failedPlatforms.length > 0) {
            msg += ` Failed to delete on: ${failedPlatforms.join(", ")}.`
          } else {
            msg = `Post deleted completely from schedule and ${successCount} platform(s).`
          }
        }
        
        toast({
          title: "Success",
          description: msg,
        })
        
        if (selectedPost && selectedPost.id === postToDelete) {
          setSelectedPost(null)
        }
        setPostToDelete(null)
        fetchPosts()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete scheduled post",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Failed to delete post:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeletePost = (id: string) => {
    setPostToDelete(id)
  }

  // Action: Reschedule Post
  const confirmReschedule = async () => {
    if (!rescheduleData) return
    setIsRescheduling(true)
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      const { post, newDate } = rescheduleData
      const res = await fetch("/api/content/upload", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {})
        },
        body: JSON.stringify({
          id: post.id,
          caption: post.caption,
          platforms: post.platforms,
          status: post.status,
          date: newDate,
          time: post.time,
        }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: "Post rescheduled successfully.",
        })
        fetchPosts()
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast({
          title: "Error",
          description: errorData.error || "Failed to reschedule post",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Failed to reschedule post:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsRescheduling(false)
      setRescheduleData(null)
    }
  }

  const monthName = currentDate.toLocaleString("default", { month: "long" })
  const todayFormatted = formatDateKey(new Date())

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold gradient-text mb-1">Content Calendar</h1>
          <p className="text-foreground-muted">Track, schedule, and preview your social posts</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-background-subtle rounded-xl p-1 border border-border/40">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-background rounded-lg text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={setToday}
              className="px-4 py-2 hover:bg-background rounded-lg text-sm font-semibold text-foreground transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-background rounded-lg text-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <Button
            onClick={() => {
              setCreateDate(formatDateKey(new Date()))
              setIsCreateModalOpen(true)
            }}
            className="rounded-xl h-11 bg-white text-black hover:bg-[#f5f5f5] transition-colors font-semibold flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Schedule Post
          </Button>
        </div>
      </div>

      <div className="bg-background-card border border-border/50 rounded-2xl p-6 shadow-sm">
        {/* Current Month Banner */}
        <h2 className="text-2xl font-bold text-white mb-6 text-center md:text-left">
          {monthName} <span className="text-foreground-muted font-normal">{year}</span>
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin" />
            <p className="text-foreground-muted font-medium animate-pulse">Loading scheduled content...</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-2 text-center border-b border-border/40 pb-3">
              {weekdays.map((day) => (
                <div key={day} className="text-sm font-semibold text-foreground-muted">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {cells.map((cell, idx) => {
                const dateStr = formatDateKey(cell.date)
                const isToday = dateStr === todayFormatted
                const dayPosts = posts.filter((post) => post.date === dateStr)

                return (
                  <div
                    key={idx}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggedPost && draggedPost.date !== dateStr) {
                        setRescheduleData({ post: draggedPost, newDate: dateStr })
                      }
                      setDraggedPost(null)
                    }}
                    className={`min-h-[130px] rounded-xl border p-2 flex flex-col justify-between group relative transition-all duration-200 ${
                      cell.isCurrentMonth
                        ? "bg-background/40 border-border/40 hover:border-primary/40 hover:bg-background/80"
                        : "bg-background-card/20 border-border/20 text-foreground-muted/40"
                    } ${isToday ? "ring-2 ring-primary/80 border-transparent bg-primary/5" : ""} ${
                      draggedPost && cell.isCurrentMonth ? "hover:bg-primary/5 hover:border-primary/50" : ""
                    }`}
                  >
                    {/* Cell Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isToday
                            ? "bg-primary text-white"
                            : cell.isCurrentMonth
                              ? "text-foreground-muted"
                              : "text-foreground-muted/30"
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>

                      {/* Quick Add Button */}
                      <button
                        onClick={() => {
                          setCreateDate(dateStr)
                          setIsCreateModalOpen(true)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background-subtle rounded-md text-foreground hover:text-primary z-10"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Posts list */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[85px] no-scrollbar">
                      {dayPosts.map((post) => (
                        <div
                          key={post.id}
                          draggable
                          onDragStart={() => setDraggedPost(post)}
                          onDragEnd={() => setDraggedPost(null)}
                          onClick={() => setSelectedPost(post)}
                          className={`p-1.5 rounded-lg bg-background border border-border/40 hover:border-primary cursor-pointer transition-all flex items-center gap-1.5 hover:shadow-sm ${
                            draggedPost?.id === post.id ? "opacity-40 border-primary border-dashed" : ""
                          }`}
                        >
                          <div className="w-1.5 h-6 rounded-full bg-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-white truncate">{post.caption}</p>
                            <div className="flex items-center gap-1 justify-between">
                              <span className="text-[8px] text-foreground-muted font-bold uppercase truncate">
                                {post.platforms.join(", ")}
                              </span>
                              {post.time && (
                                <span className="text-[8px] text-foreground-muted/80 whitespace-nowrap">
                                  {post.time}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Post Details / Edit Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-background-card border border-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-heading font-bold text-white">Post Details</h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-foreground-muted hover:text-white p-1 rounded-full hover:bg-background-subtle"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="edit-caption" className="text-white">Caption</Label>
                <Textarea
                  id="edit-caption"
                  value={selectedPost.caption}
                  onChange={(e) => setSelectedPost({ ...selectedPost, caption: e.target.value })}
                  rows={4}
                  required
                  className="bg-background-input text-white border-border"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-white">Status</Label>
                <Select
                  value={selectedPost.status}
                  onValueChange={(val) => setSelectedPost({ ...selectedPost, status: val })}
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

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date" className="text-white">Scheduled Date</Label>
                  <div className="relative">
                    <Input
                      id="edit-date"
                      type="date"
                      value={selectedPost.date}
                      onChange={(e) => setSelectedPost({ ...selectedPost, date: e.target.value })}
                      required
                      className="bg-background-input text-white border-border pl-10"
                    />
                    <CalendarIcon className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-time" className="text-white">Scheduled Time</Label>
                  <div className="relative">
                    <Input
                      id="edit-time"
                      type="time"
                      value={selectedPost.time || ""}
                      onChange={(e) => setSelectedPost({ ...selectedPost, time: e.target.value })}
                      className="bg-background-input text-white border-border pl-10"
                    />
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Platforms */}
              <div className="space-y-2">
                <Label className="text-white">Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_17_PLATFORMS.map((platform) => {
                    const isSelected = selectedPost.platforms.includes(platform)
                    return (
                      <button
                        type="button"
                        key={platform}
                        onClick={() => {
                          const updated = isSelected
                            ? selectedPost.platforms.filter((p) => p !== platform)
                            : [...selectedPost.platforms, platform]
                          setSelectedPost({ ...selectedPost, platforms: updated })
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
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

              {/* Actions Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => handleDeletePost(selectedPost.id)}
                  className="px-4 py-2 rounded-xl text-error hover:bg-error/10 font-semibold transition-colors flex items-center gap-1.5 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedPost(null)}
                    className="rounded-xl hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl bg-white text-black hover:bg-[#f5f5f5] transition-colors shadow-lg"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule/Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-background-card border border-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-heading font-bold text-white">Create Scheduled Post</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-foreground-muted hover:text-white p-1 rounded-full hover:bg-background-subtle"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-5">
              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="create-caption" className="text-white">Caption</Label>
                <Textarea
                  id="create-caption"
                  placeholder="What's on your mind? Write copy for this scheduled post..."
                  value={createCaption}
                  onChange={(e) => setCreateCaption(e.target.value)}
                  rows={4}
                  required
                  className="bg-background-input text-white border-border"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-white">Status</Label>
                <Select value={createStatus} onValueChange={(val) => setCreateStatus(val)}>
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

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-date" className="text-white">Scheduled Date</Label>
                  <div className="relative">
                    <Input
                      id="create-date"
                      type="date"
                      value={createDate}
                      onChange={(e) => setCreateDate(e.target.value)}
                      required
                      className="bg-background-input text-white border-border pl-10"
                    />
                    <CalendarIcon className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-time" className="text-white">Scheduled Time</Label>
                  <div className="relative">
                    <Input
                      id="create-time"
                      type="time"
                      value={createTime}
                      onChange={(e) => setCreateTime(e.target.value)}
                      required
                      className="bg-background-input text-white border-border pl-10"
                    />
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Platforms */}
              <div className="space-y-2">
                <Label className="text-white">Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_17_PLATFORMS.map((platform) => {
                    const isSelected = createPlatforms.includes(platform)
                    return (
                      <button
                        type="button"
                        key={platform}
                        onClick={() => {
                          const updated = isSelected
                            ? createPlatforms.filter((p) => p !== platform)
                            : [...createPlatforms, platform]
                          setCreatePlatforms(updated.length > 0 ? updated : [platform])
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
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

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-xl bg-white text-black hover:bg-[#f5f5f5] transition-colors shadow-lg font-semibold"
                >
                  {isCreating ? "Scheduling..." : "Create & Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        open={postToDelete !== null}
        onOpenChange={(open) => !open && setPostToDelete(null)}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={confirmDelete}
        isProcessing={isDeleting}
        confirmText="Delete"
      />

      <ConfirmDialog
        open={rescheduleData !== null}
        onOpenChange={(open) => !open && setRescheduleData(null)}
        title="Reschedule Post"
        description={`Are you sure you want to reschedule this post to ${rescheduleData?.newDate}?`}
        onConfirm={confirmReschedule}
        isProcessing={isRescheduling}
        confirmText="Confirm"
      />
    </div>
  )
}
