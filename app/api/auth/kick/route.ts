import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.KICK_CLIENT_ID || 'demo_kick_client_id'
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/kick/callback`
  const state = Math.random().toString(36).substring(7)

  const kickUrl = new URL('https://id.kick.com/oauth/authorize')
  kickUrl.searchParams.append('client_id', clientId)
  kickUrl.searchParams.append('redirect_uri', redirectUri)
  kickUrl.searchParams.append('response_type', 'code')
  kickUrl.searchParams.append('scope', 'user:read channel:write')
  kickUrl.searchParams.append('state', state)

  const response = NextResponse.redirect(kickUrl)
  response.cookies.set('oauth_state_kick', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10
  })
  return response
}
