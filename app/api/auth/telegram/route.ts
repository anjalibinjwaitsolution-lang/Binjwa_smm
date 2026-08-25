import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const redirectUri = `${request.nextUrl.origin}/api/auth/telegram/callback?demo=true`
  return NextResponse.redirect(redirectUri)
}
