"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Zap,
  Filter,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface Post {
  id: string
  brandName: string
  platform: string
  imageUrl: string
  caption: string
  hashtags: string[]
  cta?: string
  createdAt: string
  status: string
  reach: number
  likes: number
  comments: number
  shares: number
  platforms?: string[]
  apiRestricted?: boolean
}

interface Stats {
  totalReach: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalEngagement: number
  avgEngagementRate: string
}

const platformIcons: Record<string, string> = {
  instagram: "📷",
  facebook: "📘",
  twitter: "𝕏",
  linkedin: "💼",
  youtube: "▶️",
  threads: "🧵",
  pinterest: "📌",
  whatsapp: "💬",
  bluesky: "🦋",
  tiktok: "🎵",
  slack: "💬",
  telegram: "✈️",
  discord: "🎮",
  canva: "🎨",
  medium: "📝",
  reddit: "🤖",
  twitch: "👾",
  kick: "🟩",
}

export function AnalyticsDashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [platformData, setPlatformData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPlatform, setFilterPlatform] = useState<string>("all")
  const [boostingId, setBoostingId] = useState<string | null>(null)

  const [isMounted, setIsMounted] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/analytics?t=${Date.now()}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to fetch analytics")
      const data = await res.json()
      setPosts(data.posts)
      setStats(data.stats)
      setChartData(data.chartData)
      setPlatformData(data.platformBreakdown)
    } catch (err) {
      console.error("Error loading analytics:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [])

  const handleBoost = async (postId: string) => {
    setBoostingId(postId)
    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })
      if (res.ok) {
        // Optimistic / refetch update
        await fetchData()
      }
    } catch (error) {
      console.error("Boost failed:", error)
    } finally {
      setBoostingId(null)
    }
  }

  const filteredPosts = filterPlatform === "all"
    ? posts
    : posts.filter((p) => 
        p.platform?.toLowerCase() === filterPlatform.toLowerCase() || 
        p.platforms?.map((s: string) => s.toLowerCase()).includes(filterPlatform.toLowerCase())
      )

  if (!isMounted || (loading && posts.length === 0)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-foreground-muted">Loading your analytics dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Performance Analytics</h1>
          <p className="text-foreground-muted">Track reach, engagement, and impressions across all linked channels</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" className="gap-2 bg-background-card border-border text-white">
          <RefreshCw className={`w-4 h-4 ${loading && posts.length > 0 ? "animate-spin" : ""}`} /> 
          {loading && posts.length > 0 ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-background-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-sm hover:border-primary/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground-muted">Total Reach / Impressions</p>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-white">{stats.totalReach.toLocaleString()}</h3>
              <div className="flex items-center justify-center gap-1 text-xs text-success font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> +14.2% since last week
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-background-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-sm hover:border-accent-green/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent-green" />
            </div>
            <p className="text-sm font-medium text-foreground-muted">Avg. Engagement Rate</p>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-white">{stats.avgEngagementRate}%</h3>
              <div className="flex items-center justify-center gap-1 text-xs text-success font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> +2.8% since last week
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-background-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-sm hover:border-accent-orange/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-accent-orange/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-accent-orange" />
            </div>
            <p className="text-sm font-medium text-foreground-muted">Total Likes</p>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-white">{stats.totalLikes.toLocaleString()}</h3>
              <div className="flex items-center justify-center gap-1 text-xs text-success font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> +8.4% since last week
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-background-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-sm hover:border-info/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
              <Share2 className="w-6 h-6 text-info" />
            </div>
            <p className="text-sm font-medium text-foreground-muted">Total Shares</p>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-white">{stats.totalShares.toLocaleString()}</h3>
              <div className="flex items-center justify-center gap-1 text-xs text-success font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> +18.9% since last week
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Impressions / Reach Over Time */}
        <div className="bg-background-card rounded-3xl border border-border p-6 md:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Reach & Engagement Trends</h3>
            <p className="text-sm text-foreground-muted">Historical performance over the past 30 days</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b4a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ff6b4a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d9a3" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00d9a3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="name" stroke="#737373" fontSize={12} tickLine={false} />
                <YAxis stroke="#737373" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f0f0f", borderColor: "#262626", color: "#fff" }} />
                <Legend />
                <Area type="monotone" dataKey="reach" name="Reach" stroke="#ff6b4a" fillOpacity={1} fill="url(#colorReach)" strokeWidth={2} />
                <Area type="monotone" dataKey="engagement" name="Engagement" stroke="#00d9a3" fillOpacity={1} fill="url(#colorEngagement)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Platform Distribution */}
        <div className="bg-background-card rounded-3xl border border-border p-6 md:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Platform Performance Breakdown</h3>
            <p className="text-sm text-foreground-muted">Reach and engagement levels comparing active networks</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="platform" stroke="#737373" fontSize={12} tickLine={false} />
                <YAxis stroke="#737373" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f0f0f", borderColor: "#262626", color: "#fff" }} />
                <Legend />
                <Bar dataKey="reach" name="Total Reach" fill="#ff6b4a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="engagement" name="Total Engagement" fill="#ffa726" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Post Performance Table */}
      <div className="bg-background-card rounded-3xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Post Performance Library</h3>
            <p className="text-sm text-foreground-muted">Analyze individual post metrics and trigger instant mock boosts</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              "all", "instagram", "facebook", "twitter", "linkedin", "youtube", "threads",
              "pinterest", "whatsapp", "bluesky", "tiktok", "slack", "telegram",
              "discord", "canva", "medium", "reddit", "twitch", "kick"
            ].map((plat) => (
              <button
                key={plat}
                onClick={() => setFilterPlatform(plat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                  filterPlatform === plat
                    ? "gradient-primary text-white"
                    : "bg-background-input text-foreground-muted hover:bg-background-muted"
                }`}
              >
                {plat === "all" ? "All Platforms" : plat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-foreground-muted text-xs uppercase font-semibold">
                <th className="p-6">Post Details</th>
                <th className="p-6">Platform</th>
                <th className="p-6">Reach</th>
                <th className="p-6 text-center">Engagement</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-foreground-muted">
                    No posts found for the selected platform.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Details */}
                    <td className="p-6 max-w-sm">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted relative overflow-hidden flex-shrink-0">
                          {post.imageUrl ? (
                            <img src={post.imageUrl} alt="post" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full gradient-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">{post.caption}</p>
                          <p className="text-xs text-foreground-muted mt-1">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Platform */}
                    <td className="p-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background-input text-white text-xs font-semibold capitalize border border-border">
                        <span>{platformIcons[(post.platform || post.platforms?.[0])?.toLowerCase() || ""] || "🔗"}</span>
                        {post.platform || post.platforms?.[0] || "Unknown"}
                      </span>
                    </td>

                    {/* Reach */}
                    <td className="p-6 text-sm font-semibold text-white">
                      {post.apiRestricted ? (
                        <span className="text-foreground-muted/60" title="API Restricted for personal profiles">-</span>
                      ) : (
                        post.reach?.toLocaleString()
                      )}
                    </td>

                    {/* Engagement Metrics */}
                    <td className="p-6">
                      {post.apiRestricted ? (
                        <div className="flex justify-center">
                          <span 
                            className="inline-flex items-center px-2.5 py-1 rounded-md bg-warning/10 text-warning text-[10px] font-bold uppercase tracking-wider cursor-help border border-warning/20"
                            title="LinkedIn's API does not provide engagement analytics for personal profile posts. Analytics are only available for supported organization pages."
                          >
                            API Restricted
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-4 text-xs font-medium text-foreground-muted">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-accent-orange" /> {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 text-info" /> {post.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="w-3.5 h-3.5 text-accent-green" /> {post.shares}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-6 text-right">
                      <Button
                        size="sm"
                        disabled={boostingId === post.id}
                        onClick={() => handleBoost(post.id)}
                        className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/25 rounded-xl h-9 px-4 font-semibold text-xs"
                      >
                        <Zap className={`w-3.5 h-3.5 mr-1.5 ${boostingId === post.id ? "animate-bounce" : ""}`} />
                        {boostingId === post.id ? "Boosting..." : "Boost 🚀"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
