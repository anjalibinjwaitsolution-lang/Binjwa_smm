import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.THREADS_APP_ID || '1108904491809943'
  const isLocal = request.nextUrl.origin.includes('localhost')
  const origin = isLocal ? 'http://localhost:3000' : 'https://binjwa-ssm.vercel.app'
  const redirectUri = `${origin}/api/auth/threads/callback`
  const state = Math.random().toString(36).substring(7)

  const threadsAuthUrl = `https://threads.net/oauth/authorize?app_id=${clientId}&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=threads_basic,threads_content_publish&response_type=code&state=${state}`

  const response = NextResponse.redirect(threadsAuthUrl)
  response.cookies.set('oauth_state_threads', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10
  })
  return response
}
