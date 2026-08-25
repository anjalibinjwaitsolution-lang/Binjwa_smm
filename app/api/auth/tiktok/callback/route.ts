import { NextRequest, NextResponse } from 'next/server'
import { saveTikTokConnection } from '@/lib/db'
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

    const clientKey = process.env.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_ID || 'demo_tiktok_client_key'
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET || ''
    const isLocal = request.nextUrl.origin.includes('localhost')
    const origin = isLocal ? 'http://localhost:3000' : 'https://binjwa-ssm.vercel.app'
    const redirectUri = `${origin}/api/auth/tiktok/callback`

    if (!code) {
      return htmlResponse('No authorization code received from TikTok', false)
    }

    if (!clientKey || !clientSecret) {
      return htmlResponse('TikTok credentials (TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET) missing in environment variables', false)
    }

    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    })
    
    const data = await res.json()

    if (!res.ok || !data.access_token) {
      console.error('TikTok Token Exchange Error:', data)
      return htmlResponse(data.error_description || data.error || 'Failed to exchange token with TikTok API', false)
    }

    const accessToken = data.access_token
    const openId = String(data.open_id || '')

    let username = ''
    let avatar = '/placeholder.svg?height=64&width=64'

    try {
      const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const userJson = await userRes.json()
      console.log('[TikTok Callback] User Info API Response:', JSON.stringify(userJson))

      const uObj = userJson.data?.user || userJson.data
      if (uObj) {
        username = uObj.username || uObj.display_name || uObj.open_id || ''
        if (uObj.avatar_url) avatar = uObj.avatar_url
      }
    } catch (eU) {
      console.warn('Could not fetch TikTok user info:', eU)
    }

    if (!username || username === 'TikTok Creator') {
      username = openId ? `creator_${openId.slice(-6)}` : `tiktok_user_${Math.random().toString(36).substring(7)}`
    }

    const connection = {
      id: openId || `tk_${Date.now()}`,
      name: username,
      username: username.startsWith('@') ? username : `@${username.replace(/\s+/g, '').toLowerCase()}`,
      avatar: avatar,
      connectedAt: new Date().toISOString(),
      accessToken: accessToken
    }

    await saveTikTokConnection(targetUserId, connection)

    return htmlResponse('Success', true, connection)
  } catch (err: any) {
    return htmlResponse(err.message || 'Error connecting TikTok', false)
  }
}

function htmlResponse(message: string, success: boolean, profile?: any) {
  const payload = success
    ? { type: 'TIKTOK_AUTH_SUCCESS', profile }
    : { type: 'TIKTOK_AUTH_ERROR', error: message }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>TikTok Auth ${success ? 'Success' : 'Error'}</title></head>
      <body>
        <p>${success ? 'TikTok connected successfully! Closing window...' : 'Failed: ' + message}</p>
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
