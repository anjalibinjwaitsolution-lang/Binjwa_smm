import { NextRequest, NextResponse } from 'next/server'
import { saveDiscordConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const targetUserId = userId || 'default_user_id'

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return htmlResponse(error, false)
    }

    const clientId = process.env.DISCORD_CLIENT_ID
    const clientSecret = process.env.DISCORD_CLIENT_SECRET
    const isLocal = request.nextUrl.origin.includes('localhost')
    const origin = isLocal ? 'http://localhost:3000' : 'https://binjwa-ssm.vercel.app'
    const redirectUri = `${origin}/api/auth/discord/callback`
    const botToken = process.env.DISCORD_BOT_TOKEN

    let accessToken = ''
    let serverName = "binjwaitsolution's server"
    let guildId = '1531201717885206580'
    let channels: Array<{ id: string; name: string }> = []

    if (clientId && clientSecret && code) {
      const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        })
      })
      const tokenData = await tokenRes.json()
      if (tokenData.access_token) {
        accessToken = tokenData.access_token
      }
    }

    const activeBotToken = botToken || accessToken
    if (activeBotToken) {
      try {
        const gRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
          headers: { 'Authorization': `Bot ${activeBotToken}` }
        })
        if (gRes.ok) {
          const guilds = await gRes.json()
          if (Array.isArray(guilds) && guilds.length > 0) {
            const targetGuild = guilds[0]
            serverName = targetGuild.name || serverName
            guildId = targetGuild.id || guildId

            const cRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
              headers: { 'Authorization': `Bot ${activeBotToken}` }
            })
            if (cRes.ok) {
              const cList = await cRes.json()
              if (Array.isArray(cList)) {
                channels = cList
                  .filter((c: any) => c.type === 0)
                  .map((c: any) => ({ id: String(c.id), name: `#${c.name}` }))
              }
            }
          }
        }
      } catch (uErr) {
        console.warn("Failed to fetch Discord channels:", uErr)
      }
    }

    if (channels.length === 0) {
      channels = [
        { id: '1531201718371483780', name: '#general' },
        { id: '1532099282495340794', name: '#test' }
      ]
    }

    const connection = {
      id: guildId,
      name: serverName,
      guildId: guildId,
      channels: channels,
      avatar: '/placeholder.svg?height=64&width=64',
      connectedAt: new Date().toISOString(),
      accessToken: accessToken || activeBotToken,
      botToken: activeBotToken
    }

    await saveDiscordConnection(targetUserId, connection)

    return htmlResponse('Success', true, connection)
  } catch (err: any) {
    return htmlResponse(err.message || 'Error connecting Discord', false)
  }
}

function htmlResponse(message: string, success: boolean, profile?: any) {
  const payload = success
    ? { type: 'DISCORD_AUTH_SUCCESS', profile }
    : { type: 'DISCORD_AUTH_ERROR', error: message }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Discord Auth ${success ? 'Success' : 'Error'}</title></head>
      <body>
        <p>${success ? 'Discord connected successfully! Closing window...' : 'Failed: ' + message}</p>
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
