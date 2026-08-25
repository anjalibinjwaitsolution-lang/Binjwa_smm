import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID || '1531188953787404411'
  const isLocal = request.nextUrl.origin.includes('localhost')
  const origin = isLocal ? 'http://localhost:3000' : 'https://binjwa-ssm.vercel.app'
  const redirectUri = `${origin}/api/auth/discord/callback`
  const state = Math.random().toString(36).substring(7)

  const discordUrl = new URL('https://discord.com/api/oauth2/authorize')
  discordUrl.searchParams.append('client_id', clientId)
  discordUrl.searchParams.append('redirect_uri', redirectUri)
  discordUrl.searchParams.append('response_type', 'code')
  discordUrl.searchParams.append('scope', 'identify guilds bot messages.read')
  discordUrl.searchParams.append('state', state)

  const response = NextResponse.redirect(discordUrl)
  response.cookies.set('oauth_state_discord', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10
  })
  return response
}
