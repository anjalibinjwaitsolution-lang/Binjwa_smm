import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getInboxConversations } from '@/lib/inbox-store'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId: authId } = await auth()
    const headerUserId = request.headers.get("x-user-id")
    const userId = authId || headerUserId || 'default_user_id'

    const conversations = await getInboxConversations(userId)
    return NextResponse.json({ success: true, conversations })
  } catch (error) {
    console.error('Failed to fetch inbox conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch inbox conversations' }, { status: 500 })
  }
}
