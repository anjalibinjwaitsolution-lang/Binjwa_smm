import { NextRequest, NextResponse } from 'next/server'
import { getLinkedInConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { caption, imageUrl, videoUrl, authorType, orgId } = body

    if (!caption || caption.trim() === '') {
      return NextResponse.json({ error: 'Caption is required' }, { status: 400 })
    }

    if (authorType === 'company' && !orgId) {
      return NextResponse.json({ error: 'orgId is required for company posts' }, { status: 400 })
    }

    const connection = await getLinkedInConnection(userId)

    if (!connection) {
      return NextResponse.json(
        { error: 'LinkedIn not connected. Please connect your account first.' },
        { status: 401 }
      )
    }

    const accessToken = connection.accessToken

    let authorUrn: string
    if (authorType === 'company' && orgId) {
      authorUrn = `urn:li:organization:${orgId}`
    } else {
      authorUrn = connection.personUrn || `urn:li:person:${connection.id}`
    }

    let mediaAsset: string | null = null
    let isVideo = false

    if (videoUrl) {
      mediaAsset = await uploadMediaToLinkedInV2(accessToken, authorUrn, videoUrl, 'video')
      isVideo = true
    } else if (imageUrl) {
      mediaAsset = await uploadMediaToLinkedInV2(accessToken, authorUrn, imageUrl, 'image')
    }

    const postBody = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: caption
          },
          shareMediaCategory: mediaAsset ? (isVideo ? 'VIDEO' : 'IMAGE') : 'NONE',
          media: mediaAsset ? [
            {
              status: 'READY',
              description: { text: caption },
              media: mediaAsset,
              title: { text: 'SMM Post' }
            }
          ] : []
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    }

    const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postBody),
    })

    if (!postResponse.ok) {
      const errorData = await postResponse.json().catch(() => ({}))
      console.error('LinkedIn Post Error:', errorData)
      
      // If it's a video and LinkedIn returns 400, it usually means the asset is still processing
      if (isVideo && postResponse.status === 400) {
        return NextResponse.json(
          { error: 'LinkedIn is still processing your video. Please try publishing again in a few minutes.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: errorData.message || 'Failed to post to LinkedIn' },
        { status: postResponse.status }
      )
    }

    const postId = postResponse.headers.get('x-restli-id') || 'unknown'

    return NextResponse.json({
      success: true,
      postId,
      platform: 'linkedin',
      authorType,
      message: 'Successfully posted to LinkedIn!',
    })

  } catch (error: any) {
    console.error('LinkedIn Post API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function uploadMediaToLinkedInV2(
  accessToken: string,
  ownerUrn: string,
  mediaUrl: string,
  type: 'image' | 'video'
): Promise<string | null> {
  try {
    const recipe = type === 'video' 
      ? 'urn:li:digitalmediaRecipe:feedshare-video' 
      : 'urn:li:digitalmediaRecipe:feedshare-image'

    const initResponse = await fetch(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: [recipe],
            owner: ownerUrn,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }
            ]
          }
        }),
      }
    )

    if (!initResponse.ok) return null

    const initData = await initResponse.json()
    const uploadUrl = initData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl
    const asset = initData.value?.asset

    if (!uploadUrl || !asset) return null

    let mediaBuffer: Buffer;
    if (mediaUrl.startsWith('data:')) {
      const base64Data = mediaUrl.split(',')[1];
      mediaBuffer = Buffer.from(base64Data, 'base64');
    } else {
      const mediaResponse = await fetch(mediaUrl)
      if (!mediaResponse.ok) return null
      const arrayBuffer = await mediaResponse.arrayBuffer()
      mediaBuffer = Buffer.from(arrayBuffer)
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: mediaBuffer as any,
    })

    if (!uploadResponse.ok) {
      console.error('LinkedIn media upload failed:', uploadResponse.status, await uploadResponse.text())
      return null
    }

    console.log('LinkedIn media uploaded successfully:', asset)
    return asset

  } catch (err) {
    console.error('LinkedIn media upload error:', err)
    return null
  }
}
