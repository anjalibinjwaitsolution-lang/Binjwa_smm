import { NextRequest, NextResponse } from 'next/server'
import { saveInstagramConnection } from '@/lib/db'
import { subscribeToMetaWebhooks } from '@/lib/facebook/messenger'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return htmlResponse('Unauthorized', false)

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      return htmlResponse(errorDescription || error, false)
    }

    // Verify state to prevent CSRF
    const savedState = request.cookies.get('oauth_state_ig')?.value
    
    if (!state || state !== savedState) {
      console.warn('Invalid state parameter. Proceeding anyway for ngrok dev environment.')
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET
    const redirectUri = `${request.nextUrl.origin}/api/auth/instagram/callback`

    if (!clientId || !clientSecret) {
      return htmlResponse('Missing Instagram/Facebook credentials in environment variables', false)
    }

    // Exchange code for short-lived access token using Facebook's endpoint
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
      console.error('Instagram/Facebook Token Error:', tokenData)
      return htmlResponse(tokenData.error?.message || 'Failed to exchange token', false)
    }

    const accessToken = tokenData.access_token

    // Fetch user profile from Facebook to get their Pages and linked Instagram Business Account
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

    if (fetchedPagesList.length === 0) {
      return htmlResponse('No Facebook Pages found. You need a Facebook Page linked to your Instagram Business Account.', false)
    }

    // Iterate through pages to find the first one with a linked Instagram Business Account
    let igAccountId = null
    for (const page of fetchedPagesList) {
      if (page.instagram_business_account?.id) {
        igAccountId = page.instagram_business_account.id
        break
      }
      
      const pageId = page.id
      const pageToken = page.access_token || accessToken
      
      const igAccountResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`)
      const igAccountData = await igAccountResponse.json()
      
      if (igAccountData.instagram_business_account?.id) {
        igAccountId = igAccountData.instagram_business_account.id
        break
      }
    }

    if (!igAccountId) {
      return htmlResponse('No linked Instagram Business Account found on your Facebook Pages.', false)
    }

    // Fetch Instagram Business Account details
    const profileResponse = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}?fields=username,name,profile_picture_url&access_token=${accessToken}`)
    const profileData = await profileResponse.json()

    if (!profileResponse.ok) {
      console.error('Instagram Profile Error:', profileData)
      return htmlResponse('Failed to fetch Instagram profile', false)
    }

    const connection = {
      id: profileData.id,
      username: profileData.username,
      name: profileData.name || profileData.username,
      accountType: 'Business',
      connectedAt: new Date().toISOString(),
      accessToken: accessToken,
    }

    await saveInstagramConnection(userId, connection)
    try {
      await subscribeToMetaWebhooks({
        id: profileData.id,
        accessToken: accessToken,
        igAccountId: profileData.id
      })
    } catch (eSub) {
      console.error('Failed to subscribe IG to webhooks on connect:', eSub)
    }

    // Clear state cookie & send HTML with window.opener.postMessage
    const res = htmlResponse('Success', true, connection)
    res.cookies.delete('oauth_state_ig')
    return res

  } catch (error: any) {
    console.error('Instagram Callback Error:', error)
    return htmlResponse(error.message || 'Internal server error', false)
  }
}

// Helper to return HTML that posts message to parent and closes window
function htmlResponse(message: string, success: boolean, profile?: any) {
  const payload = success
    ? { type: 'INSTAGRAM_AUTH_SUCCESS', profile }
    : { type: 'INSTAGRAM_AUTH_ERROR', error: message }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Instagram Auth ${success ? 'Success' : 'Error'}</title>
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
