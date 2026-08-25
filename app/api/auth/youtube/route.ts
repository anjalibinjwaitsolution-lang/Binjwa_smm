import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  
  if (!clientId) {
    return NextResponse.json({ error: 'YouTube Client ID is missing' }, { status: 500 })
  }
  
  // Generate a random state string for CSRF protection
  const state = Math.random().toString(36).substring(7)
  
  const isLocal = request.nextUrl.origin.includes('localhost')
  const origin = isLocal ? 'http://localhost:3000' : 'https://binjwa-ssm.vercel.app'
  const redirectUri = `${origin}/api/auth/youtube/callback`
  const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly'
  
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  googleAuthUrl.searchParams.append('response_type', 'code')
  googleAuthUrl.searchParams.append('client_id', clientId)
  googleAuthUrl.searchParams.append('redirect_uri', redirectUri)
  googleAuthUrl.searchParams.append('state', state)
  googleAuthUrl.searchParams.append('scope', scope)
  googleAuthUrl.searchParams.append('access_type', 'offline')
  googleAuthUrl.searchParams.append('prompt', 'consent')

  const response = NextResponse.redirect(googleAuthUrl)
  
  // Set state in HttpOnly cookie to verify later
  response.cookies.set('oauth_state_yt', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  })

  return response
}
