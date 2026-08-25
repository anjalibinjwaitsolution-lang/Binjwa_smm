"use client"

import React from "react"
import { 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  MessageCircle, 
  Share2, 
  Globe,
  Video,
  Facebook,
  Tv,
  Palette
} from "lucide-react"
import { 
  FaFacebook, 
  FaTiktok, 
  FaPinterest, 
  FaWhatsapp, 
  FaSlack, 
  FaTelegram, 
  FaDiscord, 
  FaMedium, 
  FaReddit, 
  FaTwitch 
} from "react-icons/fa"

export interface PlatformIconProps {
  platform: string
  className?: string
}

export function PlatformIcon({ platform, className = "w-5 h-5" }: PlatformIconProps) {
  const normalized = (platform || "").toLowerCase()

  switch (normalized) {
    case "facebook":
    case "fb":
      return <FaFacebook className={className} />
    case "instagram":
    case "ig":
      return <Instagram className={className} />
    case "twitter":
    case "x":
      return <Twitter className={className} />
    case "linkedin":
    case "li":
      return <Linkedin className={className} />
    case "youtube":
    case "yt":
      return <Youtube className={className} />
    case "tiktok":
    case "tt":
      return <FaTiktok className={className} />
    case "pinterest":
      return <FaPinterest className={className} />
    case "whatsapp":
    case "wa":
      return <FaWhatsapp className={className} />
    case "threads":
      return <MessageCircle className={className} />
    case "bluesky":
      return <Globe className={className} />
    case "slack":
      return <FaSlack className={className} />
    case "telegram":
    case "tg":
      return <FaTelegram className={className} />
    case "discord":
      return <FaDiscord className={className} />
    case "canva":
      return <Palette className={className} />
    case "medium":
      return <FaMedium className={className} />
    case "reddit":
      return <FaReddit className={className} />
    case "twitch":
      return <FaTwitch className={className} />
    case "kick":
    case "kiks":
      return <Tv className={className} />
    default:
      return <Share2 className={className} />
  }
}

export default PlatformIcon

