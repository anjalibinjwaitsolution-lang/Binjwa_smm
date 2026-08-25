import { NextRequest, NextResponse } from 'next/server'
import { savePinterestConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const targetUserId = userId || 'default_user_id'

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      return htmlResponse(errorDescription || error || 'Authorization rejected by user or Pinterest', false)
    }

    if (!code) {
      return htmlResponse('Authorization code missing from Pinterest callback URL', false)
    }

    const clientId = process.env.PINTEREST_APP_ID || process.env.PINTEREST_CLIENT_ID || '1596031'
    const clientSecret = process.env.PINTEREST_APP_SECRET || process.env.PINTEREST_CLIENT_SECRET || ''

    if (!clientSecret) {
      return htmlResponse('PINTEREST_APP_SECRET is missing from environment variables. Please add PINTEREST_APP_SECRET in Vercel settings.', false)
    }

    const origin = request.nextUrl.origin
    const redirectUri = `${origin}/api/auth/pinterest/callback`

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const res = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    })
    const data = await res.json()

    if (!res.ok || !data.access_token) {
      const errMsg = data.message || data.error_description || data.error || `Pinterest token exchange failed (${res.status})`
      return htmlResponse(errMsg, false)
    }

    const accessToken = data.access_token
    let username = 'Pinterest Account'
    let pinterestUserId = 'pinterest_user'
    let avatar = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop'

    try {
      const domain = (accessToken.startsWith('pina_') || accessToken.startsWith('pino_'))
        ? 'https://api-sandbox.pinterest.com/v5'
        : 'https://api.pinterest.com/v5'
      const profileRes = await fetch(`${domain}/user_account/profile`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const profileJson = await profileRes.json()
      if (profileJson.username) {
        username = `@${profileJson.username}`
        pinterestUserId = profileJson.username
      }
      if (profileJson.business_name) {
        username = profileJson.business_name
      }
      if (profileJson.profile_image) {
        avatar = profileJson.profile_image
      }
    } catch (eP) {
      console.warn("Failed to fetch Pinterest profile:", eP)
    }

    const connection = {
      id: pinterestUserId,
      name: username,
      username: username,
      avatar: avatar,
      connectedAt: new Date().toISOString(),
      accessToken: accessToken
    }

    await savePinterestConnection(targetUserId, connection)

    return htmlResponse('Success', true, connection)
  } catch (err: any) {
    return htmlResponse(err.message || 'Error connecting Pinterest', false)
  }
}

function htmlResponse(message: string, success: boolean, profile?: any) {
  const payload = success
    ? { type: 'PINTEREST_AUTH_SUCCESS', profile }
    : { type: 'PINTEREST_AUTH_ERROR', error: message }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Pinterest Auth ${success ? 'Success' : 'Error'}</title></head>
      <body>
        <p style="font-family: sans-serif; padding: 20px;">
          ${success ? 'Pinterest connected successfully! Closing window...' : 'Authentication Failed: ' + message}
        </p>
        <script>
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(payload)}, "*");
          }
          setTimeout(function() {
            window.close();
          }, ${success ? 1000 : 4000});
        </script>
      </body>
    </html>
  `
  return new NextResponse(html, {
    status: success ? 200 : 400,
    headers: { 'Content-Type': 'text/html' }
  })
}
