import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.REDDIT_CLIENT_ID || process.env.REDDIT_APP_ID || ''
  const origin = request.nextUrl.origin
  const redirectUri = `${origin}/api/auth/reddit/callback`
  const state = Math.random().toString(36).substring(7)

  if (!clientId) {
    return new NextResponse('REDDIT_CLIENT_ID is missing from environment variables. Please add REDDIT_CLIENT_ID in Vercel.', { status: 400 })
  }

  const redditUrl = new URL('https://www.reddit.com/api/v1/authorize')
  redditUrl.searchParams.append('client_id', clientId)
  redditUrl.searchParams.append('response_type', 'code')
  redditUrl.searchParams.append('state', state)
  redditUrl.searchParams.append('redirect_uri', redirectUri)
  redditUrl.searchParams.append('duration', 'permanent')
  redditUrl.searchParams.append('scope', 'identity submit read mysubreddits history')

  const response = NextResponse.redirect(redditUrl)
  response.cookies.set('oauth_state_reddit', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10
  })
  return response
}
