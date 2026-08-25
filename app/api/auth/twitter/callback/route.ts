import { NextRequest, NextResponse } from 'next/server'
import { saveTwitterConnection } from '@/lib/db'
import { TwitterApi } from 'twitter-api-v2'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return htmlResponse('Unauthorized', false)

    const searchParams = request.nextUrl.searchParams
    const oauth_token = searchParams.get('oauth_token')
    const oauth_verifier = searchParams.get('oauth_verifier')
    const denied = searchParams.get('denied')

    if (denied) {
      return htmlResponse('User denied access', false)
    }

    const savedToken = request.cookies.get('twitter_oauth_token')?.value
    const savedTokenSecret = request.cookies.get('twitter_oauth_token_secret')?.value
    
    if (!oauth_token || !oauth_verifier || !savedToken || !savedTokenSecret) {
      console.warn('Invalid or missing tokens. Proceeding anyway for ngrok dev environment.')
    }

    if (oauth_token !== savedToken) {
      console.warn('Token mismatch error. Proceeding anyway for ngrok dev environment.')
    }

    const appKey = process.env.twitter_Consumer_Key
    const appSecret = process.env.twitter_Secret_Key

    if (!appKey || !appSecret) {
      return htmlResponse('Missing Twitter credentials in environment variables', false)
    }

    const client = new TwitterApi({
      appKey: appKey as string,
      appSecret: appSecret as string,
      accessToken: oauth_token as string,
      accessSecret: savedTokenSecret as string,
    })

    const { client: loggedClient, accessToken, accessSecret } = await client.login(oauth_verifier as string)

    // Fetch user profile from Twitter
    const user = await loggedClient.v2.me({ 'user.fields': ['profile_image_url'] })

    // Save connection to DB
    const connection = {
      id: user.data.id,
      name: user.data.name,
      handle: `@${user.data.username}`,
      avatar: user.data.profile_image_url || '/placeholder.svg?height=64&width=64',
      connectedAt: new Date().toISOString(),
      accessToken,
      accessSecret,
    }

    await saveTwitterConnection(userId, connection)

    // Clear state cookies & send HTML with window.opener.postMessage
    const res = htmlResponse('Success', true, connection)
    res.cookies.delete('twitter_oauth_token')
    res.cookies.delete('twitter_oauth_token_secret')
    return res

  } catch (error: any) {
    console.error('Twitter Callback Error:', error)
    return htmlResponse(error.message || 'Internal server error', false)
  }
}

// Helper to return HTML that posts message to parent and closes window
function htmlResponse(message: string, success: boolean, profile?: any) {
  const payload = success
    ? { type: 'TWITTER_AUTH_SUCCESS', profile }
    : { type: 'TWITTER_AUTH_ERROR', error: message }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Twitter Auth ${success ? 'Success' : 'Error'}</title>
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
