import { NextRequest, NextResponse } from 'next/server'
import { saveTelegramConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const targetUserId = userId || 'default_user_id'

    const botToken = process.env.TELEGRAM_BOT_TOKEN || ''

    let botId = ''
    let botName = 'Telegram Bot'
    let username = 'binjwa_bot'
    let avatar = '/placeholder.svg?height=64&width=64'
    let channels: any[] = []

    // Fetch Bot Details from Telegram Bot API getMe
    try {
      const getMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
      if (getMeRes.ok) {
        const getMeJson = await getMeRes.json()
        if (getMeJson.ok && getMeJson.result) {
          botId = String(getMeJson.result.id)
          botName = getMeJson.result.first_name || botName
          username = getMeJson.result.username || username
        }
      }
    } catch (eMe) {
      console.warn('Could not fetch Telegram getMe details:', eMe)
    }

    // Try fetching Bot updates to discover added channels/chats
    try {
      const updatesRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`)
      if (updatesRes.ok) {
        const updatesJson = await updatesRes.json()
        if (updatesJson.ok && Array.isArray(updatesJson.result)) {
          const discoveredChannels = new Map<string, string>()
          updatesJson.result.forEach((item: any) => {
            const chat = item.channel_post?.chat || item.message?.chat || item.my_chat_member?.chat
            if (chat && (chat.type === 'channel' || chat.type === 'supergroup' || chat.type === 'group')) {
              const cid = chat.username ? `@${chat.username}` : String(chat.id)
              const cname = chat.title || chat.username || `Chat ${chat.id}`
              discoveredChannels.set(cid, cname)
            }
          })

          channels = Array.from(discoveredChannels.entries()).map(([id, name]) => ({ id, name }))
        }
      }
    } catch (eUp) {
      console.warn('Could not fetch Telegram updates:', eUp)
    }

    const connection = {
      id: botId,
      username: username.startsWith('@') ? username : `@${username}`,
      name: botName,
      botToken: botToken,
      channels: channels,
      avatar: avatar,
      connectedAt: new Date().toISOString()
    }

    await saveTelegramConnection(targetUserId, connection)

    // Auto-register Telegram webhook for incoming DMs & messages
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
      const webhookUrl = `${appUrl}/api/webhooks/telegram`
      await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`)
      console.log(`[Telegram Auth] Webhook set to ${webhookUrl}`)
    } catch (eWh) {
      console.warn('Could not auto-register Telegram webhook:', eWh)
    }

    return htmlResponse('Success', true, connection)
  } catch (err: any) {
    return htmlResponse(err.message || 'Error connecting Telegram', false)
  }
}

function htmlResponse(message: string, success: boolean, profile?: any) {
  const payload = success
    ? { type: 'TELEGRAM_AUTH_SUCCESS', profile }
    : { type: 'TELEGRAM_AUTH_ERROR', error: message }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Telegram Auth ${success ? 'Success' : 'Error'}</title></head>
      <body>
        <p>${success ? 'Telegram connected successfully! Closing window...' : 'Failed: ' + message}</p>
        <script>
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(payload)}, "*");
          }
          window.close();
        </script>
      </body>
    </html>
  `
  return new NextResponse(html, {
    status: success ? 200 : 400,
    headers: { 'Content-Type': 'text/html' }
  })
}
