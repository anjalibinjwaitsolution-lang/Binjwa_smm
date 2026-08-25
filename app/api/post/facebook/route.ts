import { NextRequest, NextResponse } from 'next/server'
import { getFacebookConnection } from '@/lib/db'
import { ensurePublicImageUrl } from '@/lib/media-helper'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { caption, imageUrl, videoUrl, scheduledPublishTime, accountId } = body

    if (!caption || caption.trim() === '') {
      return NextResponse.json({ error: 'Caption is required' }, { status: 400 })
    }

    const connection = await getFacebookConnection(userId)

    if (!connection) {
      return NextResponse.json(
        { error: 'Facebook not connected. Please connect your account first.' },
        { status: 401 }
      )
    }

    let targetPage = null
    if (accountId && connection.pages && connection.pages.length > 0) {
      targetPage = connection.pages.find((p: any) => p.id === accountId)
    } 
    
    if (!targetPage) {
      if (accountId === connection.id || (connection.pages && connection.pages.length === 0)) {
        return NextResponse.json(
          { error: 'Facebook no longer supports posting to personal profiles. Please create and connect a Facebook Page.' },
          { status: 400 }
        )
      }
      targetPage = connection.pages && connection.pages.length > 0 ? connection.pages[0] : null
    }

    if (!targetPage) {
      return NextResponse.json(
        { error: 'No Facebook pages connected. Please connect a page first.' },
        { status: 401 }
      )
    }

    const accessToken = targetPage.accessToken
    const pageId = targetPage.id

    let postResponse;
    
    const applyScheduling = (formDataOrBody: FormData | any, isFormData: boolean) => {
      if (scheduledPublishTime) {
        // Facebook requires scheduled_publish_time to be between 10 mins and 75 days.
        // If it's less than 10 minutes in the future, we just don't schedule it (publish instantly) to prevent an API error.
        const tenMinsFromNow = Math.floor(Date.now() / 1000) + (10 * 60)
        if (scheduledPublishTime >= tenMinsFromNow) {
          if (isFormData) {
            formDataOrBody.append('published', 'false');
            formDataOrBody.append('scheduled_publish_time', String(scheduledPublishTime));
          } else {
            formDataOrBody.published = false;
            formDataOrBody.scheduled_publish_time = scheduledPublishTime;
          }
        }
      }
    };

    if (videoUrl) {
      if (videoUrl.startsWith('data:video/')) {
        const fetchResponse = await fetch(videoUrl);
        const blob = await fetchResponse.blob();
        
        const formData = new FormData();
        formData.append('source', blob, 'video.mp4');
        formData.append('description', caption);
        formData.append('access_token', accessToken);
        applyScheduling(formData, true);

        postResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/videos`, {
          method: 'POST',
          body: formData,
        });
      } else {
        const postBody: any = {
          file_url: videoUrl,
          description: caption,
          access_token: accessToken,
        };
        applyScheduling(postBody, false);

        postResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/videos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postBody),
        });
      }
    } else if (imageUrl) {
      if (imageUrl.startsWith('data:image/')) {
        // Handle base64 image upload using FormData
        const fetchResponse = await fetch(imageUrl);
        const blob = await fetchResponse.blob();
        
        const formData = new FormData();
        formData.append('source', blob, 'image.jpg');
        formData.append('message', caption);
        formData.append('access_token', accessToken);
        applyScheduling(formData, true);

        postResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Handle standard URL image upload
        const publicImageUrl = await ensurePublicImageUrl(imageUrl);
        const postBody: any = {
          url: publicImageUrl,
          message: caption,
          access_token: accessToken,
        };
        applyScheduling(postBody, false);

        postResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postBody),
        });
      }
    } else {
      // Handle text-only posts
      const postBody: any = {
        message: caption,
        access_token: accessToken,
      };
      applyScheduling(postBody, false);

      postResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postBody),
      });
    }

    const postData = await postResponse.json()

    if (!postResponse.ok || postData.error) {
      console.error('Facebook Post Error:', postData)
      let errorMessage = postData.error?.message || 'Failed to post to Facebook'
      if (errorMessage.includes('publish_actions is deprecated')) {
        errorMessage = "Facebook permissions error: Please go to Settings > Connections, disconnect Facebook, and reconnect it to grant Page publishing permissions."
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: postResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      id: postData.id,
      postId: postData.id,
      platform: 'facebook',
      message: 'Successfully posted to Facebook!',
    })

  } catch (error: any) {
    console.error('Facebook Post API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
