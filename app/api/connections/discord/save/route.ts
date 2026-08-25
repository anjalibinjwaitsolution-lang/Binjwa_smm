import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { saveDiscordConnection } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId: authId } = await auth()
    const headerUserId = req.headers.get("x-user-id")
    const userId = authId || headerUserId || 'default_user_id'

    const body = await req.json().catch(() => ({}))
    const botToken = (body.botToken || process.env.DISCORD_BOT_TOKEN || '').trim().replace(/^"|"$/g, '')
    const selectedChannels = Array.isArray(body.channels) ? body.channels : []
    const serverName = body.serverName || "binjwaitsolution's server"
    const guildId = body.guildId || '1531201717885206580'

    if (!botToken) {
      return NextResponse.json({ error: 'Discord Bot Token is required' }, { status: 400 })
    }

    const connectionData = {
      id: guildId,
      name: serverName,
      guildId: guildId,
      channels: selectedChannels.length > 0 ? selectedChannels : [
        { id: '1531201718371483780', name: '#general' },
        { id: '1532099282495340794', name: '#test' }
      ],
      avatar: '/placeholder.svg?height=64&width=64',
      connectedAt: new Date().toISOString(),
      accessToken: botToken,
      botToken: botToken
    }

    await saveDiscordConnection(userId, connectionData)

    return NextResponse.json({
      success: true,
      message: 'Discord channels saved successfully!',
      connection: connectionData
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save Discord connection' }, { status: 500 })
  }
}
