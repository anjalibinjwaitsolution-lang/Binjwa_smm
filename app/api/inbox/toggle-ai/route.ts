import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { toggleAIAutoReply } from '@/lib/inbox-store'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversationId, active } = await req.json()
    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })
    }

    const conversations = await toggleAIAutoReply(userId, conversationId, active)
    return NextResponse.json({ success: true, conversations })
  } catch (error: any) {
    console.error('Toggle AI API Error:', error)
    return NextResponse.json({ error: 'Failed to toggle AI auto-reply' }, { status: 500 })
  }
}
