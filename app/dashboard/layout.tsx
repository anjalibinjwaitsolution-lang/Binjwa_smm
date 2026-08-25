import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopBar } from "@/components/dashboard/top-bar"
import { BottomNav } from "@/components/dashboard/bottom-nav"
import { FloatingActionButton } from "@/components/dashboard/floating-action-button"
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background-subtle">
      <DashboardSidebar />

      <div className="lg:pl-[280px]">
        <DashboardTopBar />

        <main className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-24 pb-20 lg:pb-8">{children}</main>
      </div>

      <BottomNav />

      <FloatingActionButton />
      <Toaster />
    </div>
  )
}
