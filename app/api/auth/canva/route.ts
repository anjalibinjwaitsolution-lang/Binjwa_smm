import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.CANVA_CLIENT_ID || 'demo_canva_client_id'
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/canva/callback`
  const state = Math.random().toString(36).substring(7)

  const canvaUrl = new URL('https://www.canva.com/api/oauth/authorize')
  canvaUrl.searchParams.append('client_id', clientId)
  canvaUrl.searchParams.append('redirect_uri', redirectUri)
  canvaUrl.searchParams.append('response_type', 'code')
  canvaUrl.searchParams.append('scope', 'asset:read asset:write design:read design:write')
  canvaUrl.searchParams.append('state', state)

  const response = NextResponse.redirect(canvaUrl)
  response.cookies.set('oauth_state_canva', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10
  })
  return response
}
