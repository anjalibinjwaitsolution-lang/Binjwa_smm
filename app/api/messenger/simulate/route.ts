import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse } from '@/lib/ai/openrouter'
import { addSimulatedConversationToInbox } from '@/lib/inbox-store'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messageText, platform, prompt, isComment, logToInbox, senderName } = await request.json()

    if (!messageText) {
      return NextResponse.json({ error: 'Missing messageText' }, { status: 400 })
    }

    const platformName = platform || 'Instagram'
    const instructions = prompt || `You are a helpful AI assistant for ${platformName}.`

    // Generate response using OpenAI / OpenRouter helper
    const aiReply = await generateAIResponse(
      messageText,
      platformName,
      instructions
    )

    // If logToInbox is enabled (true by default unless explicitly false), save interaction to DB & Inbox
    if (logToInbox !== false) {
      try {
        await addSimulatedConversationToInbox(userId, {
          platform: platformName,
          isComment: !!isComment,
          customerText: messageText,
          aiReply,
          senderName: senderName || 'Test Customer'
        })
      } catch (logErr) {
        console.error('Error logging simulated message to inbox:', logErr)
      }
    }

    return NextResponse.json({
      success: true,
      reply: aiReply,
      platform: platformName,
      isComment: !!isComment,
      logged: logToInbox !== false
    })
  } catch (error: any) {
    console.error('Error simulating AI response:', error)
    return NextResponse.json({ error: 'Failed to simulate response' }, { status: 500 })
  }
}
