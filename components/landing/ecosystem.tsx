"use client"

import React from "react"
import { Share2, Instagram, Linkedin, Twitter, Youtube, MessageCircle, Bot, Sparkles } from "lucide-react"

export function LandingEcosystem() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Integrated Social Ecosystem</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            All Your Channels, Unified
          </h2>
          <p className="mt-4 text-lg text-foreground-muted">
            Seamlessly publish, schedule, and automate AI conversations across Instagram, Facebook, LinkedIn, and more from a single powerful dashboard.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border/40 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-[#E1306C]/10 flex items-center justify-center mb-4">
              <Instagram className="w-6 h-6 text-[#E1306C]" />
            </div>
            <h3 className="font-semibold text-white">Instagram</h3>
            <p className="text-xs text-foreground-muted mt-1">Reels, Posts & DMs</p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/40 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center mb-4">
              <Linkedin className="w-6 h-6 text-[#0A66C2]" />
            </div>
            <h3 className="font-semibold text-white">LinkedIn</h3>
            <p className="text-xs text-foreground-muted mt-1">Professional Content & Articles</p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/40 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-[#1DA1F2]/10 flex items-center justify-center mb-4">
              <Twitter className="w-6 h-6 text-[#1DA1F2]" />
            </div>
            <h3 className="font-semibold text-white">X / Twitter</h3>
            <p className="text-xs text-foreground-muted mt-1">Threads & Scheduled Tweets</p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/40 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FF0000]/10 flex items-center justify-center mb-4">
              <Youtube className="w-6 h-6 text-[#FF0000]" />
            </div>
            <h3 className="font-semibold text-white">YouTube</h3>
            <p className="text-xs text-foreground-muted mt-1">Shorts & Video Automation</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LandingEcosystem
