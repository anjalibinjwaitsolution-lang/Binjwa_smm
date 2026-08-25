import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { getDiscordConnectionForWebhook, logMessage, getDiscordConversationHistory } from '@/lib/db'
import { generateAIResponse } from '@/lib/ai/openrouter'
import { addSimulatedConversationToInbox } from '@/lib/inbox-store'

import nacl from 'tweetnacl'

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'Discord Webhook' })
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-signature-ed25519')
    const timestamp = request.headers.get('x-signature-timestamp')
    const rawBody = await request.text()

    const publicKey = process.env.DISCORD_PUBLIC_KEY || ''

    // Verify Ed25519 signature if headers are present
    if (signature && timestamp && publicKey) {
      try {
        const isVerified = nacl.sign.detached.verify(
          Buffer.from(timestamp + rawBody),
          Buffer.from(signature, 'hex'),
          Buffer.from(publicKey, 'hex')
        )
        if (!isVerified) {
          return new NextResponse('Invalid request signature', { status: 401 })
        }
      } catch (errSig) {
        console.warn('[Discord Webhook] Signature verification warning:', errSig)
      }
    }

    const body = JSON.parse(rawBody || '{}')

    // 1. Handle Discord Interaction Verification (PING / PONG)
    if (body.type === 1) {
      return new NextResponse(JSON.stringify({ type: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const event = body.d || body.event || body.data || body
    const guildId = body.guild_id || event.guild_id || '1531201717885206580'
    const channelId = body.channel_id || event.channel_id || '1531201718371483780'
    const authorObj = event.author || event.user || body.member?.user || {}
    const messageText = event.content || body.content || event.message || ''

    // Ignore bot self-messages or empty events
    if (authorObj.bot || !messageText) {
      return NextResponse.json({ ok: true, note: 'Ignored bot or empty event' })
    }

    // Lookup Discord connection
    const connectionLookup = await getDiscordConnectionForWebhook(guildId)
    if (!connectionLookup) {
      return NextResponse.json({ ok: true, note: 'No active Discord connection' })
    }

    const { userId, connection } = connectionLookup
    const botToken = connection.botToken || process.env.DISCORD_BOT_TOKEN || ''
    const aiSettings = connection.aiSettings || {}

    const senderName = authorObj.global_name || authorObj.username || 'Discord User'
    const senderHandle = authorObj.username ? `@${authorObj.username}` : `@discord_${authorObj.id || 'user'}`

    // 2. Check if AI should respond (DMs OR explicit @mention / reply to bot in channels)
    const botUserId = '1531232587329175552'
    const isDm = !guildId || event.channel_type === 1 || event.type === 1
    const mentionsList = Array.isArray(event.mentions) ? event.mentions : []
    const mentionsBot = mentionsList.some((m: any) => m.id === botUserId || m.bot || String(m.username || '').toLowerCase().includes('binjwa'))
    const containsBotName = messageText.toLowerCase().includes('binjwa') || messageText.toLowerCase().includes('bot') || messageText.toLowerCase().includes('@binjwa')
    const isReplyToBot = event.referenced_message?.author?.id === botUserId || event.referenced_message?.author?.bot || Boolean(event.message_reference)

    const shouldAiRespond = isDm || mentionsBot || containsBotName || isReplyToBot || aiSettings.aiEnabled !== false

    console.log(`[Discord Webhook Received] channel=${channelId}, user=${senderName}, text="${messageText}", shouldAiRespond=${shouldAiRespond}`)

    // 3. Process AI generation & Discord posting asynchronously with Vercel waitUntil
    waitUntil(
      (async () => {
        try {
          // Resolve channel name dynamically
          let channelName = connection.channels?.find((c: any) => c.id === channelId)?.name || ''
          if (!channelName && botToken && channelId) {
            try {
              const cRes = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
                headers: { 'Authorization': `Bot ${botToken}` }
              })
              const cJson = await cRes.json()
              if (cJson.name) channelName = `#${cJson.name}`
            } catch (eChan) {}
          }
          if (!channelName) channelName = `#channel_${channelId}`

          // Strip bot mentions from text for clean prompt
          const cleanMessageText = messageText.replace(/<@[!&]?[0-9]+>/gi, '').trim() || messageText

          let aiReplyText = ''
          if (aiSettings.aiEnabled !== false && shouldAiRespond && botToken) {
            try {
              const conversationHistory = await getDiscordConversationHistory(String(channelId), 10)
              const prompt = aiSettings.channelPrompt || aiSettings.dmPrompt || 'You are the official AI assistant for Binjwa IT Solutions responding to Discord messages. Be helpful, professional, concise, and accurate.'
              aiReplyText = await generateAIResponse(cleanMessageText, 'Discord', prompt, conversationHistory)

              if (aiReplyText) {
                const postRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bot ${botToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    content: aiReplyText,
                    ...(event.id ? { message_reference: { message_id: event.id } } : {})
                  })
                })
                const postJson = await postRes.json().catch(() => ({}))
                console.log('[Discord Webhook] Posted AI reply to Discord:', postJson)
              }
            } catch (errAi) {
              console.error('[Discord Webhook] AI reply failed:', errAi)
            }
          }

          // Log interaction to Supabase message_logs table
          try {
            await logMessage(userId, {
              pageId: String(channelId),
              senderId: `discord:channel:${channelId}:${authorObj.id || 'user'}`,
              message: messageText,
              response: aiReplyText,
              needsReview: false,
              timestamp: new Date().toISOString(),
              senderName,
              postCaption: channelName
            })
          } catch (errDb) {
            console.error('[Discord Webhook] DB log failed:', errDb)
          }

          // Sync to Inbox persistent cache
          try {
            await addSimulatedConversationToInbox(userId, {
              platform: 'Discord',
              isComment: true,
              customerText: messageText,
              aiReply: aiReplyText || 'Discord message received.',
              senderName: `${senderName} in ${channelName}`,
              senderHandle
            })
          } catch (errInbox) {}
        } catch (bgErr) {
          console.error('[Discord Webhook Background Error]:', bgErr)
        }
      })()
    )

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Discord Webhook Error]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
