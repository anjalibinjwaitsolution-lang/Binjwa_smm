import { NextRequest, NextResponse } from 'next/server'
import { getTwitterConnection } from '@/lib/db'
import { TwitterApi } from 'twitter-api-v2'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { caption, imageUrl } = body

    if (!caption || caption.trim() === '') {
      return NextResponse.json({ error: 'Caption is required' }, { status: 400 })
    }

    const connection = await getTwitterConnection(userId)

    if (!connection || !connection.accessToken || !connection.accessSecret) {
      return NextResponse.json(
        { error: 'Twitter not connected. Please connect your account first.' },
        { status: 401 }
      )
    }

    const appKey = process.env.twitter_Consumer_Key
    const appSecret = process.env.twitter_Secret_Key

    if (!appKey || !appSecret) {
      return NextResponse.json({ error: 'Missing Twitter Consumer Keys' }, { status: 500 })
    }

    const client = new TwitterApi({
      appKey,
      appSecret,
      accessToken: connection.accessToken,
      accessSecret: connection.accessSecret,
    })

    let mediaId: string | undefined

    if (imageUrl) {
      let mimeType = 'image/jpeg'
      let buffer: Buffer | null = null

      if (imageUrl.startsWith('data:')) {
        const matches = imageUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/)
        if (matches && matches.length === 3) {
          mimeType = matches[1]
          buffer = Buffer.from(matches[2], 'base64')
        }
      } else {
        try {
          const res = await fetch(imageUrl)
          if (res.ok) {
            mimeType = res.headers.get('content-type') || 'image/jpeg'
            const arrayBuffer = await res.arrayBuffer()
            buffer = Buffer.from(arrayBuffer)
          }
        } catch (fetchErr) {
          console.error('Failed to fetch remote image for Twitter:', fetchErr)
        }
      }

      if (buffer) {
        mediaId = await client.v1.uploadMedia(buffer, { mimeType })
      }
    }

    // Post the tweet
    const tweetPayload: any = { text: caption }
    if (mediaId) {
      tweetPayload.media = { media_ids: [mediaId] }
    }

    const tweetResponse = await client.v2.tweet(tweetPayload)

    return NextResponse.json({
      success: true,
      postId: tweetResponse.data.id,
      platform: 'twitter',
      message: 'Successfully posted to Twitter!',
    })

  } catch (error: any) {
    console.error('Twitter Post API Error:', error)
    return NextResponse.json(
      { error: error?.data?.detail || error.message || 'Failed to post to Twitter' },
      { status: 500 }
    )
  }
}
