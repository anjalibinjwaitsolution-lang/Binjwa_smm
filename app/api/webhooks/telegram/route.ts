import { NextRequest, NextResponse } from 'next/server'
import { getTelegramConnectionForWebhook, logMessage, getTelegramConversationHistory, autoRegisterTelegramChannel } from '@/lib/db'
import { generateAIResponse } from '@/lib/ai/openrouter'
import { addSimulatedConversationToInbox } from '@/lib/inbox-store'
import { supabase } from '@/lib/supabase'

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'Telegram Webhook' })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const update = body || {}

    // Handle Telegram message_reaction update if received
    if (update.message_reaction) {
      const reactionObj = update.message_reaction
      const rChatId = reactionObj.chat?.id
      const rMessageId = reactionObj.message_id
      const rUser = reactionObj.user || {}
      const emoji = reactionObj.new_reaction?.[0]?.emoji || '👍'
      const senderName = `${rUser.first_name || ''} ${rUser.last_name || ''}`.trim() || 'Telegram User'
      const senderHandle = rUser.username ? `@${rUser.username}` : `@user_${rUser.id}`

      const connectionLookup = await getTelegramConnectionForWebhook()
      const userId = connectionLookup?.userId || 'default_user_id'

      await addSimulatedConversationToInbox(userId, {
        platform: 'Telegram',
        isComment: reactionObj.chat?.type !== 'private',
        customerText: `[Reaction ${emoji} added by ${senderName} on message #${rMessageId}]`,
        aiReply: `Acknowledged reaction ${emoji}.`,
        senderName,
        senderHandle,
        chatId: String(rChatId),
        messageId: String(rMessageId),
        reactions: [{ emoji, user_id: rUser.id, user_name: senderName }]
      })

      return NextResponse.json({ ok: true, note: 'Reaction logged' })
    }

    // Telegram sends update object with message or channel_post
    const msg = update.message || update.channel_post || update.edited_message || update.edited_channel_post
    if (!msg) {
      return NextResponse.json({ ok: true, note: 'No message content in update' })
    }

    const chatId = msg.chat?.id
    const messageId = msg.message_id
    const fromObj = msg.from || {}
    const chatType = msg.chat?.type || 'private'
    const isChannel = chatType === 'channel' || chatType === 'supergroup' || chatType === 'group' || Boolean(update.channel_post)

    // Fetch connection lookup & past 6 messages in parallel for sub-second execution
    const [connectionLookup, conversationHistory] = await Promise.all([
      getTelegramConnectionForWebhook(String(chatId)),
      getTelegramConversationHistory(String(chatId), 6)
    ])

    const userId = connectionLookup?.userId || 'default_user_id'
    const connection: any = connectionLookup?.connection || {
      username: 'binjwa_bot',
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      aiSettings: {
        aiEnabled: true,
        aiCommentsEnabled: true,
        dmPrompt: 'You are a helpful AI assistant responding on Telegram.',
        channelPrompt: 'You are a helpful AI assistant responding on Telegram group chats and channels.'
      }
    }
    const botToken = connection.botToken || process.env.TELEGRAM_BOT_TOKEN || ''

    // Dynamically auto-register any newly discovered channel or group where the bot is active
    if (chatId && msg.chat?.title) {
      autoRegisterTelegramChannel(userId, chatId, msg.chat.title, msg.chat.username).catch(() => {})
    }

    // Ignore bot self-messages ONLY if sent by this exact bot handle to prevent loops
    const selfUsername = (connection.username || 'binjwa_bot').replace(/^@/, '').toLowerCase()
    if (fromObj.is_bot && fromObj.username && fromObj.username.toLowerCase() === selfUsername) {
      return NextResponse.json({ ok: true, note: 'Ignored bot self-reply' })
    }

    let mediaUrl = ''
    let mediaType: 'image' | 'video' | 'document' | 'audio' | undefined = undefined
    let mediaName = ''

    if (Array.isArray(msg.photo) && msg.photo.length > 0 && botToken) {
      const photo = msg.photo[msg.photo.length - 1]
      mediaType = 'image'
      try {
        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${photo.file_id}`)
        if (fileRes.ok) {
          const fileData = await fileRes.json()
          if (fileData.result?.file_path) {
            mediaUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`
          }
        }
      } catch (e) {}
    } else if (msg.video && botToken) {
      mediaType = 'video'
      try {
        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${msg.video.file_id}`)
        if (fileRes.ok) {
          const fileData = await fileRes.json()
          if (fileData.result?.file_path) {
            mediaUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`
          }
        }
      } catch (e) {}
    } else if (msg.document && botToken) {
      mediaType = 'document'
      mediaName = msg.document.file_name || 'Attachment'
    } else if ((msg.voice || msg.audio) && botToken) {
      mediaType = 'audio'
    }

    const rawMessageText = msg.text || msg.caption || (mediaType ? `[${mediaType.toUpperCase()} Attached]` : '')
    if (!chatId || !rawMessageText) {
      return NextResponse.json({ ok: true, note: 'Missing chatId or text' })
    }
    const messageText = rawMessageText

    const senderUserId = String(fromObj.id || '')
    const firstName = fromObj.first_name || ''
    const lastName = fromObj.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim()
    const realPersonName = fullName || (fromObj.username ? `@${fromObj.username}` : '') || (msg.author_signature ? msg.author_signature : '') || (msg.chat?.title ? msg.chat.title : 'Telegram Member')
    const senderName = realPersonName
    const senderHandle = fromObj.username ? `@${fromObj.username}` : (senderUserId ? `[ID: ${senderUserId}]` : `@tg_${String(chatId).slice(-6)}`)
    const messageTimestamp = msg.date ? new Date(msg.date * 1000).toISOString() : new Date().toISOString()

    let aiReplyText = ''
    let sentTelegramMessageId: string | undefined = undefined
    const aiSettings = connection.aiSettings || {}

    const botUsername = selfUsername
    const lowerMsg = messageText.toLowerCase()

    // 1. Check if bot is explicitly tagged in the text
    const isBotTagged = lowerMsg.includes('@binjwa_bot') ||
                        lowerMsg.includes('binjwa_bot') ||
                        lowerMsg.includes('binjwabot') ||
                        lowerMsg.includes('@pranshu') ||
                        (botUsername && lowerMsg.includes(`@${botUsername}`))

    // 2. Check if user is QUOTING / REPLAYING directly to an AI response message
    const replyToMsg = msg.reply_to_message || {}
    const replyFromObj = replyToMsg.from || {}
    const replyFromUsername = (replyFromObj.username || '').toLowerCase()
    const isReplyingToBot = Boolean(replyToMsg.message_id) &&
                            (replyFromObj.is_bot ||
                             replyFromUsername === botUsername ||
                             replyFromUsername.includes('bot') ||
                             replyFromUsername.includes('binjwa') ||
                             Boolean(replyToMsg.text && (replyToMsg.text.includes('AI') || replyToMsg.text.includes('Binjwa'))))

    // 3. Check if ANOTHER human is explicitly tagged (e.g. @XYZ, @John)
    const matches = messageText.match(/@([a-zA-Z0-9_]+)/g) || []
    const taggedUsernames = matches.map((m: string) => m.replace(/^@/, '').toLowerCase())
    const isHumanTaggedOnly = taggedUsernames.length > 0 &&
                              taggedUsernames.every((uname: string) => uname !== botUsername && !uname.includes('binjwa') && !uname.includes('bot')) &&
                              !isBotTagged

    // AI AUTO-REPLY RULES:
    // - For DMs (isChannel = false): ALWAYS reply
    // - For Channels & Groups (isChannel = true):
    //   -> IF human is tagged alone (without bot) -> STAY SILENT (shouldAiReply = false)
    //   -> IF bot is tagged OR user is quoting AI -> REPLY (shouldAiReply = true)
    //   -> OTHERWISE -> STAY SILENT (shouldAiReply = false)
    const shouldAiReply = Boolean(botToken) && (
      !isChannel
        ? true
        : ((isBotTagged || isReplyingToBot) && !isHumanTaggedOnly)
    )

    // 1. Generate & dispatch AI response directly to Telegram API
    if (shouldAiReply && botToken) {
      try {
        const defaultPrompt = 'You are Pranshu Tiwari\'s official AI Assistant. Respond on behalf of Pranshu in this Telegram group, channel, or chat whenever someone mentions you.'
        const basePrompt = isChannel
          ? (aiSettings.channelPrompt || aiSettings.commentPrompt || aiSettings.dmPrompt || defaultPrompt)
          : (aiSettings.dmPrompt || defaultPrompt)

        const prompt = `${basePrompt}\n\nIMPORTANT CONTEXT: You are communicating directly with ${realPersonName} (User ID: ${senderUserId}). Always address ${realPersonName} by name when appropriate and distinguish them from other group members.`
        const contextualMessage = `[Message from Telegram User "${realPersonName}" (User ID: ${senderUserId}, Handle: ${senderHandle}) in ${isChannel ? `Group/Channel "${msg.chat?.title || 'Chat'}"` : 'Direct Message'}]: "${messageText}"`

        aiReplyText = await generateAIResponse(contextualMessage, 'Telegram', prompt, conversationHistory)

        if (aiReplyText) {
          const messagePayload: any = {
            chat_id: !isNaN(Number(chatId)) ? Number(chatId) : String(chatId),
            text: aiReplyText
          }
          if (!isChannel && messageId) {
            messagePayload.reply_to_message_id = messageId
          }

          // Dispatch immediately to Telegram
          const tgAiRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messagePayload)
          })
          const tgAiJson = await tgAiRes.json()
          if (tgAiJson.ok && tgAiJson.result?.message_id) {
            sentTelegramMessageId = String(tgAiJson.result.message_id)
          }

          if (!tgAiJson.ok) {
            delete messagePayload.reply_to_message_id
            messagePayload.chat_id = String(chatId)
            const retryRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(messagePayload)
            })
            const retryJson = await retryRes.json()
            if (retryJson.ok && retryJson.result?.message_id) {
              sentTelegramMessageId = String(retryJson.result.message_id)
            }
          }
        }
      } catch (errAi) {
        console.error('[Telegram Webhook] Fast AI reply failed:', errAi)
      }
    }

    // 2. Perform Inbox logging in non-blocking background task so response is instant
    if (aiSettings.logToInbox !== false) {
      (async () => {
        try {
          await logMessage(userId, {
            pageId: String(chatId),
            senderId: isChannel ? `tg:channel:${chatId}` : `tg:dm:${chatId}`,
            message: messageText,
            response: aiReplyText,
            needsReview: false,
            timestamp: messageTimestamp,
            platform: 'Telegram',
            messageType: isChannel ? 'channel' : 'dm',
            senderName: realPersonName,
            senderHandle,
            postCaption: msg.chat?.title || 'Telegram Channel / Chat',
            mediaUrl,
            mediaType,
            mediaName
          } as any)

          await addSimulatedConversationToInbox(userId, {
            platform: 'Telegram',
            isComment: isChannel,
            customerText: messageText,
            aiReply: aiReplyText || (mediaUrl ? '[Photo / Media Received]' : 'Message received.'),
            senderName: realPersonName,
            senderHandle,
            chatId: String(chatId),
            messageId: sentTelegramMessageId || String(messageId),
            mediaUrl,
            mediaType,
            mediaName
          })
          // Dynamically auto-register channel in social_connections profile_data if group/channel
          if (isChannel && msg.chat?.id) {
            try {
              const channelTitle = msg.chat.title || `Group ${msg.chat.id}`
              const channelId = String(msg.chat.id)
              const { data: currentConn } = await supabase
                .from('social_connections')
                .select('profile_data')
                .eq('user_id', userId)
                .eq('platform', 'telegram')
                .maybeSingle()

              if (currentConn) {
                const existingChannels: any[] = Array.isArray(currentConn.profile_data?.channels)
                  ? currentConn.profile_data.channels
                  : []
                if (!existingChannels.some(ch => String(ch.id) === channelId || String(ch.id) === `@${channelId}`)) {
                  existingChannels.push({ id: channelId, name: channelTitle })
                  await supabase
                    .from('social_connections')
                    .update({
                      profile_data: {
                        ...(currentConn.profile_data || {}),
                        channels: existingChannels
                      }
                    })
                    .eq('user_id', userId)
                    .eq('platform', 'telegram')
                }
              }
            } catch (eChan) {}
          }
        } catch (eLog) {
          console.error('[Telegram Webhook] Background logging error:', eLog)
        }
      })()
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Telegram Webhook Error]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
