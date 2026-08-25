import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { userId: authId } = await auth()
    const headerUserId = req.headers.get("x-user-id")
    const userId = authId || headerUserId || 'default_user_id'

    const body = await req.json().catch(() => ({}))
    const botToken = (body.botToken || process.env.DISCORD_BOT_TOKEN || '').trim().replace(/^"|"$/g, '')

    if (!botToken) {
      return NextResponse.json({ error: 'Discord Bot Token is required' }, { status: 400 })
    }

    // 1. Verify Bot Token & fetch Bot Profile
    const meRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { 'Authorization': `Bot ${botToken}` }
    })
    const meJson = await meRes.json()

    if (!meRes.ok || !meJson.id) {
      return NextResponse.json({ error: meJson.message || 'Invalid Discord Bot Token' }, { status: 400 })
    }

    // 2. Fetch Guilds (Servers) where the Bot is present
    const gRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { 'Authorization': `Bot ${botToken}` }
    })
    const guilds = gRes.ok ? await gRes.json() : []

    const discoveredServers: Array<{
      guildId: string
      serverName: string
      channels: Array<{ id: string; name: string; type: number }>
    }> = []

    if (Array.isArray(guilds)) {
      for (const guild of guilds) {
        try {
          const cRes = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/channels`, {
            headers: { 'Authorization': `Bot ${botToken}` }
          })
          if (cRes.ok) {
            const cList = await cRes.json()
            if (Array.isArray(cList)) {
              const textChannels = cList
                .filter((c: any) => c.type === 0)
                .map((c: any) => ({
                  id: String(c.id),
                  name: `#${c.name}`,
                  type: c.type
                }))

              discoveredServers.push({
                guildId: String(guild.id),
                serverName: guild.name || `Discord Server (${guild.id})`,
                channels: textChannels
              })
            }
          }
        } catch (eChan) {}
      }
    }

    return NextResponse.json({
      success: true,
      bot: {
        id: meJson.id,
        username: meJson.username,
        globalName: meJson.global_name || meJson.username
      },
      servers: discoveredServers
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to check Discord bot channels' }, { status: 500 })
  }
}
