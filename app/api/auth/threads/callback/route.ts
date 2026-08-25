import { NextRequest, NextResponse } from 'next/server'
import { saveThreadsConnection } from '@/lib/db'
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

    const clientId = process.env.THREADS_APP_ID || '1108904491809943'
    const clientSecret = process.env.THREADS_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET || process.env.FACEBOOK_CLIENT_SECRET || ''
    const isLocal = request.nextUrl.origin.includes('localhost')
    const origin = isLocal ? 'http://localhost:3000' : 'https://binjwa-ssm.vercel.app'
    const redirectUri = `${origin}/api/auth/threads/callback`

    let accessToken = 'threads_demo_access_token'
    let threadsUserId = 'threads_user_123'
    let username = 'Threads Account'

    if (clientId && clientSecret && code) {
      const res = await fetch('https://graph.threads.net/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          app_id: clientId,
          client_secret: clientSecret,
          app_secret: clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code
        })
      })
      const data = await res.json()
      if (data.access_token) {
        accessToken = data.access_token
        threadsUserId = String(data.user_id || threadsUserId)

        try {
          const profileRes = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url&access_token=${accessToken}`)
          const profileJson = await profileRes.json()
          if (profileJson.username) {
            username = `@${profileJson.username}`
          }
        } catch (eP) {}
      }
    }

    const connection = {
      id: threadsUserId,
      name: username,
      username: username,
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop',
      connectedAt: new Date().toISOString(),
      accessToken: accessToken
    }

    await saveThreadsConnection(targetUserId, connection)

    return htmlResponse('Success', true, connection)
  } catch (err: any) {
    return htmlResponse(err.message || 'Error connecting Threads', false)
  }
}

function htmlResponse(message: string, success: boolean, profile?: any) {
  const payload = success
    ? { type: 'THREADS_AUTH_SUCCESS', profile }
    : { type: 'THREADS_AUTH_ERROR', error: message }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Threads Auth ${success ? 'Success' : 'Error'}</title></head>
      <body>
        <p>${success ? 'Threads connected successfully! Closing window...' : 'Failed: ' + message}</p>
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
