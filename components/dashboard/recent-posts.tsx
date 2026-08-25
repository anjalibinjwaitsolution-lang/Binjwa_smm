import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"
import Link from "next/link"
import { Clock } from "lucide-react"

const platformColors: Record<string, string> = {
  Instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  Facebook: "bg-blue-600",
  Twitter: "bg-sky-500",
  LinkedIn: "bg-[#0A66C2]",
  Threads: "bg-neutral-800",
  Pinterest: "bg-red-600",
  WhatsApp: "bg-green-500",
  Bluesky: "bg-blue-400",
  TikTok: "bg-black",
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  facebook: "bg-blue-600",
  twitter: "bg-sky-500",
  linkedin: "bg-[#0A66C2]",
  threads: "bg-neutral-800",
  pinterest: "bg-red-600",
  whatsapp: "bg-green-500",
  bluesky: "bg-blue-400",
  tiktok: "bg-black",
}

export function RecentPosts({ posts }: { posts: any[] }) {
  const recentPosts = (posts || []).slice(0, 5)

  return (
    <div className="bg-background rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-bold text-foreground">Recent Posts</h2>
        <Link href="/dashboard/analytics">
          <Button variant="ghost" className="text-primary">
            View All Posts →
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {recentPosts.length === 0 ? (
          <div className="text-center text-foreground-muted py-6">No recent posts found. Let's create one!</div>
        ) : (
          recentPosts.map((post: any) => {
            const displayPlatform = post.platform || (post.platforms?.[0]) || "unknown"
            return (
              <div
                key={post.id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-background-subtle transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt="Post thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-primary" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium line-clamp-2 mb-2">{post.caption}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Platform badges */}
                    <div
                      className={`${platformColors[displayPlatform] || "bg-muted"} text-white text-xs px-2 py-1 rounded-full font-medium capitalize`}
                    >
                      {displayPlatform}
                    </div>
                  </div>
                </div>

                {/* Status & Date */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className={`${post.status === "published" ? "bg-success" : "bg-info"} text-white text-xs px-3 py-1 rounded-full font-medium capitalize`}>
                    {post.status || "Draft"}
                  </div>
                  <div className="text-xs text-foreground-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
