import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { editMessageInConversation } from '@/lib/inbox-store'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    const userId = clerkUserId || 'default_user_id'

    const { conversationId, messageId, newText } = await req.json()
    if (!conversationId || !messageId || !newText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const conversations = await editMessageInConversation(userId, conversationId, messageId, newText)
    return NextResponse.json({ success: true, conversations })
  } catch (error: any) {
    console.error('Edit Message API Error:', error)
    return NextResponse.json({ error: 'Failed to edit message' }, { status: 500 })
  }
}
