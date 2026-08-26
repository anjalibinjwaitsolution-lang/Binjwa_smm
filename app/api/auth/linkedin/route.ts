import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  
  if (!clientId) {
    return NextResponse.json({ error: 'LinkedIn Client ID is missing' }, { status: 500 })
  }

  // Generate a random state string for CSRF protection
  const state = Math.random().toString(36).substring(7)
  
  // Create the authorization URL
  const rawBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000'
  const baseUrl = rawBase.replace(/\/+$/, '')
  const redirectUri = `${baseUrl}/api/auth/linkedin/callback`
  const scope = 'openid profile w_member_social email'
  
  const linkedinAuthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
  linkedinAuthUrl.searchParams.append('response_type', 'code')
  linkedinAuthUrl.searchParams.append('client_id', clientId)
  linkedinAuthUrl.searchParams.append('redirect_uri', redirectUri)
  linkedinAuthUrl.searchParams.append('state', state)
  linkedinAuthUrl.searchParams.append('scope', scope)

  const response = NextResponse.redirect(linkedinAuthUrl)
  
  // Set state in HttpOnly cookie to verify later
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  })

  return response
}
