import { NextRequest, NextResponse } from 'next/server'
import { getInstagramConnection, getFacebookConnection } from '@/lib/db'
import { ensurePublicImageUrl } from '@/lib/media-helper'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { caption, imageUrl, videoUrl, scheduledPublishTime, isReel } = body

    if (!caption || caption.trim() === '') {
      return NextResponse.json({ error: 'Caption is required' }, { status: 400 })
    }

    if (!imageUrl && !videoUrl) {
      return NextResponse.json({ error: 'An image or video is required for Instagram posts' }, { status: 400 })
    }

    // First check if an accountId was specified in request body
    let igUserId: string | undefined
    let accessToken: string | undefined

    const igConnection = await getInstagramConnection(userId)
    const fbConnection = await getFacebookConnection(userId)

    const accountId = body.accountId

    // Helper to find IG account ID from a Facebook page
    const getIgIdFromPage = async (page: any): Promise<string | undefined> => {
      let igId = page.igAccountId || page.instagram_business_account?.id || page.instagramId
      if (!igId && page.id && page.accessToken) {
        try {
          const res = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.accessToken}`)
          if (res.ok) {
            const data = await res.json()
            igId = data.instagram_business_account?.id
          }
        } catch (e) {
          console.error("Error checking Graph API for IG account on page:", page.id, e)
        }
      }
      return igId
    }

    if (accountId) {
      if (igConnection && igConnection.id === accountId) {
        igUserId = igConnection.id
        accessToken = igConnection.accessToken
      } else if (fbConnection?.pages) {
        for (const page of fbConnection.pages) {
          const pageIgId = await getIgIdFromPage(page)
          if (pageIgId === accountId || page.id === accountId) {
            igUserId = pageIgId || page.id
            accessToken = page.accessToken || igConnection?.accessToken
            break
          }
        }
      }
    }

    // Default fallback: Check FB pages with an IG account first, then igConnection
    if (!accessToken || !igUserId) {
      if (fbConnection?.pages) {
        for (const page of fbConnection.pages) {
          const pageIgId = await getIgIdFromPage(page)
          if (pageIgId && page.accessToken) {
            igUserId = pageIgId
            accessToken = page.accessToken
            break
          }
        }
      }
      if ((!igUserId || !accessToken) && igConnection?.id && igConnection?.accessToken) {
        igUserId = igConnection.id
        accessToken = igConnection.accessToken
      }
    }

    if (!igUserId || !accessToken) {
      return NextResponse.json(
        { error: 'Instagram Business account not connected. Please connect your Instagram Business account in Settings.' },
        { status: 401 }
      )
    }

    // Step 1: Create Media Container
    const containerParams = new URLSearchParams()
    containerParams.append('caption', caption)
    containerParams.append('access_token', accessToken)

    const tenMinsFromNow = Math.floor(Date.now() / 1000) + (10 * 60)
    const isScheduled = Boolean(scheduledPublishTime && Number(scheduledPublishTime) >= tenMinsFromNow)

    if (isScheduled) {
      containerParams.append('published', 'false')
      containerParams.append('scheduled_publish_time', String(scheduledPublishTime))
    }

    if (videoUrl) {
      containerParams.append('video_url', videoUrl)
      if (isReel) {
        containerParams.append('media_type', 'REELS')
      } else {
        containerParams.append('media_type', 'VIDEO')
      }
    } else if (imageUrl) {
      const publicImageUrl = await ensurePublicImageUrl(imageUrl)
      containerParams.append('image_url', publicImageUrl)
    }

    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: containerParams,
    })

    const containerData = await containerRes.json()

    if (!containerRes.ok || !containerData.id) {
      console.error('Instagram Container Error:', containerData)
      return NextResponse.json(
        { error: containerData.error?.message || 'Failed to create Instagram media container.' },
        { status: 400 }
      )
    }

    const creationId = containerData.id

    // If scheduled, Meta automatically publishes the container at scheduled_publish_time.
    // Calling media_publish on a scheduled container results in an API error.
    if (isScheduled) {
      return NextResponse.json({
        success: true,
        id: creationId,
        postId: creationId,
        platform: 'instagram',
        isScheduled: true,
        message: 'Successfully scheduled on Instagram!',
      })
    }

    // Wait for Meta processing to reach FINISHED for both images and videos to prevent "Media ID is not available"
    let attempts = 0
    let ready = false
    while (attempts < 8 && !ready) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const statusRes = await fetch(`https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${accessToken}`)
      const statusData = await statusRes.json()
      if (statusData.status_code === 'FINISHED') {
        ready = true
        break
      } else if (statusData.status_code === 'ERROR' || statusData.status_code === 'EXPIRED') {
        console.error('Instagram Container Processing Error:', statusData)
        break
      }
      attempts++
    }

    // Step 2: Publish Media Container
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    })

    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: publishParams,
    })

    const publishData = await publishRes.json()

    if (!publishRes.ok || !publishData.id) {
      console.error('Instagram Publish Error:', publishData)
      return NextResponse.json(
        { error: publishData.error?.message || 'Failed to publish to Instagram.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      id: publishData.id,
      postId: publishData.id,
      platform: 'instagram',
      isScheduled: false,
      message: 'Successfully published to Instagram!',
    })
  } catch (error: any) {
    console.error('Instagram Post API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
