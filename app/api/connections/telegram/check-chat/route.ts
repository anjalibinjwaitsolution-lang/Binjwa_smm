import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId: authId } = await auth()
    const headerUserId = req.headers.get("x-user-id")
    const userId = authId || headerUserId || 'default_user_id'

    const body = await req.json()
    const botToken = body.botToken || process.env.TELEGRAM_BOT_TOKEN || ''
    let chatInput = (body.chatInput || '').trim()

    if (!botToken) {
      return NextResponse.json({ error: 'Telegram Bot Token is required' }, { status: 400 })
    }
    if (!chatInput) {
      return NextResponse.json({ error: 'Please enter a valid channel username (e.g. @bhinwa_ward) or Group ID' }, { status: 400 })
    }

    // Ensure @ prefix for usernames if numeric ID isn't used
    if (!chatInput.startsWith('@') && !chatInput.startsWith('-') && isNaN(Number(chatInput))) {
      chatInput = `@${chatInput}`
    }

    // Call Telegram getChat API
    const getChatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(chatInput)}`)
    const chatJson = await getChatRes.json()

    if (!getChatRes.ok || !chatJson.ok || !chatJson.result) {
      // Check if title matches any channel in Supabase social_connections
      try {
        const { data: conns } = await supabase
          .from('social_connections')
          .select('profile_data')
          .eq('platform', 'telegram')

        if (conns) {
          const searchClean = chatInput.replace(/^@/, '').toLowerCase().trim()
          for (const row of conns) {
            const pData = row.profile_data || {}
            const allChats = [
              ...(Array.isArray(pData.channels) ? pData.channels : []),
              ...(Array.isArray(pData.discoveredChats) ? pData.discoveredChats : [])
            ]
            const match = allChats.find((ch: any) => {
              const cName = String(ch.name || ch.title || '').toLowerCase()
              const cId = String(ch.id || '').toLowerCase()
              return (cName && searchClean && (cName.includes(searchClean) || searchClean.includes(cName))) || (cId && cId.includes(searchClean))
            })
            if (match) {
              const cId = String(match.id)
              const formattedId = cId.startsWith('-') || cId.startsWith('@') ? cId : `@${cId}`
              return NextResponse.json({
                success: true,
                channel: {
                  id: formattedId,
                  name: match.name || match.title || cId,
                  type: cId.startsWith('-') ? 'group' : 'channel'
                }
              })
            }
          }
        }
      } catch (eDb) {}

      const tgError = chatJson.description || 'Chat not found'
      return NextResponse.json({
        error: `Could not fetch chat "${chatInput}" from Telegram: ${tgError}. Please make sure your bot is added to the channel/group as an admin or member.`
      }, { status: 400 })
    }

    const resObj = chatJson.result
    const cId = String(resObj.id)
    const formattedId = cId.startsWith('-') || cId.startsWith('@') ? cId : `@${cId}`
    const cName = resObj.title || (resObj.username ? `@${resObj.username}` : `Telegram Chat ${cId}`)

    return NextResponse.json({
      success: true,
      channel: {
        id: formattedId,
        name: cName,
        type: resObj.type || (cId.startsWith('-') ? 'group' : 'channel')
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
