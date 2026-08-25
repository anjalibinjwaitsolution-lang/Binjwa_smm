import { NextResponse } from 'next/server'
import { getTikTokConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { ensurePublicImageUrl } from '@/lib/media-helper'

function getTikTokDiagnostics(code?: string, message?: string) {
  const c = (code || '').toLowerCase()
  const m = (message || '').toLowerCase()

  if (c.includes('scope_not_authorized') || m.includes('scope')) {
    return {
      cause: 'TikTok Developer App is missing approved "video.publish" or "video.upload" scope.',
      howToFix: [
        '1. Open https://developers.tiktok.com and go to your Developer App Sandbox Settings.',
        '2. Under "Scopes", ensure "video.publish" and "video.upload" are added.',
        '3. Ensure target user username in Sandbox Settings matches your connected TikTok handle.',
        '4. Disconnect and re-authorize TikTok from Settings -> Connections.'
      ]
    }
  }

  if (c.includes('unauthorized') || c.includes('invalid_token') || m.includes('token') || m.includes('unauthorized')) {
    return {
      cause: 'TikTok Access Token is expired or invalid.',
      howToFix: [
        '1. Go to Settings -> Connections in your dashboard.',
        '2. Disconnect your TikTok account.',
        '3. Re-connect TikTok to issue a fresh access token with posting permissions.'
      ]
    }
  }

  if (c.includes('url_unreachable') || c.includes('invalid_params') || m.includes('url') || m.includes('domain')) {
    return {
      cause: 'TikTok pull server requires Domain Verification under Content Posting API -> Verify domains.',
      howToFix: [
        '1. Open https://developers.tiktok.com and go to your app Sandbox Settings.',
        '2. Under "Content Posting API", find "Verify domains".',
        '3. Click the "Verify" button next to https://binjwa-ssm.vercel.app/.',
        '4. Ensure target username in Sandbox Settings matches your connected TikTok account.'
      ]
    }
  }

  if (c.includes('spam') || m.includes('spam')) {
    return {
      cause: 'TikTok API rate-limiting or anti-spam protection flagged this request.',
      howToFix: [
        '1. Wait a few minutes before submitting another post to TikTok.',
        '2. Modify your video caption or title to avoid repetitive post flags.'
      ]
    }
  }

  return {
    cause: message || 'TikTok API returned an unhandled error status.',
    howToFix: [
      '1. In TikTok Developer Console -> Sandbox Settings -> Verify domains, click the "Verify" button.',
      '2. Ensure your TikTok handle is added under Target Users in Sandbox Settings.',
      '3. Re-connect TikTok in Settings -> Connections.'
    ]
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caption, imageUrl, videoUrl, scheduledPublishTime } = await request.json()

    const rawMediaSourceUrl = videoUrl || imageUrl
    if (!rawMediaSourceUrl) {
      return NextResponse.json({ error: 'Video or Image URL is required for TikTok post' }, { status: 400 })
    }

    const connection = await getTikTokConnection(userId)
    if (!connection || !connection.accessToken) {
      return NextResponse.json(
        {
          error: 'TikTok account not connected. Please connect your account first in Settings -> Connections.',
          diagnostics: {
            cause: 'No TikTok OAuth connection found for this account.',
            howToFix: ['Go to Settings -> Connections and click Connect on TikTok.']
          }
        },
        { status: 401 }
      )
    }

    const accessToken = connection.accessToken
    if (accessToken.startsWith('demo') || accessToken.startsWith('tiktok_demo')) {
      return NextResponse.json(
        {
          error: 'Demo TikTok account detected. Live posting requires connecting a real TikTok account with video.publish scope.',
          diagnostics: {
            cause: 'Account is operating under demo mode.',
            howToFix: [
              '1. Go to Settings -> Connections.',
              '2. Click Connect on TikTok to authorize your real TikTok profile.'
            ]
          }
        },
        { status: 400 }
      )
    }

    const isVideo = Boolean(videoUrl) || rawMediaSourceUrl.includes('.mp4') || rawMediaSourceUrl.includes('.mov') || rawMediaSourceUrl.includes('data:video')

    let publicMediaUrl = rawMediaSourceUrl
    if (publicMediaUrl.startsWith('data:') || publicMediaUrl.startsWith('blob:') || (!isVideo && !publicMediaUrl.match(/\.(jpg|jpeg|png|webp)($|\?)/i))) {
      try {
        publicMediaUrl = await ensurePublicImageUrl(publicMediaUrl)
      } catch (eImg) {
        console.warn('[TikTok Post] Media conversion notice:', eImg)
      }
    }

    // Query TikTok Creator Info for allowed privacy levels
    let privacyLevel = 'PUBLIC_TO_EVERYONE'
    try {
      const creatorRes = await fetch('https://open.tiktokapis.com/v2/post/publish/creator/info/query/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8'
        }
      })
      const creatorData = await creatorRes.json().catch(() => ({}))
      console.log('[TikTok Post] Creator Info Query:', JSON.stringify(creatorData))

      if (creatorData.data?.privacy_level_options && Array.isArray(creatorData.data.privacy_level_options)) {
        const options: string[] = creatorData.data.privacy_level_options
        if (options.includes('PUBLIC_TO_EVERYONE')) {
          privacyLevel = 'PUBLIC_TO_EVERYONE'
        } else if (options.length > 0) {
          privacyLevel = options[0]
        }
      }
    } catch (eC) {
      console.warn('[TikTok Creator Info] Query warning:', eC)
    }

    // Attempt 1: TikTok Video Init API with PULL_FROM_URL
    if (isVideo) {
      const videoEndpoint = 'https://open.tiktokapis.com/v2/post/publish/video/init/'
      const videoPayload: any = {
        post_info: {
          title: caption || 'New video from Binjwa SMM',
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_stitch: false,
          disable_comment: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: publicMediaUrl
        }
      }

      if (scheduledPublishTime) {
        videoPayload.post_info.schedule_time = scheduledPublishTime
      }

      console.log('[TikTok Post] Trying Video Init Endpoint (PULL_FROM_URL):', JSON.stringify(videoPayload))

      const videoRes = await fetch(videoEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify(videoPayload)
      })

      const videoData = await videoRes.json().catch(() => ({}))
      console.log('[TikTok Post] Video Init Response:', JSON.stringify(videoData))

      if (videoRes.ok && videoData.error?.code === 'ok') {
        const publishId = videoData.data?.publish_id || `tiktok_${Date.now()}`
        return NextResponse.json({
          success: true,
          postId: publishId,
          message: scheduledPublishTime ? 'TikTok video post scheduled successfully' : 'TikTok video post published successfully'
        })
      }

      // Attempt 1b: Fallback to FILE_UPLOAD (push_by_file) if video buffer can be fetched
      try {
        const mediaFetch = await fetch(publicMediaUrl)
        if (mediaFetch.ok) {
          const mediaBuf = await mediaFetch.arrayBuffer()
          const bufLength = mediaBuf.byteLength

          if (bufLength > 0 && bufLength < 50 * 1024 * 1024) {
            const fileUploadPayload: any = {
              post_info: {
                title: caption || 'New video from Binjwa SMM',
                privacy_level: privacyLevel,
                disable_duet: false,
                disable_stitch: false,
                disable_comment: false
              },
              source_info: {
                source: 'FILE_UPLOAD',
                video_size: bufLength,
                chunk_size: bufLength,
                total_chunk_count: 1
              }
            }

            console.log('[TikTok Post] Trying Video Init Endpoint (FILE_UPLOAD):', JSON.stringify(fileUploadPayload))
            const fileInitRes = await fetch(videoEndpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8'
              },
              body: JSON.stringify(fileUploadPayload)
            })

            const fileInitData = await fileInitRes.json().catch(() => ({}))
            console.log('[TikTok Post] FILE_UPLOAD Init Response:', JSON.stringify(fileInitData))

            if (fileInitRes.ok && fileInitData.error?.code === 'ok' && fileInitData.data?.upload_url) {
              const uploadUrl = fileInitData.data.upload_url
              const publishId = fileInitData.data.publish_id || `tiktok_${Date.now()}`

              const putRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'video/mp4',
                  'Content-Range': `bytes 0-${bufLength - 1}/${bufLength}`
                },
                body: Buffer.from(mediaBuf)
              })

              if (putRes.ok) {
                return NextResponse.json({
                  success: true,
                  postId: publishId,
                  message: 'TikTok video uploaded successfully via file stream'
                })
              }
            }
          }
        }
      } catch (fErr) {
        console.warn('[TikTok Post] FILE_UPLOAD fallback warning:', fErr)
      }

      const errorCode = videoData.error?.code || 'video_publish_error'
      const errorMsg = videoData.error?.message || videoRes.statusText || 'Failed to post video to TikTok API'
      const diagnostics = getTikTokDiagnostics(errorCode, errorMsg)

      return NextResponse.json(
        {
          error: `TikTok API Error (${errorCode}): ${errorMsg}`,
          tiktokErrorCode: errorCode,
          tiktokLogId: videoData.error?.log_id,
          diagnostics
        },
        { status: 400 }
      )
    }

    // Attempt 2: TikTok Photo Content Init API
    const photoEndpoint = 'https://open.tiktokapis.com/v2/post/publish/content/init/'
    const photoPayload: any = {
      post_info: {
        title: caption || 'New photo post from Binjwa SMM',
        privacy_level: privacyLevel,
        disable_comment: false
      },
      source_info: {
        source: 'PULL_FROM_URL',
        photo_cover_index: 1,
        photo_images: [publicMediaUrl]
      },
      post_mode: 'DIRECT_POST',
      media_type: 'PHOTO'
    }

    if (scheduledPublishTime) {
      photoPayload.post_info.schedule_time = scheduledPublishTime
    }

    console.log('[TikTok Post] Trying Photo Content Endpoint:', JSON.stringify(photoPayload))

    const photoRes = await fetch(photoEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify(photoPayload)
    })

    const photoData = await photoRes.json().catch(() => ({}))
    console.log('[TikTok Post] Photo Content Response:', JSON.stringify(photoData))

    if (photoRes.ok && photoData.error?.code === 'ok') {
      const publishId = photoData.data?.publish_id || `tiktok_${Date.now()}`
      return NextResponse.json({
        success: true,
        postId: publishId,
        message: scheduledPublishTime ? 'TikTok photo post scheduled successfully' : 'TikTok photo post published successfully'
      })
    }

    const photoErrorCode = photoData.error?.code || 'photo_publish_error'
    const photoErrorMsg = photoData.error?.message || photoRes.statusText || 'Failed to post photo to TikTok API'
    const photoDiagnostics = getTikTokDiagnostics(photoErrorCode, photoErrorMsg)

    return NextResponse.json(
      {
        error: `TikTok API Error (${photoErrorCode}): ${photoErrorMsg}`,
        tiktokErrorCode: photoErrorCode,
        tiktokLogId: photoData.error?.log_id,
        diagnostics: photoDiagnostics
      },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('TikTok API Exception:', error)
    return NextResponse.json(
      {
        error: error.message || 'Internal server error while publishing to TikTok',
        diagnostics: getTikTokDiagnostics('exception', error.message)
      },
      { status: 500 }
    )
  }
}
