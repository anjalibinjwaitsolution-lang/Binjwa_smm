import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
export const dynamic = 'force-dynamic'
import {
  getLinkedInConnection,
  getFacebookConnection,
  getTwitterConnection,
  getInstagramConnection,
  getYouTubeConnections,
  getThreadsConnection,
  getPinterestConnection,
  getWhatsAppConnection,
  getBlueskyConnection,
  getTikTokConnection,
  getSlackConnection,
  getTelegramConnection,
  getDiscordConnection,
  getCanvaConnection,
  getMediumConnection,
  getRedditConnection,
  getTwitchConnection,
  getKickConnection
} from '@/lib/db'

export async function GET() {
  let userId: string | null = null
  try {
    const res = await auth()
    userId = res.userId
  } catch (e) {}

  if (!userId) {
    userId = "default_user_id"
  }

  const platforms: {
    id: string;
    name: string;
    connected: boolean;
    accounts: any[];
    permissions: string[];
  }[] = [
    { id: "instagram", name: "Instagram Business", connected: false, accounts: [], permissions: ["Publish posts", "Read insights", "Manage comments"] },
    { id: "facebook", name: "Facebook Pages", connected: false, accounts: [], permissions: ["Publish posts", "Read insights", "Manage comments"] },
    { id: "twitter", name: "Twitter", connected: false, accounts: [], permissions: ["Publish tweets", "Read analytics"] },
    { id: "linkedin", name: "LinkedIn", connected: false, accounts: [], permissions: ["Publish posts", "Read analytics"] },
    { id: "youtube", name: "YouTube", connected: false, accounts: [], permissions: ["Upload videos", "Manage playlists", "Read analytics"] },
    { id: "threads", name: "Threads", connected: false, accounts: [], permissions: ["Publish posts", "Read analytics"] },
    { id: "pinterest", name: "Pinterest", connected: false, accounts: [], permissions: ["Publish pins", "Read analytics"] },
    { id: "whatsapp", name: "WhatsApp Business", connected: false, accounts: [], permissions: ["Send messages", "Manage templates"] },
    { id: "bluesky", name: "Bluesky", connected: false, accounts: [], permissions: ["Publish posts", "Read analytics"] },
    { id: "tiktok", name: "TikTok", connected: false, accounts: [], permissions: ["Publish videos", "Read analytics"] },
    { id: "slack", name: "Slack Workspaces", connected: false, accounts: [], permissions: ["Publish messages", "Manage channels", "Read analytics"] },
    { id: "telegram", name: "Telegram Channels", connected: false, accounts: [], permissions: ["Publish messages", "Manage bot replies", "Read analytics"] },
    { id: "discord", name: "Discord Servers", connected: false, accounts: [], permissions: ["Send messages", "Manage channels", "Read analytics"] },
    { id: "canva", name: "Canva Workspaces", connected: false, accounts: [], permissions: ["Access workspaces", "Export designs", "Publish graphics"] },
    { id: "medium", name: "Medium Publications", connected: false, accounts: [], permissions: ["Publish articles", "Read publications", "Read analytics"] },
    { id: "reddit", name: "Reddit Subreddits", connected: false, accounts: [], permissions: ["Submit posts", "Manage subreddits", "Read analytics"] },
    { id: "twitch", name: "Twitch Channels", connected: false, accounts: [], permissions: ["Announce streams", "Manage channel chat", "Read analytics"] },
    { id: "kick", name: "Kick Channels", connected: false, accounts: [], permissions: ["Announce streams", "Manage channel chat", "Read analytics"] }
  ]

  const ig = await getInstagramConnection(userId)
  if (ig) {
    const p = platforms.find(p => p.id === 'instagram')
    if (p) {
      p.connected = true
      p.accounts.push({ id: ig.id, handle: ig.username || ig.name, accountType: ig.accountType || "Business", lastSynced: "Just now" })
    }
  }

  const fb = await getFacebookConnection(userId)
  if (fb) {
    const p = platforms.find(p => p.id === 'facebook')
    if (p) {
      p.connected = true
      if (fb.pages && fb.pages.length > 0) {
        fb.pages.forEach((page: any) => {
          p.accounts.push({ id: page.id, handle: page.name, accountType: "Business", aiEnabled: page.aiEnabled || false, lastSynced: "Just now" })
        })
      } else {
        p.accounts.push({ id: fb.id, handle: fb.name, accountType: "Personal", lastSynced: "Just now" })
      }
    }
  }

  const tw = await getTwitterConnection(userId)
  if (tw) {
    const p = platforms.find(p => p.id === 'twitter')
    if (p) {
      p.connected = true
      p.accounts.push({ id: tw.id, handle: tw.handle || tw.name, accountType: "Business", lastSynced: "Just now" })
    }
  }

  const li = await getLinkedInConnection(userId)
  if (li) {
    const p = platforms.find(p => p.id === 'linkedin')
    if (p) {
      p.connected = true
      p.accounts.push({ id: li.id, handle: li.name, accountType: "Business", lastSynced: "Just now" })
    }
  }

  const yt = await getYouTubeConnections(userId)
  if (yt && yt.length > 0) {
    const p = platforms.find(p => p.id === 'youtube')
    if (p) {
      p.connected = true
      yt.forEach(channel => {
        p.accounts.push({ id: channel.id, handle: channel.handle || channel.name, accountType: "Personal", lastSynced: "Just now" })
      })
    }
  }

  const th = await getThreadsConnection(userId)
  if (th) {
    const p = platforms.find(p => p.id === 'threads')
    if (p) {
      p.connected = true
      p.accounts.push({ id: th.id, handle: th.username || th.name, accountType: "Business", lastSynced: "Just now" })
    }
  }

  const pin = await getPinterestConnection(userId)
  if (pin) {
    const p = platforms.find(p => p.id === 'pinterest')
    if (p) {
      p.connected = true
      p.accounts.push({ id: pin.id, handle: pin.username || pin.name, accountType: "Personal", lastSynced: "Just now" })
    }
  }

  const wa = await getWhatsAppConnection(userId)
  if (wa) {
    const p = platforms.find(p => p.id === 'whatsapp')
    if (p) {
      p.connected = true
      p.accounts.push({ id: wa.id, handle: wa.phoneNumberId || wa.name, accountType: "Business", lastSynced: "Just now" })
    }
  }

  const bsky = await getBlueskyConnection(userId)
  if (bsky) {
    const p = platforms.find(p => p.id === 'bluesky')
    if (p) {
      p.connected = true
      p.accounts.push({ id: bsky.id, handle: bsky.handle || bsky.name, accountType: "Business", lastSynced: "Just now" })
    }
  }

  const tk = await getTikTokConnection(userId)
  if (tk) {
    const p = platforms.find(p => p.id === 'tiktok')
    if (p) {
      p.connected = true
      p.accounts.push({ id: tk.id, handle: tk.username || tk.name, accountType: "Business", lastSynced: "Just now" })
    }
  }

  const slackConn = await getSlackConnection(userId)
  if (slackConn) {
    const p = platforms.find(p => p.id === 'slack')
    if (p) {
      p.connected = true
      if (slackConn.channels && slackConn.channels.length > 0) {
        slackConn.channels.forEach((ch: any) => {
          p.accounts.push({ id: ch.id, handle: `${slackConn.name} (${ch.name})`, accountType: "Business", lastSynced: "Just now", parentId: slackConn.id })
        })
      } else {
        p.accounts.push({ id: slackConn.id, handle: slackConn.name, accountType: "Business", lastSynced: "Just now" })
      }
    }
  }

  const tgConn = await getTelegramConnection(userId)
  if (tgConn) {
    const p = platforms.find(p => p.id === 'telegram')
    if (p) {
      p.connected = true
      if (tgConn.channels && tgConn.channels.length > 0) {
        tgConn.channels.forEach((ch: any) => {
          p.accounts.push({ id: ch.id, handle: `${tgConn.name} (${ch.name})`, accountType: "Business", lastSynced: "Just now", parentId: tgConn.id })
        })
      } else {
        p.accounts.push({ id: tgConn.id, handle: tgConn.username || tgConn.name, accountType: "Business", lastSynced: "Just now" })
      }
    }
  }

  const discConn = await getDiscordConnection(userId)
  if (discConn) {
    const p = platforms.find(p => p.id === 'discord')
    if (p) {
      p.connected = true
      if (discConn.channels && discConn.channels.length > 0) {
        discConn.channels.forEach((ch: any) => {
          p.accounts.push({ id: ch.id, handle: `${discConn.name} (${ch.name})`, accountType: "Business", lastSynced: "Just now", parentId: discConn.id })
        })
      } else {
        p.accounts.push({ id: discConn.id, handle: discConn.name, accountType: "Business", lastSynced: "Just now" })
      }
    }
  }

  const canvaConn = await getCanvaConnection(userId)
  if (canvaConn) {
    const p = platforms.find(p => p.id === 'canva')
    if (p) {
      p.connected = true
      p.accounts.push({ id: canvaConn.id, handle: canvaConn.name, accountType: "Business", lastSynced: "Just now" })
    }
  }

  const mediumConn = await getMediumConnection(userId)
  if (mediumConn) {
    const p = platforms.find(p => p.id === 'medium')
    if (p) {
      p.connected = true
      if (mediumConn.publications && mediumConn.publications.length > 0) {
        mediumConn.publications.forEach((pub: any) => {
          p.accounts.push({ id: pub.id, handle: `${mediumConn.name} (${pub.name})`, accountType: "Business", lastSynced: "Just now", parentId: mediumConn.id })
        })
      } else {
        p.accounts.push({ id: mediumConn.id, handle: mediumConn.username || mediumConn.name, accountType: "Business", lastSynced: "Just now" })
      }
    }
  }

  const redditConn = await getRedditConnection(userId)
  if (redditConn) {
    const p = platforms.find(p => p.id === 'reddit')
    if (p) {
      p.connected = true
      if (redditConn.subreddits && redditConn.subreddits.length > 0) {
        redditConn.subreddits.forEach((sub: any) => {
          p.accounts.push({ id: sub.id, handle: `${redditConn.name} (${sub.name})`, accountType: "Business", lastSynced: "Just now", parentId: redditConn.id })
        })
      } else {
        p.accounts.push({ id: redditConn.id, handle: redditConn.username || redditConn.name, accountType: "Business", lastSynced: "Just now" })
      }
    }
  }

  const twitchConn = await getTwitchConnection(userId)
  if (twitchConn) {
    const p = platforms.find(p => p.id === 'twitch')
    if (p) {
      p.connected = true
      p.accounts.push({ id: twitchConn.id, handle: twitchConn.username || twitchConn.name, accountType: "Personal", lastSynced: "Just now" })
    }
  }

  const kickConn = await getKickConnection(userId)
  if (kickConn) {
    const p = platforms.find(p => p.id === 'kick')
    if (p) {
      p.connected = true
      p.accounts.push({ id: kickConn.id, handle: kickConn.username || kickConn.name, accountType: "Personal", lastSynced: "Just now" })
    }
  }

  // Return simplified accounts array for create modal
  const accounts: any[] = []
  platforms.forEach(p => {
    p.accounts.forEach((acc: any) => {
      accounts.push({ id: acc.id, name: acc.handle, handle: acc.handle, platform: p.id })
    })
  })

  return NextResponse.json({ accounts, platforms, facebook: fb, instagram: ig })
}
