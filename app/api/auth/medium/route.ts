import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.MEDIUM_CLIENT_ID || 'demo_medium_client_id'
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/medium/callback`
  const state = Math.random().toString(36).substring(7)

  const mediumUrl = new URL('https://medium.com/m/oauth/authorize')
  mediumUrl.searchParams.append('client_id', clientId)
  mediumUrl.searchParams.append('redirect_uri', redirectUri)
  mediumUrl.searchParams.append('response_type', 'code')
  mediumUrl.searchParams.append('scope', 'basicProfile,publishPost,listPublications')
  mediumUrl.searchParams.append('state', state)

  const response = NextResponse.redirect(mediumUrl)
  response.cookies.set('oauth_state_medium', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10
  })
  return response
}
