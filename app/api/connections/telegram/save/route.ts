import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { saveTelegramConnection } from '@/lib/db'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId: authId } = await auth()
    const headerUserId = req.headers.get("x-user-id")
    const userId = authId || headerUserId || 'default_user_id'

    const body = await req.json()
    const botToken = body.botToken || process.env.TELEGRAM_BOT_TOKEN || ''

    // 1. Verify Bot Token with Telegram getMe API
    const getMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
    if (!getMeRes.ok) {
      return NextResponse.json({ error: 'Invalid Telegram Bot Token' }, { status: 400 })
    }
    const getMeData = await getMeRes.json()
    if (!getMeData.ok || !getMeData.result) {
      return NextResponse.json({ error: 'Failed to verify bot details from Telegram' }, { status: 400 })
    }

    const botResult = getMeData.result
    const botId = String(botResult.id)
    const botName = botResult.first_name || 'Telegram Bot'
    const username = botResult.username || 'telegram_bot'
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(botName)}&background=0088cc&color=fff&size=150`

    // 2. Discover channels linked to this bot dynamically from getUpdates, message_logs & previous connections
    const discoveredChannelsMap = new Map<string, string>()

    // 2a. Preserve any existing channels & discoveredChats from all telegram connections in DB
    try {
      const { data: connRows } = await supabase
        .from('social_connections')
        .select('profile_data')
        .eq('platform', 'telegram')

      if (connRows) {
        connRows.forEach(row => {
          const pData = row.profile_data || {}
          const allChats = [
            ...(Array.isArray(pData.channels) ? pData.channels : []),
            ...(Array.isArray(pData.discoveredChats) ? pData.discoveredChats : [])
          ]
          allChats.forEach((ch: any) => {
            const chId = typeof ch === 'string' ? ch : ch.id
            const chName = typeof ch === 'string' ? `Channel (${ch})` : (ch.name || ch.title || `Channel ${chId}`)
            if (chId) discoveredChannelsMap.set(String(chId), chName)
          })
        })
      }
    } catch (eConn) {}

    // 2b. Discover channels dynamically from message_logs
    try {
      const { data: logs } = await supabase
        .from('message_logs')
        .select('page_id')
        .eq('platform', 'Telegram')
        .limit(300)

      if (logs) {
        logs.forEach(l => {
          if (l.page_id && l.page_id !== 'Telegram') {
            const cleanId = String(l.page_id).replace(/^(tg-channel-|tg-conv-|tg:channel:|tg:dm:|tg:)/i, '')
            if (cleanId && !discoveredChannelsMap.has(cleanId)) {
              discoveredChannelsMap.set(cleanId, `Telegram Chat (${cleanId})`)
            }
          }
        })
      }
    } catch (eLogs) {}

    // 2c. Discover active chats directly from Telegram getUpdates API
    try {
      const updatesRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=50`)
      if (updatesRes.ok) {
        const updatesJson = await updatesRes.json()
        if (updatesJson.ok && Array.isArray(updatesJson.result)) {
          updatesJson.result.forEach((up: any) => {
            const chat = up.message?.chat || up.channel_post?.chat || up.my_chat_member?.chat
            if (chat?.id) {
              const cId = String(chat.id)
              const cName = chat.title || (chat.username ? `@${chat.username}` : `Telegram Chat ${cId}`)
              discoveredChannelsMap.set(cId, cName)
            }
          })
        }
      }
    } catch (eGetUp) {}

    // 2d. Fetch details directly from Telegram getChat API if customChannelInput is provided
    const customChannelInput = body.customChannelInput
    if (customChannelInput && typeof customChannelInput === 'string') {
      const handles = customChannelInput.split(/[\s,]+/).map(h => h.trim()).filter(Boolean)
      for (const handle of handles) {
        try {
          const getChatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(handle)}`)
          if (getChatRes.ok) {
            const chatJson = await getChatRes.json()
            if (chatJson.ok && chatJson.result) {
              const cId = String(chatJson.result.id)
              const cName = chatJson.result.title || (chatJson.result.username ? `@${chatJson.result.username}` : `Telegram Chat ${cId}`)
              discoveredChannelsMap.set(cId, cName)
            }
          }
        } catch (eChat) {}
      }
    }

    // 2e. Live resolution of all discovered channels via getChat API
    for (const [cKey, currentName] of Array.from(discoveredChannelsMap.entries())) {
      try {
        const getChatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(cKey)}`)
        if (getChatRes.ok) {
          const chatJson = await getChatRes.json()
          if (chatJson.ok && chatJson.result) {
            const liveName = chatJson.result.title || (chatJson.result.username ? `@${chatJson.result.username}` : currentName)
            if (liveName) {
              discoveredChannelsMap.set(cKey, liveName)
            }
          }
        }
      } catch (eLive) {}
    }

    const { discoverOnly, selectedChannelIds } = body

    const allDiscoveredChannels = Array.from(discoveredChannelsMap.entries()).map(([id, name]) => ({
      id: id.startsWith('-') || id.startsWith('@') ? id : `@${id}`,
      name
    }))

    if (discoverOnly) {
      return NextResponse.json({
        success: true,
        botName,
        username: `@${username}`,
        fetchedChannels: allDiscoveredChannels
      })
    }

    const finalChannels = Array.isArray(selectedChannelIds) && selectedChannelIds.length > 0
      ? allDiscoveredChannels.filter(ch => selectedChannelIds.includes(ch.id) || selectedChannelIds.includes(ch.id.replace(/^@/, '')))
      : allDiscoveredChannels

    const connectionPayload = {
      id: botId,
      username: username.startsWith('@') ? username : `@${username}`,
      name: botName,
      botToken: botToken,
      channels: finalChannels.length > 0 ? finalChannels : allDiscoveredChannels,
      avatar: avatar,
      connectedAt: new Date().toISOString()
    }

    await saveTelegramConnection(userId, connectionPayload)

    // 3. Auto-set Webhook live on Telegram Bot API with all required update types
    const webhookUrl = `https://binjwa-ssm.vercel.app/api/webhooks/telegram`
    try {
      const setWhRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&allowed_updates=${encodeURIComponent(JSON.stringify(["message", "channel_post", "edited_message", "edited_channel_post", "message_reaction"]))}`)
      const setWhJson = await setWhRes.json()
      console.log(`[Telegram Save] Webhook set to ${webhookUrl}:`, setWhJson)
    } catch (eWh) {
      console.warn('[Telegram Save] Could not set webhook:', eWh)
    }

    return NextResponse.json({
      success: true,
      botName,
      username: `@${username}`,
      channels: finalChannels.length > 0 ? finalChannels : allDiscoveredChannels,
      connection: connectionPayload
    })
  } catch (error: any) {
    console.error('Telegram Connection Save Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
