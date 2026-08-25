import { NextRequest, NextResponse } from 'next/server'
import { getYouTubeConnections, saveYouTubeConnections, YouTubeChannel } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new NextResponse(
      `<script>window.opener.postMessage({ type: 'YOUTUBE_AUTH_ERROR', error: 'Unauthorized' }, '*'); window.close();</script>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  // Verify state
  const savedState = request.cookies.get('oauth_state_yt')?.value
  
  if (!state || state !== savedState) {
    return new NextResponse(
      `<script>window.opener.postMessage({ type: 'YOUTUBE_AUTH_ERROR', error: 'State mismatch or missing' }, '*'); window.close();</script>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (error) {
    return new NextResponse(
      `<script>window.opener.postMessage({ type: 'YOUTUBE_AUTH_ERROR', error: '${error}' }, '*'); window.close();</script>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (!code) {
    return new NextResponse(
      `<script>window.opener.postMessage({ type: 'YOUTUBE_AUTH_ERROR', error: 'No code provided' }, '*'); window.close();</script>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  try {
    const clientId = process.env.YOUTUBE_CLIENT_ID
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
    const isLocal = request.nextUrl.origin.includes('localhost')
    const origin = isLocal ? 'http://localhost:3000' : 'https://binjwa-ssm.vercel.app'
    const redirectUri = `${origin}/api/auth/youtube/callback`

    if (!clientId || !clientSecret) {
      return new NextResponse(
        `<script>window.opener.postMessage({ type: 'YOUTUBE_AUTH_ERROR', error: 'Missing YouTube credentials in environment variables' }, '*'); window.close();</script>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code as string,
        grant_type: 'authorization_code'
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('YouTube Token Error:', tokenData)
      return new NextResponse(
        `<script>window.opener.postMessage({ type: 'YOUTUBE_AUTH_ERROR', error: '${tokenData.error_description || 'Failed to exchange token'}' }, '*'); window.close();</script>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    const accessToken = tokenData.access_token

    // Fetch user profile from YouTube Data API
    const profileResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    })

    const profileData = await profileResponse.json()

    if (!profileResponse.ok || !profileData.items || profileData.items.length === 0) {
      console.error('YouTube Profile Error:', profileData)
      return new NextResponse(
        `<script>window.opener.postMessage({ type: 'YOUTUBE_AUTH_ERROR', error: 'Failed to fetch YouTube channel or no channel found' }, '*'); window.close();</script>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    const channel = profileData.items[0]
    
    const profile: YouTubeChannel = {
      id: channel.id,
      name: channel.snippet.title,
      handle: channel.snippet.customUrl || channel.snippet.title,
      avatar: channel.snippet.thumbnails?.default?.url || '/placeholder.svg?height=64&width=64',
      connectedAt: new Date().toISOString(),
      accessToken: accessToken
    }

    // Save to local db array
    const existing = await getYouTubeConnections(userId) || []
    // Remove if already exists, then add updated
    const updatedConnections = [...existing.filter((c: any) => c.id !== profile.id), profile]
    await saveYouTubeConnections(userId, updatedConnections)

    // Send success message to parent window and close popup
    const res = new NextResponse(
      `<script>
        window.opener.postMessage({ 
          type: 'YOUTUBE_AUTH_SUCCESS', 
          profile: ${JSON.stringify(profile)}
        }, '*'); 
        window.close();
      </script>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
    
    // Clear state cookie
    res.cookies.delete('oauth_state_yt')
    return res

  } catch (err: any) {
    console.error('YouTube auth error:', err)
    return new NextResponse(
      `<script>window.opener.postMessage({ type: 'YOUTUBE_AUTH_ERROR', error: 'Internal server error during authentication' }, '*'); window.close();</script>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}
