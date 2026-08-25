"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"

export function DashboardHeader() {
  const { user, isLoaded } = useUser()
  const [currentDate, setCurrentDate] = useState("")
  const [greeting, setGreeting] = useState("Hello")

  useEffect(() => {
    // Set date on client side to avoid hydration mismatch
    const now = new Date()
    setCurrentDate(now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }))

    const hour = now.getHours()
    if (hour < 12) {
      setGreeting("Good morning")
    } else if (hour < 17) {
      setGreeting("Good afternoon")
    } else {
      setGreeting("Good evening")
    }
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-1">
        {greeting}, {isLoaded && user ? user.firstName : "..."}
      </h1>
      <p className="text-foreground-muted min-h-[24px]">
        {currentDate}
      </p>
    </div>
  )
}
