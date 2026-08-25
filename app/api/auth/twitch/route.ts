import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.TWITCH_CLIENT_ID || 'demo_twitch_client_id'
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/twitch/callback`
  const state = Math.random().toString(36).substring(7)

  const twitchUrl = new URL('https://id.twitch.tv/oauth2/authorize')
  twitchUrl.searchParams.append('client_id', clientId)
  twitchUrl.searchParams.append('redirect_uri', redirectUri)
  twitchUrl.searchParams.append('response_type', 'code')
  twitchUrl.searchParams.append('scope', 'channel:manage:broadcast user:read:email')
  twitchUrl.searchParams.append('state', state)

  const response = NextResponse.redirect(twitchUrl)
  response.cookies.set('oauth_state_twitch', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10
  })
  return response
}
