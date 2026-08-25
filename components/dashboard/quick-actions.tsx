import { Sparkles, Calendar, Upload } from "lucide-react"
import Link from "next/link"

const actions = [
  {
    title: "Generate New Post",
    subtitle: "Create in 30 seconds",
    icon: Sparkles,
    href: "/dashboard/create",
    gradient: "from-primary to-secondary",
  },
  {
    title: "Schedule Campaign",
    subtitle: "Plan your content",
    icon: Calendar,
    href: "/dashboard/calendar",
    gradient: "from-info to-info/80",
  },
  {
    title: "Upload Brand Assets",
    subtitle: "Update your brand kit",
    icon: Upload,
    href: "/dashboard/brand-kit",
    gradient: "from-success to-success/80",
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link key={action.title} href={action.href}>
            <div
              className={`bg-gradient-to-br ${action.gradient} rounded-2xl p-8 text-white card-hover cursor-pointer`}
            >
              <Icon className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-heading font-bold mb-1">{action.title}</h3>
              <p className="text-white/90 text-sm">{action.subtitle}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
