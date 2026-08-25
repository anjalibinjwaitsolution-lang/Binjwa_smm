/**
 * Subscribes a Facebook Page and its attached Instagram Business Account to Meta App Webhooks.
 * Required for receiving live DMs and Comments from real people.
 */
export async function subscribeToMetaWebhooks(page: {
  id: string
  accessToken: string
  igAccountId?: string | null
  instagram_business_account?: { id: string }
}) {
  if (!page.accessToken) return

  const fbFields = 'messages,messaging_postbacks,feed'
  const igFields = 'messages,messaging_postbacks,comments,mentions'

  // 1. Subscribe Facebook Page
  try {
    const fbRes = await fetch(`https://graph.facebook.com/v19.0/${page.id}/subscribed_apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        subscribed_fields: fbFields,
        access_token: page.accessToken
      })
    })
    const fbJson = await fbRes.json()
    console.log(`[Webhook Sub] FB Page ${page.id}:`, fbJson)
  } catch (err) {
    console.error(`[Webhook Sub] Failed FB Page ${page.id}:`, err)
  }

  // 2. Discover Instagram Business Account if not explicitly passed
  let igId = page.igAccountId || page.instagram_business_account?.id || (page as any).instagramId
  if (!igId) {
    try {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.accessToken}`
      )
      if (igRes.ok) {
        const igData = await igRes.json()
        igId = igData.instagram_business_account?.id
      }
    } catch (err) {
      console.error(`[Webhook Sub] Error checking IG account for page ${page.id}:`, err)
    }
  }

  // 3. Subscribe Instagram Business Account
  if (igId) {
    try {
      const igSubRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/subscribed_apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          subscribed_fields: igFields,
          access_token: page.accessToken
        })
      })
      const igSubJson = await igSubRes.json()
      console.log(`[Webhook Sub] IG Account ${igId}:`, igSubJson)
    } catch (err) {
      console.error(`[Webhook Sub] Failed IG Account ${igId}:`, err)
    }
  }
}

/**
 * Sends an automated AI reply to a Direct Message (Facebook Messenger or Instagram DM).
 * Automatically resolves the Instagram Business Account ID when responding to Instagram users.
 */
export async function sendMessengerReply(
  pageId: string,
  recipientId: string,
  messageText: string,
  pageAccessToken: string,
  isInstagram = false,
  igAccountId?: string | null
) {
  try {
    let targetId = pageId
    if (isInstagram) {
      // For Instagram, messages MUST be sent via the Instagram Business Account ID
      if (igAccountId) {
        targetId = igAccountId
      } else {
        try {
          const igRes = await fetch(
            `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
          )
          if (igRes.ok) {
            const igData = await igRes.json()
            if (igData.instagram_business_account?.id) {
              targetId = igData.instagram_business_account.id
            }
          }
        } catch (igLookupErr) {
          console.error('Failed to resolve IG account ID for DM reply:', igLookupErr)
        }
      }
    }

    let url = `https://graph.facebook.com/v19.0/${targetId}/messages`

    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pageAccessToken}`
      },
      body: JSON.stringify({
        recipient: {
          id: recipientId
        },
        message: {
          text: messageText
        },
        messaging_type: 'RESPONSE'
      })
    })

    let data = await response.json()

    if (!response.ok) {
      console.warn(`Primary messaging call to /${targetId}/messages failed, trying fallback...`, data)

      // Try /me/messages or fallback to pageId
      const fallbackUrl = isInstagram
        ? `https://graph.facebook.com/v19.0/me/messages`
        : `https://graph.facebook.com/v19.0/${pageId}/messages`

      response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pageAccessToken}`
        },
        body: JSON.stringify({
          recipient: {
            id: recipientId
          },
          message: {
            text: messageText
          },
          messaging_type: 'RESPONSE'
        })
      })
      data = await response.json()
      if (!response.ok) {
        console.error('Messenger API Fallback Error:', data)
        throw new Error(data.error?.message || 'Failed to send automated reply')
      }
    }

    return data
  } catch (error) {
    console.error('Failed to send automated reply:', error)
    throw error
  }
}

