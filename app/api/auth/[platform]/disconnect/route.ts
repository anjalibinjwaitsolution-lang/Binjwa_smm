import { NextRequest, NextResponse } from 'next/server'
import {
  deleteSlackConnection,
  deleteTelegramConnection,
  deleteDiscordConnection,
  deleteCanvaConnection,
  deleteMediumConnection,
  deleteRedditConnection,
  deleteTwitchConnection,
  deleteKickConnection,
  deleteConnection
} from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { userId } = await auth()
    const targetUserId = userId || 'default_user_id'
    const { platform } = await params
    const p = platform.toLowerCase()

    switch (p) {
      case 'slack':
        await deleteSlackConnection(targetUserId)
        break
      case 'telegram':
        await deleteTelegramConnection(targetUserId)
        break
      case 'discord':
        await deleteDiscordConnection(targetUserId)
        break
      case 'canva':
        await deleteCanvaConnection(targetUserId)
        break
      case 'medium':
        await deleteMediumConnection(targetUserId)
        break
      case 'reddit':
        await deleteRedditConnection(targetUserId)
        break
      case 'twitch':
        await deleteTwitchConnection(targetUserId)
        break
      case 'kick':
        await deleteKickConnection(targetUserId)
        break
      default:
        await deleteConnection(targetUserId, p)
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Disconnect Error:', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
