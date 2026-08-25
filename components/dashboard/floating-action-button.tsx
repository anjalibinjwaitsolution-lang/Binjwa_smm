"use client"

import { Plus } from "lucide-react"
import Link from "next/link"

export function FloatingActionButton() {
  return (
    <Link href="/dashboard/create">
      <button className="fixed bottom-8 right-8 w-16 h-16 rounded-full gradient-primary shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform z-50 animate-pulse">
        <Plus className="w-8 h-8" />
      </button>
    </Link>
  )
}
