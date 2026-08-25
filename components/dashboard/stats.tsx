import { Zap, TrendingUp, Clock, Sparkles } from "lucide-react"

interface StatsProps {
  stats: any
  totalPosts: number
}

export function DashboardStats({ stats, totalPosts }: StatsProps) {
  const displayStats = [
    {
      label: "Posts Created",
      value: totalPosts?.toString() || "0",
      icon: Zap,
    },
    {
      label: "Avg Engagement",
      value: stats?.avgEngagementRate ? `${stats.avgEngagementRate}%` : "0%",
      icon: TrendingUp,
    },
    {
      label: "Total Reach",
      value: stats?.totalReach?.toLocaleString() || "0",
      icon: Sparkles,
    },
    {
      label: "Total Likes",
      value: stats?.totalLikes?.toLocaleString() || "0",
      icon: Clock,
    },
    {
      label: "AI Credits",
      value: "50",
      icon: Zap,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {displayStats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="bg-background rounded-2xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-5xl font-heading font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-foreground-muted">{stat.label}</div>
              </div>
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
