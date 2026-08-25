import { NextResponse } from 'next/server'
import { getTikTokConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connection = await getTikTokConnection(userId)
    if (!connection) {
      return NextResponse.json({
        connected: false,
        status: 'DISCONNECTED',
        message: 'No TikTok connection found. Go to Settings -> Connections to connect TikTok.',
        checklist: {
          accountConnected: false,
          accessTokenValid: false,
          scopesApproved: false,
          developerAppConfigured: Boolean(process.env.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_ID)
        }
      })
    }

    const isDemo = !connection.accessToken || connection.accessToken.startsWith('demo') || connection.accessToken.startsWith('tiktok_demo')
    if (isDemo) {
      return NextResponse.json({
        connected: true,
        status: 'DEMO_MODE',
        username: connection.username,
        message: 'TikTok is connected in Demo Mode. Real posting requires connecting a live TikTok account.',
        checklist: {
          accountConnected: true,
          accessTokenValid: false,
          scopesApproved: false,
          developerAppConfigured: Boolean(process.env.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_ID)
        }
      })
    }

    // Call TikTok User Info API to test token validity
    let userInfoOk = false
    let scopeCheckMessage = 'TikTok API token valid'
    let userInfoData: any = {}

    try {
      const res = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
        headers: { 'Authorization': `Bearer ${connection.accessToken}` }
      })
      userInfoData = await res.json().catch(() => ({}))
      if (res.ok && userInfoData.data?.user) {
        userInfoOk = true
      } else if (userInfoData.error?.code === 'invalid_token' || userInfoData.error?.code === 'unauthorized') {
        scopeCheckMessage = 'TikTok Access Token expired or revoked. Please reconnect in Settings -> Connections.'
      } else if (userInfoData.error?.code === 'scope_not_authorized') {
        scopeCheckMessage = 'Scope user.info.basic or video.publish not authorized on TikTok Developer Portal.'
      }
    } catch (errApi: any) {
      scopeCheckMessage = `Could not reach TikTok User Info API: ${errApi.message}`
    }

    return NextResponse.json({
      connected: true,
      status: userInfoOk ? 'HEALTHY' : 'NEEDS_ATTENTION',
      username: connection.username,
      name: connection.name,
      connectedAt: connection.connectedAt,
      message: scopeCheckMessage,
      checklist: {
        accountConnected: true,
        accessTokenValid: userInfoOk,
        scopesApproved: userInfoOk,
        developerAppConfigured: Boolean(process.env.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_ID)
      },
      troubleshootingGuide: {
        sandboxSetup: 'If your TikTok Developer App is in Development Mode, go to TikTok Developer Console -> App Settings -> Test Users and add your TikTok username as a Target User.',
        scopeSetup: 'Ensure "Direct Post" / "video.publish" feature is enabled in your TikTok Developer App.'
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
