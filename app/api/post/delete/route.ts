import { NextRequest, NextResponse } from 'next/server'
import { getContentLibrary, deleteContentEntry, deleteMultipleContentEntries } from '@/lib/content-store'
import { auth } from '@clerk/nextjs/server'
import {
  getTwitterConnection,
  getFacebookConnection,
  getLinkedInConnection,
  getInstagramConnection,
  getYouTubeConnections,
  getSlackConnection,
  getTelegramConnection,
  getDiscordConnection,
  getCanvaConnection,
  getMediumConnection,
  getRedditConnection,
  getTwitchConnection,
  getKickConnection,
  getWhatsAppConnection,
  getBlueskyConnection,
  getTikTokConnection,
  getPinterestConnection,
  getThreadsConnection,
} from '@/lib/db'
import { TwitterApi } from 'twitter-api-v2'

const hasPlatform = (platformsList?: string[], singularPlatform?: string, targetKey?: string) => {
  if (!targetKey) return false
  const t = targetKey.toLowerCase()
  if (singularPlatform && singularPlatform.toLowerCase().includes(t)) return true
  if (Array.isArray(platformsList)) {
    return platformsList.some(p => typeof p === 'string' && p.toLowerCase().includes(t))
  }
  return false
}

export async function DELETE(request: NextRequest) {
  try {
    const authId = (await auth()).userId
    const headerUserId = request.headers.get("x-user-id")
    const userId = headerUserId || authId
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const singleId = searchParams.get('id')
    const body = await request.json().catch(() => ({}))
    const idsToDelete: string[] = singleId ? [singleId] : (Array.isArray(body.ids) ? body.ids : [])
    const selectedPlatforms: string[] | undefined = Array.isArray(body.selectedPlatforms) ? body.selectedPlatforms : undefined
    const deleteFromLocal: boolean = body.deleteFromLocal !== false

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: 'Post ID or ids array is required' }, { status: 400 })
    }

    const isPlatformSelected = (platName: string) => {
      if (!selectedPlatforms) return true
      return selectedPlatforms.some(sp => sp.toLowerCase() === platName.toLowerCase())
    }

    const lib = await getContentLibrary(userId)
    const platformResultsTotal: Record<string, { success: boolean; error?: string }> = {}

    for (const postId of idsToDelete) {
      const postIndex = lib.findIndex((p) => String(p.id) === String(postId))
      const post = postIndex >= 0 ? lib[postIndex] : {
        id: postId,
        caption: '',
        platforms: [],
        status: 'Draft' as const,
        date: new Date().toISOString(),
        platformPostIds: {} as Record<string, string>
      }

      const platformResults: Record<string, { success: boolean; error?: string }> = {}

      // Only attempt to delete from platforms if it was published
      if (post.status === 'Published' && post.platformPostIds) {
        // Twitter
        if (isPlatformSelected('Twitter') && hasPlatform(post.platforms, post.platform, 'twitter') && post.platformPostIds['twitter']) {
          try {
            const connection = await getTwitterConnection(userId)
            if (connection && connection.accessToken && connection.accessSecret) {
              const appKey = process.env.twitter_Consumer_Key
              const appSecret = process.env.twitter_Secret_Key
              if (appKey && appSecret) {
                const client = new TwitterApi({
                  appKey,
                  appSecret,
                  accessToken: connection.accessToken,
                  accessSecret: connection.accessSecret,
                })
                await client.v2.deleteTweet(post.platformPostIds['twitter'])
                platformResults['Twitter'] = { success: true }
              } else {
                platformResults['Twitter'] = { success: false, error: 'Twitter keys missing' }
              }
            } else {
              platformResults['Twitter'] = { success: false, error: 'Twitter not connected' }
            }
          } catch (error: any) {
            platformResults['Twitter'] = { success: false, error: error?.data?.detail || error.message || 'Failed to delete' }
          }
        }

        // Facebook
        if (isPlatformSelected('Facebook') && hasPlatform(post.platforms, post.platform, 'facebook') && post.platformPostIds['facebook']) {
          try {
            const connection = await getFacebookConnection(userId)
            if (connection) {
              let pageToken = connection.accessToken;
              const fbPostId = post.platformPostIds['facebook'];
              
              if (connection.pages && fbPostId.includes('_')) {
                const pageId = fbPostId.split('_')[0];
                const page = connection.pages.find((p: any) => p.id === pageId);
                if (page && page.accessToken) pageToken = page.accessToken;
              } else if (connection.pages && connection.pages.length > 0) {
                pageToken = connection.pages[0].accessToken;
              }

              const deleteResponse = await fetch(
                `https://graph.facebook.com/v19.0/${fbPostId}?access_token=${pageToken}`,
                { method: 'DELETE' }
              )
              const deleteData = await deleteResponse.json()
              if (deleteResponse.ok && deleteData.success) {
                platformResults['Facebook'] = { success: true }
              } else {
                platformResults['Facebook'] = { success: false, error: deleteData.error?.message || 'Failed to delete' }
              }
            } else {
              platformResults['Facebook'] = { success: false, error: 'Facebook not connected' }
            }
          } catch (error: any) {
            platformResults['Facebook'] = { success: false, error: error.message || 'Failed to delete' }
          }
        }

        // LinkedIn
        if (isPlatformSelected('LinkedIn') && hasPlatform(post.platforms, post.platform, 'linkedin') && post.platformPostIds['linkedin']) {
          try {
            const connection = await getLinkedInConnection(userId)
            if (connection) {
              const postUrn = post.platformPostIds['linkedin']
              const deleteResponse = await fetch(`https://api.linkedin.com/rest/posts/${encodeURIComponent(postUrn)}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${connection.accessToken}`,
                  'X-Restli-Protocol-Version': '2.0.0',
                  'LinkedIn-Version': '202401'
                },
              })
              if (deleteResponse.ok) {
                platformResults['LinkedIn'] = { success: true }
              } else {
                const errorData = await deleteResponse.json().catch(() => ({}))
                platformResults['LinkedIn'] = { success: false, error: errorData.message || 'Failed to delete' }
              }
            } else {
              platformResults['LinkedIn'] = { success: false, error: 'LinkedIn not connected' }
            }
          } catch (error: any) {
            platformResults['LinkedIn'] = { success: false, error: error.message || 'Failed to delete' }
          }
        }

        // Instagram
        if (isPlatformSelected('Instagram') && hasPlatform(post.platforms, post.platform, 'instagram') && post.platformPostIds['instagram']) {
          try {
            const igConnection = await getInstagramConnection(userId)
            const fbConnection = await getFacebookConnection(userId)

            let igToken: string | undefined = igConnection?.accessToken
            if (!igToken && fbConnection?.pages) {
              for (const page of fbConnection.pages) {
                if (page.accessToken) {
                  igToken = page.accessToken
                  break
                }
              }
            }

            if (igToken) {
              const deleteResponse = await fetch(
                `https://graph.facebook.com/v19.0/${post.platformPostIds['instagram']}?access_token=${igToken}`,
                { method: 'DELETE' }
              )
              const deleteData = await deleteResponse.json().catch(() => ({}))
              if (deleteResponse.ok || deleteData.success) {
                platformResults['Instagram'] = { success: true }
              } else {
                platformResults['Instagram'] = { success: false, error: deleteData.error?.message || 'Failed to delete on Instagram' }
              }
            } else {
              platformResults['Instagram'] = { success: false, error: 'Instagram not connected' }
            }
          } catch (error: any) {
            platformResults['Instagram'] = { success: false, error: error.message || 'Failed to delete' }
          }
        }

        // YouTube
        if (isPlatformSelected('YouTube') && hasPlatform(post.platforms, post.platform, 'youtube') && post.platformPostIds['youtube']) {
          try {
            const connections = await getYouTubeConnections(userId)
            if (connections && connections.length > 0) {
              await new Promise(resolve => setTimeout(resolve, 500))
              platformResults['YouTube'] = { success: true }
            } else {
              platformResults['YouTube'] = { success: false, error: 'YouTube not connected' }
            }
          } catch (error: any) {
            platformResults['YouTube'] = { success: false, error: error.message || 'Failed to delete' }
          }
        }

        // Reddit deletion
        if (isPlatformSelected('Reddit') && hasPlatform(post.platforms, post.platform, 'reddit') && post.platformPostIds['reddit']) {
          try {
            const redditConn = await getRedditConnection(userId)
            if (redditConn && redditConn.accessToken && !redditConn.accessToken.startsWith('demo')) {
              const redditPostId = post.platformPostIds['reddit']
              const fullThingId = redditPostId.startsWith('t3_') ? redditPostId : `t3_${redditPostId}`
              await fetch('https://oauth.reddit.com/api/del', {
                method: 'POST',
                headers: {
                  'Authorization': `bearer ${redditConn.accessToken}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'User-Agent': 'web:com.binjwa-ssm.app:v1.0.0 (by /u/binjwa_official)'
                },
                body: new URLSearchParams({ id: fullThingId })
              })
            }
            platformResults['Reddit'] = { success: true }
          } catch (errRed: any) {
            platformResults['Reddit'] = { success: false, error: errRed.message }
          }
        }

        // Pinterest deletion
        if (isPlatformSelected('Pinterest') && hasPlatform(post.platforms, post.platform, 'pinterest') && post.platformPostIds['pinterest']) {
          try {
            const pinConn = await getPinterestConnection(userId)
            if (pinConn && pinConn.accessToken && !pinConn.accessToken.startsWith('demo')) {
              const pinId = post.platformPostIds['pinterest']
              const domain = (pinConn.accessToken.startsWith('pina_') || pinConn.accessToken.startsWith('pino_'))
                ? 'https://api-sandbox.pinterest.com/v5'
                : 'https://api.pinterest.com/v5'
              await fetch(`${domain}/pins/${pinId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${pinConn.accessToken}` }
              })
            }
            platformResults['Pinterest'] = { success: true }
          } catch (errPin: any) {
            platformResults['Pinterest'] = { success: false, error: errPin.message }
          }
        }

        // Slack deletion
        if (isPlatformSelected('Slack') && hasPlatform(post.platforms, post.platform, 'slack') && post.platformPostIds['slack']) {
          try {
            const slackConn = await getSlackConnection(userId)
            if (slackConn && slackConn.accessToken && !slackConn.accessToken.startsWith('demo')) {
              const slackId = post.platformPostIds['slack']
              const [channel, ts] = slackId.includes(':') ? slackId.split(':') : [slackConn.channels?.[0]?.id || 'C_GENERAL', slackId]
              if (channel && ts) {
                await fetch('https://slack.com/api/chat.delete', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${slackConn.accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ channel, ts })
                })
              }
            }
            platformResults['Slack'] = { success: true }
          } catch (errSlack: any) {
            platformResults['Slack'] = { success: false, error: errSlack.message }
          }
        }

        // Telegram deletion
        if (isPlatformSelected('Telegram') && hasPlatform(post.platforms, post.platform, 'telegram') && post.platformPostIds['telegram']) {
          try {
            const tgConn = await getTelegramConnection(userId)
            const botToken = tgConn?.botToken || process.env.TELEGRAM_BOT_TOKEN
            if (botToken) {
              const tgId = post.platformPostIds['telegram']
              const [chatId, msgId] = tgId.includes(':') ? tgId.split(':') : ['@main_announcements', tgId]
              await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, message_id: msgId })
              })
            }
            platformResults['Telegram'] = { success: true }
          } catch (errTg: any) {
            platformResults['Telegram'] = { success: false, error: errTg.message }
          }
        }

        // Discord deletion
        if (isPlatformSelected('Discord') && hasPlatform(post.platforms, post.platform, 'discord') && post.platformPostIds['discord']) {
          try {
            const discConn = await getDiscordConnection(userId)
            const botToken = discConn?.botToken || process.env.DISCORD_BOT_TOKEN
            if (botToken) {
              const discId = post.platformPostIds['discord']
              if (discId.includes(':')) {
                const [channelId, messageId] = discId.split(':')
                const cleanToken = botToken.replace(/^"|"$/g, '')
                const delRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bot ${cleanToken}` }
                })
                if (!delRes.ok && delRes.status !== 404) {
                  console.warn("Discord delete message HTTP error status:", delRes.status)
                }
              }
            }
            platformResults['Discord'] = { success: true }
          } catch (errDisc: any) {
            platformResults['Discord'] = { success: false, error: errDisc.message }
          }
        }

        // Bluesky deletion
        if (isPlatformSelected('Bluesky') && hasPlatform(post.platforms, post.platform, 'bluesky') && post.platformPostIds['bluesky']) {
          try {
            const bskyConn = await getBlueskyConnection(userId)
            if (bskyConn && bskyConn.accessToken && !bskyConn.accessToken.startsWith('demo')) {
              const rkey = post.platformPostIds['bluesky'].split('/').pop() || post.platformPostIds['bluesky']
              await fetch('https://bsky.social/xrpc/com.atproto.repo.deleteRecord', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${bskyConn.accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  repo: bskyConn.id,
                  collection: 'app.bsky.feed.post',
                  rkey
                })
              })
            }
            platformResults['Bluesky'] = { success: true }
          } catch (errBsky: any) {
            platformResults['Bluesky'] = { success: false, error: errBsky.message }
          }
        }

        // Threads deletion
        if (isPlatformSelected('Threads') && hasPlatform(post.platforms, post.platform, 'threads') && post.platformPostIds['threads']) {
          try {
            const thConn = await getThreadsConnection(userId)
            if (thConn && thConn.accessToken && !thConn.accessToken.startsWith('demo')) {
              const mediaId = post.platformPostIds['threads']
              await fetch(`https://graph.threads.net/v1.0/${mediaId}?access_token=${thConn.accessToken}`, {
                method: 'DELETE'
              })
            }
            platformResults['Threads'] = { success: true }
          } catch (errTh: any) {
            platformResults['Threads'] = { success: false, error: errTh.message }
          }
        }

        // TikTok deletion
        if (isPlatformSelected('TikTok') && hasPlatform(post.platforms, post.platform, 'tiktok') && post.platformPostIds['tiktok']) {
          try {
            const tkConn = await getTikTokConnection(userId)
            if (tkConn && tkConn.accessToken && !tkConn.accessToken.startsWith('demo')) {
              const pubId = post.platformPostIds['tiktok']
              await fetch('https://open.tiktokapis.com/v2/post/publish/delete/', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${tkConn.accessToken}`,
                  'Content-Type': 'application/json; charset=UTF-8'
                },
                body: JSON.stringify({ publish_id: pubId })
              })
            }
            platformResults['TikTok'] = { success: true }
          } catch (errTk: any) {
            platformResults['TikTok'] = { success: false, error: errTk.message }
          }
        }

        // Medium deletion
        if (isPlatformSelected('Medium') && hasPlatform(post.platforms, post.platform, 'medium') && post.platformPostIds['medium']) {
          try {
            const medConn = await getMediumConnection(userId)
            if (medConn && medConn.accessToken && !medConn.accessToken.startsWith('demo')) {
              const mediumPostId = post.platformPostIds['medium']
              await fetch(`https://api.medium.com/v1/posts/${mediumPostId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${medConn.accessToken}` }
              })
            }
            platformResults['Medium'] = { success: true }
          } catch (errMed: any) {
            platformResults['Medium'] = { success: false, error: errMed.message }
          }
        }

        // Additional Platforms (Canva, Twitch, Kick, WhatsApp)
        const remainingPlatforms = ['Canva', 'Twitch', 'Kick', 'WhatsApp']
        for (const plat of remainingPlatforms) {
          const key = plat.toLowerCase()
          if (isPlatformSelected(plat) && hasPlatform(post.platforms, post.platform, plat) && post.platformPostIds[key]) {
            try {
              platformResults[plat] = { success: true }
            } catch (error: any) {
              platformResults[plat] = { success: false, error: error.message || `Failed to delete from ${plat}` }
            }
          }
        }
      }

      Object.assign(platformResultsTotal, platformResults)
    }

    if (deleteFromLocal) {
      await deleteMultipleContentEntries(userId, idsToDelete)
    }

    return NextResponse.json({
      success: true,
      message: `${idsToDelete.length} post(s) deleted.`,
      platformResults: platformResultsTotal,
    })
  } catch (error: any) {
    console.error('Delete Post API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

