"use client"

import { useState } from "react"
import { MoreVertical, Clock, Edit2, Copy, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { PostItem } from "@/lib/content-store"

interface LibraryListProps {
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

export function LibraryList({
  posts,
  selectedPosts,
  setSelectedPosts,
  onEdit,
  onDuplicate,
  onDelete,
}: LibraryListProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const togglePost = (postId: string) => {
    setSelectedPosts(
      selectedPosts.includes(postId) ? selectedPosts.filter((id) => id !== postId) : [...selectedPosts, postId],
    )
  }

  const toggleAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([])
    } else {
      setSelectedPosts(posts.map((post) => post.id))
    }
  }

  return (
    <div className="bg-background rounded-2xl shadow-sm overflow-hidden border border-border/40">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background-subtle border-b border-border">
            <tr>
              <th className="w-12 p-4">
                <Checkbox
                  checked={posts.length > 0 && selectedPosts.length === posts.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="text-left p-4 font-heading font-semibold text-foreground">Content</th>
              <th className="text-left p-4 font-heading font-semibold text-foreground">Platforms</th>
              <th className="text-left p-4 font-heading font-semibold text-foreground">Status</th>
              <th className="text-left p-4 font-heading font-semibold text-foreground">Engagement</th>
              <th className="text-left p-4 font-heading font-semibold text-foreground">Date</th>
              <th className="w-12 p-4"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post, index) => (
              <tr
                key={post.id}
                className={`border-b border-border hover:bg-background-subtle transition-colors ${
                  index % 2 === 0 ? "bg-background" : "bg-background-subtle/30"
                }`}
              >
                <td className="p-4">
                  <Checkbox checked={selectedPosts.includes(post.id)} onCheckedChange={() => togglePost(post.id)} />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/10">
                      <Image
                        src={post.imageUrl || "/placeholder.svg"}
                        alt="Post image"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium line-clamp-2 text-sm">{post.caption}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.platforms.map((platform) => (
                      <div
                        key={platform}
                        className={`${platformColors[platform] || "bg-primary"} text-white text-xs px-2 py-1 rounded-full font-medium`}
                      >
                        {platform}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <div
                    className={`${statusColors[post.status] || "bg-secondary text-white"} text-xs px-3 py-1 rounded-full font-medium inline-block`}
                  >
                    {post.status}
                  </div>
                </td>
                <td className="p-4">
                  {post.engagement ? (
                    <div className="text-sm text-foreground-muted">
                      {post.engagement.likes} likes • {post.engagement.comments} comments
                    </div>
                  ) : (
                    <div className="text-sm text-foreground-muted">-</div>
                  )}
                </td>
                <td className="p-4">
                  <div className="text-sm text-foreground-muted flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-foreground-muted" />
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </td>
                <td className="p-4 relative">
                  <div className="flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(post)}
                      className="rounded-full text-foreground-muted hover:text-foreground hover:bg-background-subtle"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDuplicate(post.id)}
                      className="rounded-full text-foreground-muted hover:text-foreground hover:bg-background-subtle"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(post.id)}
                      className="rounded-full text-error/70 hover:text-error hover:bg-error/10"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-border flex items-center justify-between bg-background-card">
        <div className="text-sm text-foreground-muted font-medium">
          Showing 1-{posts.length} of {posts.length} posts
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled className="bg-transparent border-border">
            «
          </Button>
          <Button variant="outline" size="sm" className="bg-white text-black hover:bg-[#f5f5f5] transition-colors border-0">
            1
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent border-border hover:bg-background-subtle text-foreground" disabled>
            2
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent border-border hover:bg-background-subtle text-foreground" disabled>
            »
          </Button>
        </div>
      </div>
    </div>
  )
}
