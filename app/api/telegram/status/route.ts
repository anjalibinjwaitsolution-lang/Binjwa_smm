import { NextRequest, NextResponse } from 'next/server'
import { getTelegramConnectionForWebhook } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const connLookup = await getTelegramConnectionForWebhook()
    const botToken = connLookup?.connection?.botToken || process.env.TELEGRAM_BOT_TOKEN || ''

    // 1. Verify getMe
    const getMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
    const getMeData = await getMeRes.json()

    // 2. Fetch getWebhookInfo
    const whInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
    const whInfoData = await whInfoRes.json()

    // 3. Auto-retrigger setWebhook to ensure webhook is 100% active on Vercel
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://binjwa-ssm.vercel.app'
    const webhookUrl = `https://binjwa-ssm.vercel.app/api/webhooks/telegram`
    
    const setWhRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&allowed_updates=${encodeURIComponent(JSON.stringify(["message", "channel_post", "edited_message", "edited_channel_post", "message_reaction"]))}`)
    const setWhData = await setWhRes.json()

    return NextResponse.json({
      success: true,
      botDetails: getMeData.result || getMeData,
      webhookInfo: whInfoData.result || whInfoData,
      setWebhookResult: setWhData,
      targetWebhookUrl: webhookUrl
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to check Telegram status' }, { status: 500 })
  }
}
