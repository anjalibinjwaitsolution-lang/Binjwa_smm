import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { getSlackConnectionForWebhook, logMessage, getSlackConversationHistory } from '@/lib/db'
import { generateAIResponse } from '@/lib/ai/openrouter'
import { addSimulatedConversationToInbox } from '@/lib/inbox-store'

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'Slack Webhook' })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    // 1. Respond to Slack URL verification challenge for Event Subscriptions
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge })
    }

    const event = body.event || {}
    const teamId = body.team_id || event.team

    // Ignore bot self-messages or empty events
    if (event.bot_id || event.subtype === 'bot_message' || !event.text) {
      return NextResponse.json({ ok: true, note: 'Ignored bot or empty event' })
    }

    const channelId = event.channel
    const messageText = event.text || ''
    const userSlackId = event.user || 'U_MEMBER'
    const threadTs = event.thread_ts || event.ts

    if (!channelId || !messageText) {
      return NextResponse.json({ ok: true, note: 'Missing channel or text' })
    }

    // Lookup Slack connection
    const connectionLookup = await getSlackConnectionForWebhook(teamId)
    if (!connectionLookup) {
      console.warn('[Slack Webhook] No active Slack connection found for team:', teamId)
      return NextResponse.json({ ok: true, note: 'No active connection' })
    }

    const { userId, connection } = connectionLookup
    const botToken = connection.botToken || process.env.SLACK_BOT_TOKEN || ''
    const aiSettings = connection.aiSettings || {}

    console.log(`[Slack Webhook Received] event_type=${event.type}, channel=${channelId}, user=${userSlackId}, text="${messageText}"`)

    // 2. Process AI generation & message posting asynchronously with Vercel waitUntil
    waitUntil(
      (async () => {
        try {
          // Live resolution of channel name via conversations.info API
          let channelName = connection.channels?.find((c: any) => c.id === channelId)?.name || ''
          if (!channelName && botToken && channelId) {
            try {
              const cRes = await fetch(`https://slack.com/api/conversations.info?channel=${encodeURIComponent(channelId)}`, {
                headers: { 'Authorization': `Bearer ${botToken}` }
              })
              const cJson = await cRes.json()
              if (cJson.ok && cJson.channel) {
                channelName = `#${cJson.channel.name}`
              }
            } catch (eChan) {}
          }
          if (!channelName) channelName = `#channel_${channelId}`

          // Live resolution of user real name via users.info API
          let senderName = `Slack User (${userSlackId})`
          let senderHandle = `@slack_${userSlackId}`
          if (botToken && userSlackId && userSlackId !== 'U_MEMBER') {
            try {
              const uRes = await fetch(`https://slack.com/api/users.info?user=${encodeURIComponent(userSlackId)}`, {
                headers: { 'Authorization': `Bearer ${botToken}` }
              })
              const uJson = await uRes.json()
              if (uJson.ok && uJson.user) {
                senderName = uJson.user.real_name || uJson.user.profile?.real_name || uJson.user.name || senderName
                senderHandle = `@${uJson.user.name || userSlackId}`
              }
            } catch (eUser) {}
          }

          // Strip raw Slack mention tags (<@U0BK8RJ4ACW>) from text for clean AI prompt
          const cleanMessageText = messageText.replace(/<@[A-Z0-9]+>/gi, '').trim() || messageText

          // Generate AI response for real user messages (ignore system updates like channel_join)
          const isSystemMessage = event.subtype && event.subtype !== 'thread_broadcast' && event.subtype !== 'file_share'
          let aiReplyText = ''

          if (!isSystemMessage && botToken) {
            try {
              const conversationHistory = await getSlackConversationHistory(String(channelId), 10)
              const prompt = aiSettings.channelPrompt || aiSettings.dmPrompt || 'You are the official AI assistant for Binjwa IT Solutions responding to Slack messages. Be helpful, professional, concise, and accurate.'
              aiReplyText = await generateAIResponse(cleanMessageText, 'Slack', prompt, conversationHistory)

              if (aiReplyText) {
                const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${botToken}`,
                    'Content-Type': 'application/json; charset=utf-8'
                  },
                  body: JSON.stringify({
                    channel: channelId,
                    text: aiReplyText,
                    thread_ts: threadTs
                  })
                })
                const slackJson = await slackRes.json().catch(() => ({}))
                console.log('[Slack Webhook] Posted AI reply to Slack channel:', JSON.stringify(slackJson))
              }
            } catch (errAi) {
              console.error('[Slack Webhook] AI reply failed:', errAi)
            }
          }

          // Log interaction to Supabase message_logs table
          try {
            await logMessage(userId, {
              pageId: String(channelId),
              senderId: `slack:channel:${channelId}:${userSlackId}`,
              message: messageText,
              response: aiReplyText,
              needsReview: false,
              timestamp: new Date().toISOString(),
              senderName,
              postCaption: channelName
            })
          } catch (errDb) {
            console.error('[Slack Webhook] DB log failed:', errDb)
          }

          // Sync to Inbox persistent cache
          try {
            await addSimulatedConversationToInbox(userId, {
              platform: 'Slack',
              isComment: true,
              customerText: messageText,
              aiReply: aiReplyText || 'Channel message received.',
              senderName: `${senderName} in ${channelName}`,
              senderHandle
            })
          } catch (errInbox) {}
        } catch (bgErr) {
          console.error('[Slack Webhook Background Error]:', bgErr)
        }
      })()
    )

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Slack Webhook Error]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
