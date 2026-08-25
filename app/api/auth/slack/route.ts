import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.SLACK_CLIENT_ID || 'demo_slack_client_id'
  const isLocal = request.nextUrl.origin.includes('localhost')
  const origin = isLocal ? 'http://localhost:3000' : 'https://binjwa-ssm.vercel.app'
  const redirectUri = `${origin}/api/auth/slack/callback`
  const state = Math.random().toString(36).substring(7)

  const slackUrl = new URL('https://slack.com/oauth/v2/authorize')
  slackUrl.searchParams.append('client_id', clientId)
  slackUrl.searchParams.append('scope', 'chat:write,channels:read,groups:read,im:read,chat:write.public')
  slackUrl.searchParams.append('redirect_uri', redirectUri)
  slackUrl.searchParams.append('state', state)

  const response = NextResponse.redirect(slackUrl)
  response.cookies.set('oauth_state_slack', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10
  })
  return response
}
