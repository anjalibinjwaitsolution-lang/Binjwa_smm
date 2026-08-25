"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardStats } from "@/components/dashboard/stats"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentPosts } from "@/components/dashboard/recent-posts"

export default function DashboardPage() {
  const [data, setData] = useState<any>({ posts: [], stats: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/analytics")
      .then(res => res.json())
      .then(json => {
        if (!json.error) {
          setData(json)
        }
      })
      .catch(err => console.error("Error loading dashboard data:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <DashboardHeader />
      
      {loading ? (
        <div className="h-32 flex items-center justify-center border border-border rounded-2xl bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DashboardStats stats={data.stats} totalPosts={data.posts?.length || 0} />
      )}

      <QuickActions />

      {loading ? (
        <div className="h-64 flex items-center justify-center border border-border rounded-2xl bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <RecentPosts posts={data.posts} />
      )}
    </div>
  )
}
