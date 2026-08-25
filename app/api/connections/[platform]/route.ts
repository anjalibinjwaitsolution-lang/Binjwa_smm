import { NextRequest, NextResponse } from "next/server"

const oauthRoutes: Record<string, string> = {
  facebook: "/api/auth/facebook",
  instagram: "/api/auth/instagram",
  twitter: "/api/auth/twitter",
  linkedin: "/api/auth/linkedin",
  youtube: "/api/auth/youtube",
  threads: "/api/auth/threads",
  whatsapp: "/api/auth/facebook",
  pinterest: "/api/auth/pinterest",
  tiktok: "/api/auth/tiktok",
  bluesky: "/api/auth/twitter",
  slack: "/api/auth/slack",
  telegram: "/api/auth/telegram",
  discord: "/api/auth/discord",
  canva: "/api/auth/canva",
  medium: "/api/auth/medium",
  reddit: "/api/auth/reddit",
  twitch: "/api/auth/twitch",
  kick: "/api/auth/kick",
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  const normalizedPlatform = platform.toLowerCase()

  const url = oauthRoutes[normalizedPlatform] || `/api/auth/${normalizedPlatform}`

  return NextResponse.json({
    success: true,
    platform: normalizedPlatform,
    url,
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  return POST(request, { params })
}
