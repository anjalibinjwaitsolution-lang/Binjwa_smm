import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_ID || 'demo_tiktok_client_key'
  const isLocal = request.nextUrl.origin.includes('localhost')
  const origin = isLocal ? 'http://localhost:3000' : 'https://binjwa-ssm.vercel.app'
  const redirectUri = `${origin}/api/auth/tiktok/callback`
  const state = Math.random().toString(36).substring(7)

  const tiktokAuthUrl = new URL('https://www.tiktok.com/v2/auth/authorize/')
  tiktokAuthUrl.searchParams.append('client_key', clientKey)
  tiktokAuthUrl.searchParams.append('redirect_uri', redirectUri)
  tiktokAuthUrl.searchParams.append('scope', 'user.info.basic,video.publish,video.upload,video.list')
  tiktokAuthUrl.searchParams.append('response_type', 'code')
  tiktokAuthUrl.searchParams.append('state', state)

  const response = NextResponse.redirect(tiktokAuthUrl)
  response.cookies.set('oauth_state_tiktok', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10
  })
  return response
}
