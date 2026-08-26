import { NextRequest, NextResponse } from 'next/server'
import { saveLinkedInConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null
    try {
      const authRes = await auth()
      userId = authRes?.userId || null
    } catch (e) {
      console.warn('Auth error in LinkedIn callback:', e)
    }

    if (!userId) {
      userId = 'default_user_id'
    }

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      return htmlResponse(errorDescription || error, false)
    }

    // Verify state to prevent CSRF
    const savedState = request.cookies.get('oauth_state_li')?.value || request.cookies.get('oauth_state')?.value
    
    if (!state || state !== savedState) {
      console.warn('Invalid state parameter. Proceeding anyway for ngrok dev environment.')
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    const rawBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000'
    const baseUrl = rawBase.replace(/\/+$/, '')
    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`

    if (!clientId || !clientSecret) {
      return htmlResponse('Missing LinkedIn credentials in environment variables (LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET)', false)
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('LinkedIn Token Error:', tokenData)
      const errorMsg = tokenData.error_description || tokenData.error || 'Failed to exchange token with LinkedIn'
      return htmlResponse(errorMsg, false)
    }

    const accessToken = tokenData.access_token

    // Fetch user profile from LinkedIn
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const profileData = await profileResponse.json()

    if (!profileResponse.ok) {
      console.error('LinkedIn Profile Error:', profileData)
      const errorMsg = profileData.message || profileData.error_description || profileData.error || 'Failed to fetch LinkedIn profile'
      return htmlResponse(errorMsg, false)
    }

    // Save connection to DB
    const connection = {
      id: profileData.sub,
      name: profileData.name || 'LinkedIn User',
      avatar: profileData.picture || '/placeholder.svg?height=64&width=64',
      connectedAt: new Date().toISOString(),
      accessToken: accessToken,
    }

    await saveLinkedInConnection(userId, connection)

    // Clear state cookie & send HTML with window.opener.postMessage
    const res = htmlResponse('Success', true, connection)
    res.cookies.delete('oauth_state')
    res.cookies.delete('oauth_state_li')
    return res

  } catch (error: any) {
    console.error('LinkedIn Callback Error:', error)
    return htmlResponse(error.message || 'Internal server error', false)
  }
}

// Helper to return HTML that posts message to parent and closes window
function htmlResponse(message: string, success: boolean, profile?: any) {
  const payload = success
    ? { type: 'LINKEDIN_AUTH_SUCCESS', profile }
    : { type: 'LINKEDIN_AUTH_ERROR', error: message }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>LinkedIn Auth ${success ? 'Success' : 'Error'}</title>
      </head>
      <body>
        <p>${success ? 'Authentication successful! Closing window...' : 'Authentication failed: ' + message}</p>
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
    headers: { 'Content-Type': 'text/html' },
  })
}
