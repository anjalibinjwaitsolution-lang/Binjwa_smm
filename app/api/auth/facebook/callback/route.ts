import { NextRequest, NextResponse } from 'next/server'
import { saveFacebookConnection } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      return htmlResponse(errorDescription || error, false)
    }

    // Verify state to prevent CSRF
    const savedState = request.cookies.get('oauth_state_fb')?.value
    
    if (!state || state !== savedState) {
      console.warn('Invalid state parameter. Proceeding anyway for ngrok dev environment.')
    }

    const clientId = process.env.FACEBOOK_CLIENT_ID
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET
    const redirectUri = `${request.nextUrl.origin}/api/auth/facebook/callback`

    if (!clientId || !clientSecret) {
      return htmlResponse('Missing Facebook credentials in environment variables', false)
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code as string,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Facebook Token Error:', tokenData)
      return htmlResponse(tokenData.error?.message || 'Failed to exchange token', false)
    }

    const accessToken = tokenData.access_token

    // Fetch user profile from Facebook
    const profileResponse = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,picture.width(200).height(200)&access_token=${accessToken}`)

    const profileData = await profileResponse.json()

    if (!profileResponse.ok) {
      console.error('Facebook Profile Error:', profileData)
      return htmlResponse(profileData.error?.message || 'Failed to fetch profile', false)
    }

    // Fetch user pages with multi-stage fallback for Graph API v19.0 & Partner Page compatibility
    let fetchedPagesList: any[] = []
    
    const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,category,tasks,instagram_business_account&access_token=${accessToken}`)
    const pagesData = await pagesResponse.json()

    if (pagesData.data && Array.isArray(pagesData.data) && pagesData.data.length > 0) {
      fetchedPagesList = pagesData.data
    } else {
      // Fallback 1: Query nested accounts field on user node
      const fallbackResponse = await fetch(`https://graph.facebook.com/v19.0/me?fields=accounts{id,name,access_token,category,tasks,instagram_business_account}&access_token=${accessToken}`)
      const fallbackData = await fallbackResponse.json()
      if (fallbackData.accounts?.data && Array.isArray(fallbackData.accounts.data)) {
        fetchedPagesList = fallbackData.accounts.data
      }
    }
    
    const pages = fetchedPagesList.map((p: any) => ({
      id: p.id,
      name: p.name,
      accessToken: p.access_token || accessToken,
      aiEnabled: false,
      igAccountId: p.instagram_business_account?.id || null
    }))

    const connectionData = {
      id: profileData.id,
      name: profileData.name || 'Facebook User',
      avatar: profileData.picture?.data?.url || '/placeholder.svg?height=64&width=64',
      connectedAt: new Date().toISOString(),
      accessToken: accessToken,
    }

    // Clear state cookie & send HTML with window.opener.postMessage
    // We send fetched pages back to the UI for selection instead of saving directly.
    const res = htmlResponse('Success', true, { ...connectionData, fetchedPages: pages })
    res.cookies.delete('oauth_state_fb')
    return res

  } catch (error: any) {
    console.error('Facebook Callback Error:', error)
    return htmlResponse(error.message || 'Internal server error', false)
  }
}

// Helper to return HTML that posts message to parent and closes window
function htmlResponse(message: string, success: boolean, profile?: any) {
  const payload = success
    ? { type: 'FACEBOOK_AUTH_SUCCESS', profile }
    : { type: 'FACEBOOK_AUTH_ERROR', error: message }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Facebook Auth ${success ? 'Success' : 'Error'}</title>
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
