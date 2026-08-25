import { NextRequest, NextResponse } from 'next/server'
import { savePinterestConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  const token = process.env.PINTEREST_ACCESS_TOKEN
  if (token && token.trim() !== '' && !token.startsWith('demo') && !token.startsWith('pinterest_demo')) {
    try {
      const { userId } = await auth()
      const targetUserId = userId || 'default_user_id'
      
      let username = '@pinterest_user'
      let name = 'Pinterest User'
      let avatar = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop'
      try {
        const domain = (token.startsWith('pina_') || token.startsWith('pino_'))
          ? 'https://api-sandbox.pinterest.com/v5'
          : 'https://api.pinterest.com/v5'
        const profileRes = await fetch(`${domain}/user_account/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const profileJson = await profileRes.json()
        if (profileJson.username) {
          username = `@${profileJson.username}`
          name = profileJson.business_name || profileJson.username
        }
        if (profileJson.profile_image) {
          avatar = profileJson.profile_image
        }
      } catch (e) {}

      const connection = {
        id: username.replace('@', ''),
        name: name,
        username: username,
        avatar: avatar,
        connectedAt: new Date().toISOString(),
        accessToken: token
      }

      await savePinterestConnection(targetUserId, connection)

      const payload = { type: 'PINTEREST_AUTH_SUCCESS', profile: connection }
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Pinterest Auth Success</title></head>
          <body>
            <p>Pinterest connected successfully! Closing window...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage(${JSON.stringify(payload)}, "*");
              }
              window.close();
            </script>
          </body>
        </html>
      `
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
    } catch (err) {}
  }

  const clientId = process.env.PINTEREST_APP_ID || process.env.PINTEREST_CLIENT_ID || '1596031'
  const origin = request.nextUrl.origin
  const redirectUri = `${origin}/api/auth/pinterest/callback`
  const state = Math.random().toString(36).substring(7)

  const pinterestAuthUrl = new URL('https://www.pinterest.com/oauth/')
  pinterestAuthUrl.searchParams.append('client_id', clientId)
  pinterestAuthUrl.searchParams.append('redirect_uri', redirectUri)
  pinterestAuthUrl.searchParams.append('response_type', 'code')
  pinterestAuthUrl.searchParams.append('scope', 'user_accounts:read,boards:read,boards:write,pins:read,pins:write')
  pinterestAuthUrl.searchParams.append('state', state)

  const response = NextResponse.redirect(pinterestAuthUrl)
  response.cookies.set('oauth_state_pinterest', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10
  })
  return response
}
