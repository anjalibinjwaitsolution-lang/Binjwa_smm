import { NextRequest, NextResponse } from 'next/server'
import { saveSlackConnection } from '@/lib/db'
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

    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET
    const isLocal = request.nextUrl.origin.includes('localhost')
    const origin = isLocal ? 'http://localhost:3000' : 'https://binjwa-ssm.vercel.app'
    const redirectUri = `${origin}/api/auth/slack/callback`

    let accessToken = ''
    let teamName = 'Slack Workspace'
    let teamId = ''
    let channels: any[] = []

    if (clientId && clientSecret && code) {
      const res = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri
        })
      })
      const data = await res.json()
      if (data.ok) {
        accessToken = data.access_token || accessToken
        teamName = data.team?.name || teamName
        teamId = data.team?.id || teamId

        if (accessToken && !accessToken.startsWith('slack_demo')) {
          try {
            const chRes = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel', {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            const chJson = await chRes.json()
            if (chJson.ok && chJson.channels?.length > 0) {
              channels = chJson.channels.map((c: any) => ({
                id: c.id,
                name: `#${c.name}`
              }))
            }
          } catch (eCh) {}
        }
      }
    }

    const connection = {
      id: teamId,
      name: teamName,
      teamId: teamId,
      channels: channels,
      avatar: '/placeholder.svg?height=64&width=64',
      connectedAt: new Date().toISOString(),
      accessToken: accessToken
    }

    await saveSlackConnection(targetUserId, connection)

    return htmlResponse('Success', true, connection)
  } catch (err: any) {
    return htmlResponse(err.message || 'Error connecting Slack', false)
  }
}

function htmlResponse(message: string, success: boolean, profile?: any) {
  const payload = success
    ? { type: 'SLACK_AUTH_SUCCESS', profile }
    : { type: 'SLACK_AUTH_ERROR', error: message }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Slack Auth ${success ? 'Success' : 'Error'}</title></head>
      <body>
        <p>${success ? 'Slack connected successfully! Closing window...' : 'Failed: ' + message}</p>
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
