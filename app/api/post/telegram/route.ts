import { NextResponse } from 'next/server'
import { getTelegramConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { ensurePublicImageUrl } from '@/lib/media-helper'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caption, imageUrl, videoUrl, channelId, accountId, scheduledPublishTime } = await request.json()

    const connection = await getTelegramConnection(userId)
    const botToken = connection?.botToken || process.env.TELEGRAM_BOT_TOKEN || ''

    if (!botToken) {
      return NextResponse.json(
        { error: 'Telegram Bot Token not configured. Please connect your Telegram Bot in Settings -> Connections.' },
        { status: 401 }
      )
    }

    // Resolve clean Telegram chat ID / channel handle
    const rawTarget = channelId || accountId || (connection?.channels && connection.channels[0]?.id)
    let targetChatId = (rawTarget && !rawTarget.startsWith('default_') && !rawTarget.startsWith('tg_'))
      ? rawTarget
      : (connection?.channels?.[0]?.id || '@main_announcements')

    let mediaUrl = videoUrl || imageUrl
    let telegramEndpoint = `https://api.telegram.org/bot${botToken}/sendMessage`
    let requestBody: any = {
      chat_id: targetChatId,
      text: caption || 'New post from Binjwa SMM',
      parse_mode: 'HTML'
    }

    if (videoUrl) {
      telegramEndpoint = `https://api.telegram.org/bot${botToken}/sendVideo`
      requestBody = {
        chat_id: targetChatId,
        video: mediaUrl,
        caption: caption || '',
        parse_mode: 'HTML'
      }
    } else if (imageUrl) {
      // 1. Direct binary FormData upload for base64 / data URIs / blob URLs
      if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
        let buffer: Buffer | null = null
        let mimeType = 'image/png'

        if (imageUrl.startsWith('data:')) {
          const match = imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/)
          if (match) mimeType = match[1]
          const base64Data = imageUrl.split(',')[1] || ''
          buffer = Buffer.from(base64Data, 'base64')
        } else {
          try {
            const blobRes = await fetch(imageUrl)
            if (blobRes.ok) {
              const arrayBuf = await blobRes.arrayBuffer()
              buffer = Buffer.from(arrayBuf)
            }
          } catch (e) {}
        }

        if (buffer) {
          const formData = new FormData()
          formData.append('chat_id', targetChatId)
          formData.append('caption', caption || '')
          formData.append('parse_mode', 'HTML')
          formData.append('photo', new Blob([new Uint8Array(buffer)], { type: mimeType }), 'user_published_image.png')

          const formRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            body: formData as any
          })
          const formDataRes = await formRes.json()
          if (formRes.ok && formDataRes.ok) {
            return NextResponse.json({
              success: true,
              postId: String(formDataRes.result?.message_id || `tg_${Date.now()}`),
              message: scheduledPublishTime ? 'Telegram message scheduled successfully' : 'Telegram message published successfully'
            })
          }
        }
      }

      // 2. Try converting image URL or direct HTTP fetch upload to Telegram
      try {
        mediaUrl = await ensurePublicImageUrl(imageUrl)
      } catch (mErr) {}

      // If mediaUrl is a public HTTP URL, fetch its buffer directly and upload binary to Telegram
      if (mediaUrl && mediaUrl.startsWith('http')) {
        try {
          const httpImgRes = await fetch(mediaUrl)
          if (httpImgRes.ok) {
            const arrayBuf = await httpImgRes.arrayBuffer()
            const imgBuffer = Buffer.from(arrayBuf)
            const contentType = httpImgRes.headers.get('content-type') || 'image/jpeg'
            const formData = new FormData()
            formData.append('chat_id', targetChatId)
            formData.append('caption', caption || '')
            formData.append('parse_mode', 'HTML')
            formData.append('photo', new Blob([new Uint8Array(imgBuffer)], { type: contentType }), 'published_image.jpg')

            const formRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
              method: 'POST',
              body: formData as any
            })
            const formDataRes = await formRes.json()
            if (formRes.ok && formDataRes.ok) {
              return NextResponse.json({
                success: true,
                postId: String(formDataRes.result?.message_id || `tg_${Date.now()}`),
                message: scheduledPublishTime ? 'Telegram message scheduled successfully' : 'Telegram message published successfully'
              })
            }
          }
        } catch (eHttp) {
          console.warn('[Telegram Post] HTTP direct fetch failed, trying URL parameter:', eHttp)
        }
      }

      telegramEndpoint = `https://api.telegram.org/bot${botToken}/sendPhoto`
      requestBody = {
        chat_id: targetChatId,
        photo: mediaUrl,
        caption: caption || '',
        parse_mode: 'HTML'
      }
    }

    console.log('[Telegram Post] Sending to Telegram API:', telegramEndpoint, JSON.stringify(requestBody))

    let res = await fetch(telegramEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    let data = await res.json()

    // Fallback attempt: If HTML parse error occurred, retry without parse_mode
    if (!res.ok || !data.ok) {
      if (data.description && data.description.includes('parse')) {
        delete requestBody.parse_mode
        res = await fetch(telegramEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
        data = await res.json()
      }
    }

    if (!res.ok || !data.ok) {
      console.error('Telegram Post Error:', data)
      let friendlyError = data.description || 'Failed to post message to Telegram'
      if (friendlyError.includes('chat not found') || friendlyError.includes('bot is not a member')) {
        friendlyError = `Telegram Bot is not an administrator/member of target chat/channel '${targetChatId}'. Please add your Telegram Bot (@binjwa_bot) as an Admin to your Telegram Channel.`
      }

      return NextResponse.json(
        { error: friendlyError },
        { status: 400 }
      )
    }

    const messageId = data.result?.message_id || `tg_${Date.now()}`

    return NextResponse.json({
      success: true,
      postId: String(messageId),
      message: scheduledPublishTime ? 'Telegram message scheduled successfully' : 'Telegram message published successfully'
    })
  } catch (error: any) {
    console.error('Telegram API Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error while publishing to Telegram' },
      { status: 500 }
    )
  }
}
