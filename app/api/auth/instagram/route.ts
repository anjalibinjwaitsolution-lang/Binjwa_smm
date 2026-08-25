import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.INSTAGRAM_CLIENT_ID
  
  if (!clientId) {
    return NextResponse.json({ error: 'Instagram Client ID is missing' }, { status: 500 })
  }

  // Generate a random state string for CSRF protection
  const state = Math.random().toString(36).substring(7)
  
  // Create the authorization URL
  const redirectUri = `${request.nextUrl.origin}/api/auth/instagram/callback`
  const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement'
  
  const facebookAuthUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  facebookAuthUrl.searchParams.append('response_type', 'code')
  facebookAuthUrl.searchParams.append('client_id', clientId)
  facebookAuthUrl.searchParams.append('redirect_uri', redirectUri)
  facebookAuthUrl.searchParams.append('state', state)
  facebookAuthUrl.searchParams.append('scope', scope)
  facebookAuthUrl.searchParams.append('auth_type', 'rerequest')

  const response = NextResponse.redirect(facebookAuthUrl)
  
  // Set state in HttpOnly cookie to verify later
  response.cookies.set('oauth_state_ig', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  })

  return response
}
