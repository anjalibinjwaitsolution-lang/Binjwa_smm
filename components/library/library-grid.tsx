"use client"

import { useState } from "react"
import { MoreVertical, Heart, MessageCircle, Share2, Edit2, Copy, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { PostItem } from "@/lib/content-store"

interface LibraryGridProps {
  posts: PostItem[]
  selectedPosts: string[]
  setSelectedPosts: (posts: string[]) => void
  onEdit: (post: PostItem) => void
  onDuplicate: (postId: string) => void
  onDelete: (postId: string) => void
}

const platformColors: Record<string, string> = {
  Instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  Facebook: "bg-blue-600",
  Twitter: "bg-sky-500",
  LinkedIn: "bg-blue-700",
  Threads: "bg-neutral-800",
  Pinterest: "bg-red-600",
  WhatsApp: "bg-green-500",
  Bluesky: "bg-blue-400",
  TikTok: "bg-black",
}

const statusColors: Record<string, string> = {
  Published: "bg-success text-white",
  Scheduled: "bg-info text-white",
  Draft: "bg-muted text-foreground",
}

export function LibraryGrid({
  posts,
  selectedPosts,
  setSelectedPosts,
  onEdit,
  onDuplicate,
  onDelete,
}: LibraryGridProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const togglePost = (postId: string) => {
    setSelectedPosts(
      selectedPosts.includes(postId) ? selectedPosts.filter((id) => id !== postId) : [...selectedPosts, postId],
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-background rounded-2xl shadow-sm overflow-hidden card-hover group relative border border-border/40">
          {/* Checkbox */}
          <div className="absolute top-4 left-4 z-10">
            <Checkbox
              checked={selectedPosts.includes(post.id)}
              onCheckedChange={() => togglePost(post.id)}
              className="bg-background/95 border-border shadow-lg"
            />
          </div>

          {/* Status Badge */}
          <div className="absolute top-4 right-4 z-10">
            <div className={`${statusColors[post.status] || "bg-secondary text-white"} text-xs px-3 py-1 rounded-full font-medium shadow-sm`}>
              {post.status}
            </div>
          </div>

          {/* Thumbnail / Image */}
          <div className="relative aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
            <Image
              src={post.imageUrl || "/placeholder.svg"}
              alt="Post image"
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/45 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 z-10">
              {post.engagement && (
                <div className="flex items-center gap-4 text-white text-sm mb-3">
                  <div className="flex items-center gap-1 font-medium">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    {post.engagement.likes}
                  </div>
                  <div className="flex items-center gap-1 font-medium">
                    <MessageCircle className="w-4 h-4 text-sky-400 fill-sky-400" />
                    {post.engagement.comments}
                  </div>
                  <div className="flex items-center gap-1 font-medium">
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    {post.engagement.shares}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(post)}
                  className="flex-1 bg-white/95 text-foreground hover:bg-white px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => onDuplicate(post.id)}
                  className="flex-1 bg-white/95 text-foreground hover:bg-white px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicate
                </button>
                
                <button
                  onClick={() => onDelete(post.id)}
                  className="bg-white/95 text-error hover:bg-error/10 p-2 rounded-lg transition-colors flex items-center justify-center"
                  title="Delete Post"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 bg-background-card">
            <p className="text-foreground font-medium line-clamp-2 mb-3 text-sm min-h-[40px]">{post.caption}</p>

            <div className="flex items-center justify-between">
              {/* Platform Badges */}
              <div className="flex items-center gap-1">
                {post.platforms.slice(0, 3).map((platform, index) => (
                  <div
                    key={platform}
                    title={platform}
                    className={`w-7 h-7 rounded-full ${platformColors[platform] || "bg-primary"} flex items-center justify-center text-white text-[10px] font-bold ${
                      index > 0 ? "-ml-2" : ""
                    } border-2 border-background-card shadow-sm`}
                  >
                    {platform[0]}
                  </div>
                ))}
                {post.platforms.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-foreground text-[10px] font-bold -ml-2 border-2 border-background-card">
                    +{post.platforms.length - 3}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="text-xs text-foreground-muted font-medium">
                {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
