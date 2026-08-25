import { NextRequest, NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'

export async function GET(request: NextRequest) {
  const appKey = process.env.twitter_Consumer_Key
  const appSecret = process.env.twitter_Secret_Key
  
  if (!appKey || !appSecret) {
    return NextResponse.json({ error: 'Twitter Consumer Keys are missing' }, { status: 500 })
  }

  try {
    const client = new TwitterApi({
      appKey,
      appSecret,
    })

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/twitter/callback`
    
    // Generate an authentication link
    const authLink = await client.generateAuthLink(redirectUri, { linkMode: 'authorize' })

    const response = NextResponse.redirect(authLink.url)
    
    // Set oauth token secrets in HttpOnly cookie to verify later
    response.cookies.set('twitter_oauth_token', authLink.oauth_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10 // 10 minutes
    })
    
    response.cookies.set('twitter_oauth_token_secret', authLink.oauth_token_secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10 // 10 minutes
    })

    return response
  } catch (error: any) {
    console.error('Twitter Auth Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to initialize Twitter Auth' }, { status: 500 })
  }
}
