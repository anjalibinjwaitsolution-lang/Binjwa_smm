"use client"

import { useState } from "react"
import { Search, Grid3x3, List, ChevronDown, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface LibraryFiltersProps {
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedStatus: string
  setSelectedStatus: (status: string) => void
  selectedPlatform: string
  setSelectedPlatform: (platform: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
}

const statusFilters = ["All", "Published", "Scheduled", "Draft"]
const platformFilters = [
  "All Platforms",
  "Instagram", "Facebook", "Twitter", "LinkedIn", "YouTube", "Threads",
  "Pinterest", "WhatsApp", "Bluesky", "TikTok", "Slack", "Telegram",
  "Discord", "Canva", "Medium", "Reddit", "Twitch", "Kick"
]
const sortFilters = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "engagement", label: "Most Popular" },
]

export function LibraryFilters({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedPlatform,
  setSelectedPlatform,
  sortBy,
  setSortBy,
}: LibraryFiltersProps) {
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const activeSortLabel = sortFilters.find((s) => s.value === sortBy)?.label || "Newest"

  return (
    <div className="bg-background/80 backdrop-blur-lg rounded-2xl shadow-sm p-4 sticky top-24 z-30 border border-border">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
            <Input
              type="search"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 rounded-full bg-background-subtle border-0 text-white placeholder-foreground-muted"
            />
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
                status === selectedStatus
                  ? "bg-white text-black hover:bg-[#f5f5f5] transition-colors shadow-lg"
                  : "bg-background-subtle text-foreground hover:bg-background-muted"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Platform Filter */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => {
              setShowPlatformDropdown(!showPlatformDropdown)
              setShowSortDropdown(false)
            }}
            className="rounded-full bg-transparent border-border text-foreground hover:bg-background-subtle"
          >
            {selectedPlatform === "All" ? "Platforms" : selectedPlatform}
            <ChevronDown className="ml-2 w-4 h-4" />
          </Button>

          {showPlatformDropdown && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
              {platformFilters.map((platform) => {
                const isSelected =
                  platform === "All Platforms" ? selectedPlatform === "All" : selectedPlatform === platform
                return (
                  <button
                    key={platform}
                    onClick={() => {
                      setSelectedPlatform(platform === "All Platforms" ? "All" : platform)
                      setShowPlatformDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-background-subtle flex items-center justify-between text-foreground"
                  >
                    {platform}
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-background-subtle rounded-full p-1 border border-border/40">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-full transition-all ${
              viewMode === "grid" ? "bg-background shadow-sm text-primary" : "text-foreground-muted hover:bg-background/50"
            }`}
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-full transition-all ${
              viewMode === "list" ? "bg-background shadow-sm text-primary" : "text-foreground-muted hover:bg-background/50"
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Sort */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => {
              setShowSortDropdown(!showSortDropdown)
              setShowPlatformDropdown(false)
            }}
            className="rounded-full bg-transparent border-border text-foreground hover:bg-background-subtle"
          >
            Sort by: {activeSortLabel}
            <ChevronDown className="ml-2 w-4 h-4" />
          </Button>

          {showSortDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
              {sortFilters.map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    setSortBy(s.value)
                    setShowSortDropdown(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-background-subtle flex items-center justify-between text-foreground"
                >
                  {s.label}
                  {sortBy === s.value && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
