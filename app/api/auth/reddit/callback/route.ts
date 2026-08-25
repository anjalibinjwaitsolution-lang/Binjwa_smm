import { NextRequest, NextResponse } from 'next/server'
import { saveRedditConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const targetUserId = userId || 'default_user_id'

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return htmlResponse(`Reddit Authorization Failed: ${error}`, false)
    }

    if (!code) {
      return htmlResponse('Authorization code missing from Reddit callback URL', false)
    }

    const clientId = (process.env.REDDIT_CLIENT_ID || process.env.REDDIT_APP_ID || '').trim().replace(/^["']|["']$/g, '')
    const clientSecret = (process.env.REDDIT_CLIENT_SECRET || process.env.REDDIT_APP_SECRET || '').trim().replace(/^["']|["']$/g, '')

    if (!clientId || !clientSecret) {
      return htmlResponse('REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET is missing from environment variables. Please configure them in Vercel.', false)
    }

    const origin = request.nextUrl.origin
    const redirectUri = `${origin}/api/auth/reddit/callback`

    const userAgentStr = 'web:com.binjwa-ssm.app:v1.0.0 (by /u/binjwa_official)'
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    let tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgentStr
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    })

    let tokenJson: any = {}
    try {
      tokenJson = await tokenRes.json()
    } catch (eJ) {
      const txt = await tokenRes.text().catch(() => '')
      tokenJson = { error: tokenRes.statusText || 'Response parse error', raw: txt }
    }

    // Fallback attempt: Pass credentials in body if Basic Auth returned 403 / 401
    if ((!tokenRes.ok || !tokenJson.access_token) && (tokenRes.status === 403 || tokenRes.status === 401)) {
      tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': userAgentStr
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        })
      })
      try {
        tokenJson = await tokenRes.json()
      } catch (eJ2) {}
    }

    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error("Reddit Token Exchange Error:", tokenRes.status, tokenJson)
      let errMsg = tokenJson.message || tokenJson.error_description || tokenJson.error || `Reddit token exchange failed (${tokenRes.status})`
      if (tokenRes.status === 403) {
        errMsg = `403 Forbidden — Check Vercel Env: REDDIT_CLIENT_ID & REDDIT_CLIENT_SECRET must match Reddit App. Redirect URI in Reddit must be exactly ${redirectUri}`
      }
      return htmlResponse(errMsg, false)
    }

    const accessToken = tokenJson.access_token
    let username = 'Reddit Account'
    let displayName = 'Reddit User'
    let avatar = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop'
    let subreddits: any[] = []

    try {
      const userRes = await fetch('https://oauth.reddit.com/api/v1/me', {
        headers: {
          'Authorization': `bearer ${accessToken}`,
          'User-Agent': 'web:binjwa-ssm:v1.0.0 (by /u/binjwa_official)'
        }
      })
      const userJson = await userRes.json()
      if (userJson.name) {
        username = `u/${userJson.name}`
        displayName = userJson.subreddit?.title || userJson.name
        if (userJson.icon_img) {
          avatar = userJson.icon_img.split('?')[0]
        }
      }
    } catch (eMe) {
      console.warn("Failed to fetch Reddit profile:", eMe)
    }

    try {
      const subsRes = await fetch('https://oauth.reddit.com/subreddits/mine/subscriber?limit=25', {
        headers: {
          'Authorization': `bearer ${accessToken}`,
          'User-Agent': 'web:binjwa-ssm:v1.0.0 (by /u/binjwa_official)'
        }
      })
      const subsJson = await subsRes.json()
      if (subsJson.data?.children && Array.isArray(subsJson.data.children)) {
        subreddits = subsJson.data.children.map((item: any) => ({
          id: item.data.display_name_prefixed,
          name: item.data.display_name_prefixed
        }))
      }
    } catch (eSub) {
      console.warn("Failed to fetch user subreddits:", eSub)
    }

    const connection = {
      id: username,
      username: username,
      name: displayName,
      subreddits: subreddits,
      avatar: avatar,
      connectedAt: new Date().toISOString(),
      accessToken: accessToken
    }

    await saveRedditConnection(targetUserId, connection)

    return htmlResponse('Success', true, connection)
  } catch (err: any) {
    return htmlResponse(err.message || 'Error connecting Reddit', false)
  }
}

function htmlResponse(message: string, success: boolean, profile?: any) {
  const payload = success
    ? { type: 'REDDIT_AUTH_SUCCESS', profile }
    : { type: 'REDDIT_AUTH_ERROR', error: message }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Reddit Auth ${success ? 'Success' : 'Error'}</title></head>
      <body>
        <p style="font-family: sans-serif; padding: 20px;">
          ${success ? 'Reddit connected successfully! Closing window...' : 'Authentication Failed: ' + message}
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
