import { supabase } from './supabase'

export interface LinkedInProfile {
  id: string
  name: string
  avatar: string
  headline?: string
  connectedAt: string
  accessToken: string
  personUrn?: string
}

export interface FacebookPage {
  id: string
  name: string
  accessToken: string
  aiEnabled: boolean
  aiCommentsEnabled?: boolean
  nicheInstructions?: string
  needsReview?: boolean
}

export interface FacebookProfile {
  id: string
  name: string
  avatar: string
  connectedAt: string
  accessToken: string
  pages?: FacebookPage[]
}

export interface InstagramProfile {
  id: string
  username: string
  name: string
  accountType: string
  connectedAt: string
  accessToken: string
}

export interface TwitterProfile {
  id: string
  name: string
  handle: string
  avatar: string
  connectedAt: string
  accessToken: string
  accessSecret: string
}

export interface YouTubeChannel {
  id: string
  name: string
  handle: string
  avatar: string
  connectedAt: string
  accessToken: string
  refreshToken?: string
  title?: string
}

export interface MessageLog {
  pageId: string
  senderId: string
  message: string
  response: string
  needsReview: boolean
  timestamp: string
  platform?: string
  messageType?: string
  senderName?: string
  senderHandle?: string
  postCaption?: string
  telegramMessageId?: string | number
}

// NEW PLATFORMS
export interface ThreadsProfile {
  id: string
  username: string
  name: string
  avatar: string
  connectedAt: string
  accessToken: string
}

export interface PinterestProfile {
  id: string
  username: string
  name: string
  avatar: string
  connectedAt: string
  accessToken: string
}

export interface WhatsAppProfile {
  id: string
  phoneNumberId: string
  name: string
  connectedAt: string
  accessToken: string
  wabaId?: string
}

export interface BlueskyProfile {
  id: string
  handle: string
  name: string
  avatar: string
  connectedAt: string
  accessToken: string
}

export interface TikTokProfile {
  id: string
  username: string
  name: string
  avatar: string
  connectedAt: string
  accessToken?: string
}

export interface SlackProfile {
  id: string
  name: string
  teamId?: string
  channels?: { id: string; name: string }[]
  avatar: string
  connectedAt: string
  accessToken: string
}

export interface TelegramProfile {
  id: string
  username?: string
  name: string
  botToken?: string
  channels?: { id: string; name: string }[]
  avatar: string
  connectedAt: string
}

export interface DiscordProfile {
  id: string
  name: string
  guildId?: string
  channels?: { id: string; name: string }[]
  avatar: string
  connectedAt: string
  accessToken: string
  botToken?: string
}

export interface CanvaProfile {
  id: string
  name: string
  workspaceId?: string
  avatar: string
  connectedAt: string
  accessToken: string
}

export interface MediumProfile {
  id: string
  username?: string
  name: string
  publications?: { id: string; name: string }[]
  avatar: string
  connectedAt: string
  accessToken: string
}

export interface RedditProfile {
  id: string
  username?: string
  name: string
  subreddits?: { id: string; name: string }[]
  avatar: string
  connectedAt: string
  accessToken: string
}

export interface TwitchProfile {
  id: string
  username?: string
  name: string
  avatar: string
  connectedAt: string
  accessToken: string
}

export interface KickProfile {
  id: string
  username?: string
  name: string
  avatar: string
  connectedAt: string
  accessToken: string
}

async function getConnection(userId: string, platform: string) {
  console.log(`[DB DEBUG] getConnection called for userId: "${userId}", platform: "${platform}"`)
  const { data, error } = await supabase
    .from('social_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .order('connected_at', { ascending: false })
    .limit(1)
    
  if (error || !data || data.length === 0) {
    if (error) {
      console.error(`[DB DEBUG] Error reading ${platform} connection for user ${userId}:`, error)
    }
    // Fallback to default_user_id if user_id record is not found
    if (userId !== 'default_user_id') {
      const { data: defaultData } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', 'default_user_id')
        .eq('platform', platform)
        .order('connected_at', { ascending: false })
        .limit(1)
      if (defaultData && defaultData.length > 0) {
        return defaultData[0]
      }
    }
    return null
  }
  console.log(`[DB DEBUG] Result for ${platform}: FOUND`)
  return data[0]
}

async function saveConnection(userId: string, platform: string, payload: any) {
  const platformLower = platform.toLowerCase()
  const platformId = payload.platform_id || `${platformLower}_connection`

  let tenantId = '00000000-0000-0000-0000-000000000000'
  try {
    const { data: tenantRow } = await supabase.from('tenants').select('id').limit(1)
    if (tenantRow?.[0]?.id && /^[0-9a-fA-F-]{36}$/.test(tenantRow[0].id)) {
      tenantId = tenantRow[0].id
    }
  } catch (e) {}

  const connectionData: any = {
    user_id: userId,
    platform: platformLower,
    platform_id: platformId,
    name: payload.name || `${platform} Connection`,
    username: payload.username || null,
    avatar: payload.avatar || null,
    access_token: payload.access_token || payload.botToken || null,
    access_secret: payload.access_secret || null,
    profile_data: payload.profile_data || {},
    connected_at: new Date().toISOString()
  }

  // Check if connection rows exist for this user and platform
  const { data: existingRows } = await supabase
    .from('social_connections')
    .select('id, platform_id, profile_data')
    .eq('user_id', userId)
    .eq('platform', platformLower)

  if (existingRows && existingRows.length > 0) {
    // Preserve & merge profile_data across existing rows
    const mergedProfileData = {
      ...(existingRows[0].profile_data || {}),
      ...(payload.profile_data || {})
    }

    const { error: updateErr } = await supabase
      .from('social_connections')
      .update({
        ...connectionData,
        profile_data: mergedProfileData
      })
      .eq('id', existingRows[0].id)

    if (updateErr) {
      console.error(`Error updating ${platformLower} connection:`, updateErr)
      throw new Error(updateErr.message)
    }

    // Deduplicate extra rows for this user/platform if any
    if (existingRows.length > 1) {
      const extraIds = existingRows.slice(1).map(r => r.id)
      await supabase.from('social_connections').delete().in('id', extraIds)
    }
  } else {
    // Attempt upsert/insert for new connection
    const { error: insertErr } = await supabase
      .from('social_connections')
      .upsert(connectionData, { onConflict: 'user_id,platform,platform_id' })

    if (insertErr) {
      console.warn(`Upsert notice for ${platformLower}, performing fallback update:`, insertErr.message)
      await supabase
        .from('social_connections')
        .update(connectionData)
        .eq('user_id', userId)
        .eq('platform', platformLower)
    }
  }
}

export async function deleteConnection(userId: string, platform: string) {
  const { error } = await supabase
    .from('social_connections')
    .delete()
    .eq('user_id', userId)
    .eq('platform', platform)
    
  if (error) {
    console.error(`Error deleting ${platform} connection:`, error)
  }
}

// LinkedIn
export async function getLinkedInConnection(userId: string): Promise<LinkedInProfile | null> {
  const data = await getConnection(userId, 'linkedin')
  if (!data) return null
  return {
    id: data.platform_id,
    name: data.name,
    avatar: data.avatar,
    connectedAt: data.connected_at,
    accessToken: data.access_token,
    personUrn: data.profile_data?.personUrn
  }
}

export async function saveLinkedInConnection(userId: string, profile: LinkedInProfile) {
  await saveConnection(userId, 'linkedin', {
    platform_id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    access_token: profile.accessToken,
    profile_data: { personUrn: profile.personUrn }
  })
}

export async function deleteLinkedInConnection(userId: string) {
  await deleteConnection(userId, 'linkedin')
}

// Facebook
export async function getFacebookConnection(userId: string): Promise<FacebookProfile | null> {
  const data = await getConnection(userId, 'facebook')
  if (!data) return null
  return {
    id: data.platform_id,
    name: data.name,
    avatar: data.avatar,
    connectedAt: data.connected_at,
    accessToken: data.access_token,
    pages: data.profile_data?.pages || []
  }
}

export async function getFacebookConnectionByPageId(pageId: string): Promise<{ userId: string, targetPage: any } | null> {
  // Queries all facebook connections to find the page since webhook doesn't have auth.
  // Because our RLS allows SELECT using anon key, this will work.
  const { data, error } = await supabase
    .from('social_connections')
    .select('user_id, profile_data')
    .eq('platform', 'facebook')
    
  if (error || !data) return null
  
  for (const row of data) {
    const pages = row.profile_data?.pages || []
    const targetPage = pages.find((p: any) => p.id === pageId)
    if (targetPage) {
      return { userId: row.user_id, targetPage }
    }
  }
  
  return null
}

export async function getFacebookPageForInstagramAccount(igAccountId: string): Promise<{ userId: string, targetPage: any } | null> {
  // 1. Find the Instagram connection to get the userId
  const { data: igData, error: igError } = await supabase
    .from('social_connections')
    .select('user_id')
    .eq('platform', 'instagram')
    .eq('platform_id', igAccountId)
    .maybeSingle()

  if (igError || !igData) return null

  const userId = igData.user_id

  // 2. Fetch all Facebook pages for this user
  const { data: fbData, error: fbError } = await supabase
    .from('social_connections')
    .select('profile_data')
    .eq('platform', 'facebook')
    .eq('user_id', userId)
    .maybeSingle()

  if (fbError || !fbData || !fbData.profile_data?.pages) return null

  const pages = fbData.profile_data.pages

  // 3. Find which page is linked to this Instagram Account
  for (const page of pages) {
    if (!page.accessToken) continue
    
    try {
      const igAccountResponse = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.accessToken}`)
      const igAccountData = await igAccountResponse.json()
      
      if (igAccountData.instagram_business_account?.id === igAccountId) {
        return { userId, targetPage: page }
      }
    } catch (e) {
      console.error("Failed to check IG account for page", page.id, e)
    }
  }

  return null
}

export async function getConnectionForWebhook(recipientId: string): Promise<{ userId: string, targetPage: any, isInstagram?: boolean } | null> {
  // 1. Check all Facebook & Instagram connections in social_connections table
  const { data: allConns, error } = await supabase
    .from('social_connections')
    .select('user_id, platform, platform_id, profile_data, access_token, name, avatar')
    .in('platform', ['facebook', 'instagram'])
    .order('connected_at', { ascending: false })

  if (error || !allConns || allConns.length === 0) {
    console.log("No FB/IG connections found in database.")
    return null
  }

  const normalizePage = (page: any, isIg: boolean, igId?: string) => ({
    ...page,
    aiEnabled: page.aiEnabled !== false,
    aiCommentsEnabled: page.aiCommentsEnabled !== false,
    igAccountId: igId || page.igAccountId || page.instagram_business_account?.id || page.instagramId || (isIg ? recipientId : undefined)
  })

  // 2. Try exact match on page ID or IG platform ID
  for (const conn of allConns) {
    if (conn.platform === 'instagram' && conn.platform_id === recipientId) {
      return {
        userId: conn.user_id,
        targetPage: {
          id: conn.platform_id,
          name: conn.name || 'Instagram Account',
          accessToken: conn.access_token,
          aiEnabled: conn.profile_data?.aiEnabled !== false,
          aiCommentsEnabled: conn.profile_data?.aiCommentsEnabled !== false,
          nicheInstructions: conn.profile_data?.dmPrompt || '',
          needsReview: false,
          igAccountId: conn.platform_id
        },
        isInstagram: true
      }
    }

    if (conn.platform === 'facebook') {
      const pages = conn.profile_data?.pages || []
      for (const page of pages) {
        if (page.id === recipientId) {
          return { userId: conn.user_id, targetPage: normalizePage(page, false), isInstagram: false }
        }
        const foundIgId = page.igAccountId || page.instagram_business_account?.id || page.instagramId
        if (foundIgId === recipientId) {
          return { userId: conn.user_id, targetPage: normalizePage(page, true, foundIgId), isInstagram: true }
        }
      }
    }
  }

  // 3. Try checking Graph API for each FB page to see if its attached Instagram account ID matches recipientId
  for (const conn of allConns) {
    if (conn.platform === 'facebook') {
      const pages = conn.profile_data?.pages || []
      for (const page of pages) {
        if (!page.accessToken) continue
        try {
          const igRes = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.accessToken}`)
          if (igRes.ok) {
            const igData = await igRes.json()
            const fetchedIgId = igData.instagram_business_account?.id
            if (fetchedIgId === recipientId) {
              return { userId: conn.user_id, targetPage: normalizePage(page, true, fetchedIgId), isInstagram: true }
            }
          }
        } catch (e) {
          console.error("Error checking IG business account:", e)
        }
      }
    }
  }

  // 4. SMART FALLBACK: In webhook events, Meta often sends an App-Scoped IG ID for recipientId that differs from the Page ID.
  // First check if there is an explicit Instagram connection
  const igConn = allConns.find(c => c.platform === 'instagram')
  if (igConn) {
    console.log(`Fallback match: using Instagram connection ${igConn.platform_id} (${igConn.name}) for recipient ${recipientId}`)
    return {
      userId: igConn.user_id,
      targetPage: {
        id: igConn.platform_id,
        name: igConn.name || 'Instagram Account',
        accessToken: igConn.access_token,
        aiEnabled: true,
        aiCommentsEnabled: true,
        nicheInstructions: igConn.profile_data?.dmPrompt || '',
        needsReview: false,
        igAccountId: igConn.platform_id
      },
      isInstagram: true
    }
  }

  // Otherwise check if any Facebook page has an attached IG account
  const fbConn = allConns.find(c => c.platform === 'facebook')
  if (fbConn) {
    const pages = fbConn.profile_data?.pages || []
    for (const page of pages) {
      const attachedIg = page.igAccountId || page.instagram_business_account?.id || page.instagramId
      if (attachedIg) {
        console.log(`Fallback match: using FB page ${page.id} with IG ${attachedIg} for recipient ${recipientId}`)
        return { userId: fbConn.user_id, targetPage: normalizePage(page, true, attachedIg), isInstagram: true }
      }
    }
    if (pages.length > 0) {
      console.log(`Fallback match: using FB page ${pages[0].id} (${pages[0].name}) for recipient ${recipientId}`)
      return { userId: fbConn.user_id, targetPage: normalizePage(pages[0], true, recipientId), isInstagram: true }
    }
  }

  return null
}

export async function saveFacebookConnection(userId: string, profile: FacebookProfile) {
  await saveConnection(userId, 'facebook', {
    platform_id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    access_token: profile.accessToken,
    profile_data: { pages: profile.pages }
  })
}

export async function deleteFacebookConnection(userId: string) {
  await deleteConnection(userId, 'facebook')
}

// Twitter
export async function getTwitterConnection(userId: string): Promise<TwitterProfile | null> {
  const data = await getConnection(userId, 'twitter')
  if (!data) return null
  return {
    id: data.platform_id,
    name: data.name,
    handle: data.username,
    avatar: data.avatar,
    connectedAt: data.connected_at,
    accessToken: data.access_token,
    accessSecret: data.access_secret
  }
}

export async function saveTwitterConnection(userId: string, profile: TwitterProfile) {
  await saveConnection(userId, 'twitter', {
    platform_id: profile.id,
    name: profile.name,
    username: profile.handle,
    avatar: profile.avatar,
    access_token: profile.accessToken,
    access_secret: profile.accessSecret
  })
}

export async function deleteTwitterConnection(userId: string) {
  await deleteConnection(userId, 'twitter')
}

// Instagram
export async function getInstagramConnection(userId: string): Promise<InstagramProfile | null> {
  const data = await getConnection(userId, 'instagram')
  if (!data) return null
  return {
    id: data.platform_id,
    username: data.username,
    name: data.name,
    accountType: data.profile_data?.accountType,
    connectedAt: data.connected_at,
    accessToken: data.access_token
  }
}

export async function saveInstagramConnection(userId: string, profile: InstagramProfile) {
  await saveConnection(userId, 'instagram', {
    platform_id: profile.id,
    name: profile.name,
    username: profile.username,
    access_token: profile.accessToken,
    profile_data: { accountType: profile.accountType }
  })
}

export async function deleteInstagramConnection(userId: string) {
  await deleteConnection(userId, 'instagram')
}

// YouTube
export async function getYouTubeConnections(userId: string): Promise<YouTubeChannel[]> {
  const { data, error } = await supabase
    .from('social_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'youtube')

  if (error || !data) return []

  return data.map(d => ({
    id: d.platform_id,
    name: d.name,
    handle: d.username,
    avatar: d.avatar,
    connectedAt: d.connected_at,
    accessToken: d.access_token
  }))
}

export async function saveYouTubeConnections(userId: string, channels: YouTubeChannel[]) {
  // In a real app we might delete existing or upsert. Let's just upsert all provided.
  for (const ch of channels) {
    await saveConnection(userId, 'youtube', {
      platform_id: ch.id,
      name: ch.name,
      username: ch.handle,
      avatar: ch.avatar,
      access_token: ch.accessToken
    })
  }
}

// Message Logs
export async function logMessage(userId: string, log: MessageLog) {
  const logPayload: any = {
    user_id: userId,
    page_id: log.pageId || 'tg_chat',
    sender_id: log.senderId || 'tg_sender',
    message: log.message,
    response: log.response,
    needs_review: log.needsReview || false,
    timestamp: log.timestamp || new Date().toISOString()
  }

  if (log.senderName) logPayload.sender_name = log.senderName
  if (log.postCaption) logPayload.post_caption = log.postCaption
  if (log.telegramMessageId || (log as any).messageId) {
    logPayload.telegram_message_id = log.telegramMessageId || (log as any).messageId
  }
  if ((log as any).mediaUrl) logPayload.media_url = (log as any).mediaUrl
  if ((log as any).mediaType) logPayload.media_type = (log as any).mediaType
  if ((log as any).mediaName) logPayload.media_name = (log as any).mediaName
  if ((log as any).reactions) logPayload.reactions = typeof (log as any).reactions === 'string' ? (log as any).reactions : JSON.stringify((log as any).reactions)

  try {
    const { error } = await supabase.from('message_logs').insert(logPayload)
    if (error) {
      console.warn('[logMessage] Notice inserting log, trying fallback:', error.message)
      delete logPayload.timestamp
      logPayload.created_at = new Date().toISOString()
      await supabase.from('message_logs').insert(logPayload)
    }
  } catch (err) {
    console.error('Error in logMessage:', err)
  }
}

// Threads
export async function getThreadsConnection(userId: string): Promise<ThreadsProfile | null> {
  const data = await getConnection(userId, 'threads')
  if (!data) return null
  return {
    id: data.platform_id,
    username: data.username,
    name: data.name,
    avatar: data.avatar,
    connectedAt: data.connected_at,
    accessToken: data.access_token
  }
}

export async function saveThreadsConnection(userId: string, profile: ThreadsProfile) {
  await saveConnection(userId, 'threads', {
    platform_id: profile.id,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar,
    access_token: profile.accessToken
  })
}

export async function deleteThreadsConnection(userId: string) {
  await deleteConnection(userId, 'threads')
}

// Pinterest
export async function getPinterestConnection(userId: string): Promise<PinterestProfile | null> {
  const data = await getConnection(userId, 'pinterest')
  if (!data) return null
  return {
    id: data.platform_id,
    username: data.username,
    name: data.name,
    avatar: data.avatar,
    connectedAt: data.connected_at,
    accessToken: data.access_token
  }
}

export async function savePinterestConnection(userId: string, profile: PinterestProfile) {
  await saveConnection(userId, 'pinterest', {
    platform_id: profile.id,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar,
    access_token: profile.accessToken
  })
}

export async function deletePinterestConnection(userId: string) {
  await deleteConnection(userId, 'pinterest')
}

// WhatsApp
export async function getWhatsAppConnection(userId: string): Promise<WhatsAppProfile | null> {
  const data = await getConnection(userId, 'whatsapp')
  if (!data) return null
  return {
    id: data.platform_id,
    phoneNumberId: data.username, // mapping username to phone number id
    name: data.name,
    connectedAt: data.connected_at,
    accessToken: data.access_token,
    wabaId: data.profile_data?.wabaId
  }
}

export async function saveWhatsAppConnection(userId: string, profile: WhatsAppProfile) {
  await saveConnection(userId, 'whatsapp', {
    platform_id: profile.id,
    name: profile.name,
    username: profile.phoneNumberId,
    access_token: profile.accessToken,
    profile_data: { wabaId: profile.wabaId }
  })
}

export async function deleteWhatsAppConnection(userId: string) {
  await deleteConnection(userId, 'whatsapp')
}

// Bluesky
export async function getBlueskyConnection(userId: string): Promise<BlueskyProfile | null> {
  const data = await getConnection(userId, 'bluesky')
  if (!data) return null
  return {
    id: data.platform_id,
    handle: data.username,
    name: data.name,
    avatar: data.avatar,
    connectedAt: data.connected_at,
    accessToken: data.access_token
  }
}

export async function saveBlueskyConnection(userId: string, profile: BlueskyProfile) {
  await saveConnection(userId, 'bluesky', {
    platform_id: profile.id,
    name: profile.name,
    username: profile.handle,
    avatar: profile.avatar,
    access_token: profile.accessToken
  })
}

export async function deleteBlueskyConnection(userId: string) {
  await deleteConnection(userId, 'bluesky')
}

// TikTok
export async function getTikTokConnection(userId: string): Promise<TikTokProfile | null> {
  const data = await getConnection(userId, 'tiktok')
  if (!data) return null
  return {
    id: data.platform_id,
    username: data.username,
    name: data.name,
    avatar: data.avatar,
    connectedAt: data.connected_at,
    accessToken: data.access_token
  }
}

export async function saveTikTokConnection(userId: string, profile: TikTokProfile) {
  await saveConnection(userId, 'tiktok', {
    platform_id: profile.id,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar,
    access_token: profile.accessToken
  })
}

export async function deleteTikTokConnection(userId: string) {
  await deleteConnection(userId, 'tiktok')
}

// Slack
export async function getSlackConnection(userId: string): Promise<SlackProfile | null> {
  let data = await getConnection(userId, 'slack')
  if (!data) {
    try {
      const { data: anyConn } = await supabase
        .from('social_connections')
        .select('*')
        .eq('platform', 'slack')
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      data = anyConn
    } catch (eFallback) {}
  }
  if (!data) return null

  const channelsMap = new Map<string, string>()

  // 1. Saved channels in profile_data
  if (Array.isArray(data.profile_data?.channels)) {
    data.profile_data.channels.forEach((ch: any) => {
      const id = typeof ch === 'string' ? ch : ch.id
      const name = typeof ch === 'string' ? ch : (ch.name || ch.title || id)
      if (id) {
        channelsMap.set(String(id), String(name))
      }
    })
  }

  // 2. Discover channels / chats from message_logs
  try {
    const { data: logs } = await supabase
      .from('message_logs')
      .select('page_id, sender_name')
      .eq('platform', 'Slack')
      .limit(200)

    if (logs) {
      logs.forEach(l => {
        if (l.page_id && l.page_id !== 'Slack') {
          const cleanId = String(l.page_id).replace(/^(slack:channel:|slack:dm:|slack:)/i, '').trim()
          if (cleanId && !channelsMap.has(cleanId)) {
            channelsMap.set(cleanId, l.sender_name || `#channel-${cleanId}`)
          }
        }
      })
    }
  } catch (eLogs) {}

  const channels = Array.from(channelsMap.entries()).map(([id, name]) => ({
    id,
    name: name.startsWith('#') ? name : `#${name}`
  }))

  return {
    id: data.platform_id,
    name: data.name,
    teamId: data.profile_data?.teamId || data.platform_id,
    channels,
    avatar: data.avatar || '',
    connectedAt: data.connected_at,
    accessToken: data.access_token
  }
}

export async function saveSlackConnection(userId: string, profile: SlackProfile) {
  await saveConnection(userId, 'slack', {
    platform_id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    access_token: profile.accessToken,
    profile_data: {
      teamId: profile.teamId,
      channels: profile.channels
    }
  })
}

export async function deleteSlackConnection(userId: string) {
  await deleteConnection(userId, 'slack')
}

export async function getSlackConnectionForWebhook(teamId?: string) {
  try {
    let data: any = null
    if (teamId) {
      const { data: matched } = await supabase
        .from('social_connections')
        .select('*')
        .eq('platform', 'slack')
        .or(`platform_id.eq.${teamId},profile_data->>teamId.eq.${teamId}`)
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      data = matched
    }

    if (!data) {
      const { data: latest } = await supabase
        .from('social_connections')
        .select('*')
        .eq('platform', 'slack')
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      data = latest
    }

    if (!data) return null

    return {
      userId: data.user_id,
      connection: {
        id: data.platform_id,
        name: data.name,
        teamId: data.profile_data?.teamId || data.platform_id,
        botToken: data.access_token || data.profile_data?.botToken,
        channels: data.profile_data?.channels || [{ id: 'general', name: '#general' }],
        avatar: data.avatar || '',
        connectedAt: data.connected_at,
        aiSettings: data.profile_data?.aiSettings || {
          aiEnabled: true,
          dmPrompt: 'You are a helpful AI assistant responding to direct messages on Slack.',
          channelPrompt: 'You are a professional AI assistant responding to channel posts on Slack.',
          logToInbox: true
        }
      }
    }
  } catch (e) {
    return null
  }
}

// Telegram
export async function getTelegramConnection(userId: string): Promise<TelegramProfile | null> {
  const data = await getConnection(userId, 'telegram')
  if (!data) return null

  const botToken = data.profile_data?.botToken || data.access_token
  const dynamicMap = new Map<string, string>()

  // 1. Existing channels saved in connection profile_data
  if (Array.isArray(data.profile_data?.channels)) {
    data.profile_data.channels.forEach((ch: any) => {
      const id = typeof ch === 'string' ? ch : ch.id
      const name = typeof ch === 'string' ? ch : (ch.name || ch.title || id)
      if (id) dynamicMap.set(String(id), String(name))
    })
  }

  // 2. Dynamically query Supabase message_logs for all channels / groups where messages exist
  try {
    const { data: logs } = await supabase
      .from('message_logs')
      .select('page_id, post_caption')
      .eq('platform', 'Telegram')
      .order('id', { ascending: false })
      .limit(300)

    if (logs) {
      logs.forEach(l => {
        if (l.page_id && l.page_id !== 'Telegram') {
          const cleanId = String(l.page_id).replace(/^(tg-channel-|tg-conv-|tg:channel:|tg:dm:|tg:)/i, '').replace(/^@-/g, '-').trim()
          if (cleanId) {
            const formattedKey = cleanId.startsWith('-') || cleanId.startsWith('@') ? cleanId : `@${cleanId}`
            const existingTitle = dynamicMap.get(cleanId) || dynamicMap.get(formattedKey) || dynamicMap.get(`@${cleanId}`)
            const isGeneric = !existingTitle || existingTitle.startsWith('Telegram Chat') || existingTitle.startsWith('Channel (')

            if (l.post_caption && l.post_caption !== 'Telegram Channel / Chat' && (isGeneric || !existingTitle)) {
              dynamicMap.set(formattedKey, l.post_caption)
            } else if (!existingTitle) {
              dynamicMap.set(formattedKey, `Telegram Chat (${cleanId})`)
            }
          }
        }
      })
    }
  } catch (eLogs) {}

  const channels = Array.from(dynamicMap.entries()).map(([id, name]) => ({
    id: id.startsWith('-') || id.startsWith('@') ? id : `@${id}`,
    name
  }))

  return {
    id: data.platform_id,
    username: data.username || data.name,
    name: data.name,
    botToken: botToken,
    channels: channels,
    avatar: data.avatar || '',
    connectedAt: data.connected_at
  }
}

export async function saveTelegramConnection(userId: string, profile: TelegramProfile) {
  const existing = await getConnection(userId, 'telegram')
  const existingProfileData = existing?.profile_data || {}

  await saveConnection(userId, 'telegram', {
    platform_id: profile.id,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar,
    access_token: profile.botToken,
    profile_data: {
      ...existingProfileData,
      botToken: profile.botToken,
      channels: profile.channels
    }
  })
}

export async function deleteTelegramConnection(userId: string) {
  await deleteConnection(userId, 'telegram')
}

export async function getTelegramConnectionForWebhook(targetChatId?: string) {
  try {
    const { data: connections } = await supabase
      .from('social_connections')
      .select('*')
      .eq('platform', 'telegram')
      .order('connected_at', { ascending: false })

    if (!connections || connections.length === 0) return null

    let matchedRow = connections[0]

    if (targetChatId) {
      const cleanTarget = String(targetChatId).replace(/^(tg-channel-|tg-conv-|tg:channel:|tg:dm:|tg:)/i, '').replace(/^@-/g, '-').trim()
      const found = connections.find(c => {
        const rawCh = c.profile_data?.channels || []
        return rawCh.some((ch: any) => {
          const chId = typeof ch === 'string' ? ch : (ch.id || ch.username || '')
          const cleanCh = String(chId).replace(/^(tg-channel-|tg-conv-|tg:channel:|tg:dm:|tg:)/i, '').replace(/^@-/g, '-').trim()
          return cleanCh === cleanTarget || cleanCh.includes(cleanTarget) || cleanTarget.includes(cleanCh)
        })
      })
      if (found) {
        matchedRow = found
      }
    }

    // Merge botToken, channels, and aiSettings across all telegram rows if missing
    let botToken = matchedRow.profile_data?.botToken || matchedRow.access_token
    let channels = matchedRow.profile_data?.channels || []
    let aiSettings = matchedRow.profile_data?.aiSettings

    if (!botToken || !aiSettings || !channels.length) {
      for (const c of connections) {
        if (!botToken && (c.profile_data?.botToken || c.access_token)) {
          botToken = c.profile_data?.botToken || c.access_token
        }
        if (!aiSettings && c.profile_data?.aiSettings) {
          aiSettings = c.profile_data?.aiSettings
        }
        if (!channels.length && Array.isArray(c.profile_data?.channels)) {
          channels = c.profile_data.channels
        }
      }
    }

    return {
      userId: matchedRow.user_id,
      connection: {
        id: matchedRow.platform_id,
        username: matchedRow.username || matchedRow.name,
        name: matchedRow.name,
        botToken: botToken || process.env.TELEGRAM_BOT_TOKEN || '',
        channels,
        avatar: matchedRow.avatar || '',
        connectedAt: matchedRow.connected_at,
        aiSettings: aiSettings || {
          aiEnabled: true,
          aiCommentsEnabled: true,
          dmPrompt: 'You are a helpful AI assistant responding on Telegram.',
          channelPrompt: 'You are a helpful AI assistant responding on Telegram group chats and channels.'
        }
      }
    }
  } catch (e) {
    return null
  }
}

export async function autoRegisterTelegramChannel(
  userId: string,
  chatId: string | number,
  chatTitle: string,
  chatUsername?: string
) {
  try {
    const conn = await getTelegramConnection(userId)
    if (!conn) return

    const cleanChatId = String(chatId)
    const existingChannels = conn.channels || []

    const alreadyExists = existingChannels.some((ch: any) => {
      const id = typeof ch === 'string' ? ch : ch.id
      return String(id) === cleanChatId || (chatUsername && String(id) === `@${chatUsername}`)
    })

    if (!alreadyExists) {
      const newChannel = {
        id: cleanChatId.startsWith('-') || cleanChatId.startsWith('@') ? cleanChatId : `@${cleanChatId}`,
        name: chatTitle || `Telegram Channel (${cleanChatId})`,
        title: chatTitle,
        username: chatUsername ? `@${chatUsername}` : cleanChatId,
        type: 'channel'
      }
      const updatedChannels = [...existingChannels, newChannel]
      await saveTelegramConnection(userId, {
        ...conn,
        channels: updatedChannels
      })
      console.log('[autoRegisterTelegramChannel] Dynamically registered Telegram channel:', newChannel)
    }
  } catch (e) {
    console.error('[autoRegisterTelegramChannel] Error:', e)
  }
}


// Discord
export async function getDiscordConnection(userId: string): Promise<DiscordProfile | null> {
  const data = await getConnection(userId, 'discord')
  const botToken = data?.profile_data?.botToken || data?.access_token || process.env.DISCORD_BOT_TOKEN

  let serverName = data?.name || "binjwaitsolution's server"
  let guildId = data?.profile_data?.guildId || data?.platform_id || '1531201717885206580'
  let channels = data?.profile_data?.channels || []

  if (botToken && (!channels || channels.length === 0)) {
    try {
      const gRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { 'Authorization': `Bot ${botToken}` }
      })
      if (gRes.ok) {
        const guilds = await gRes.json()
        if (Array.isArray(guilds) && guilds.length > 0) {
          const targetGuild = guilds[0]
          serverName = targetGuild.name || serverName
          guildId = targetGuild.id || guildId

          const cRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
            headers: { 'Authorization': `Bot ${botToken}` }
          })
          if (cRes.ok) {
            const cList = await cRes.json()
            if (Array.isArray(cList)) {
              channels = cList
                .filter((c: any) => c.type === 0)
                .map((c: any) => ({ id: String(c.id), name: `#${c.name}` }))
            }
          }
        }
      }
    } catch (e) {}
  }

  if (!channels || channels.length === 0) {
    channels = [
      { id: '1531201718371483780', name: '#general' },
      { id: '1532099282495340794', name: '#test' }
    ]
  }

  return {
    id: guildId,
    name: serverName,
    guildId: guildId,
    channels: channels,
    avatar: data?.avatar || '',
    connectedAt: data?.connected_at || new Date().toISOString(),
    accessToken: data?.access_token || botToken,
    botToken: botToken
  }
}

export async function saveDiscordConnection(userId: string, profile: DiscordProfile) {
  await saveConnection(userId, 'discord', {
    platform_id: profile.id || profile.guildId,
    name: profile.name,
    avatar: profile.avatar,
    access_token: profile.accessToken || profile.botToken,
    profile_data: {
      guildId: profile.guildId,
      channels: profile.channels,
      botToken: profile.botToken
    }
  })
}

export async function deleteDiscordConnection(userId: string) {
  await deleteConnection(userId, 'discord')
}

export async function getDiscordConnectionForWebhook(guildId?: string) {
  try {
    let data: any = null
    if (guildId) {
      const { data: matched } = await supabase
        .from('social_connections')
        .select('*')
        .eq('platform', 'discord')
        .or(`platform_id.eq.${guildId},profile_data->>guildId.eq.${guildId}`)
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      data = matched
    }

    if (!data) {
      const { data: latest } = await supabase
        .from('social_connections')
        .select('*')
        .eq('platform', 'discord')
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      data = latest
    }

    const botToken = data?.access_token || data?.profile_data?.botToken || process.env.DISCORD_BOT_TOKEN

    return {
      userId: data?.user_id || 'default_user_id',
      connection: {
        id: data?.platform_id || '1531201717885206580',
        name: data?.name || "binjwaitsolution's server",
        guildId: data?.profile_data?.guildId || data?.platform_id || '1531201717885206580',
        botToken: botToken,
        channels: data?.profile_data?.channels || [
          { id: '1531201718371483780', name: '#general' },
          { id: '1532099282495340794', name: '#test' }
        ],
        avatar: data?.avatar || '',
        connectedAt: data?.connected_at || new Date().toISOString(),
        aiSettings: data?.profile_data?.aiSettings || {
          aiEnabled: true,
          dmPrompt: 'You are the official AI assistant for Binjwa IT Solutions on Discord.',
          channelPrompt: 'You are the official AI assistant for Binjwa IT Solutions responding to Discord messages.',
          logToInbox: true
        }
      }
    }
  } catch (e) {
    return null
  }
}

// Canva
export async function getCanvaConnection(userId: string): Promise<CanvaProfile | null> {
  const data = await getConnection(userId, 'canva')
  if (!data) return null
  return {
    id: data.platform_id,
    name: data.name,
    workspaceId: data.profile_data?.workspaceId || data.platform_id,
    avatar: data.avatar || '',
    connectedAt: data.connected_at,
    accessToken: data.access_token
  }
}

export async function saveCanvaConnection(userId: string, profile: CanvaProfile) {
  await saveConnection(userId, 'canva', {
    platform_id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    access_token: profile.accessToken,
    profile_data: {
      workspaceId: profile.workspaceId
    }
  })
}

export async function deleteCanvaConnection(userId: string) {
  await deleteConnection(userId, 'canva')
}

// Medium
export async function getMediumConnection(userId: string): Promise<MediumProfile | null> {
  const data = await getConnection(userId, 'medium')
  if (!data) return null
  return {
    id: data.platform_id,
    name: data.name,
    username: data.username || data.name,
    publications: data.profile_data?.publications || [{ id: 'primary', name: 'Primary Publication' }],
    avatar: data.avatar || '',
    connectedAt: data.connected_at,
    accessToken: data.access_token
  }
}

export async function saveMediumConnection(userId: string, profile: MediumProfile) {
  await saveConnection(userId, 'medium', {
    platform_id: profile.id,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar,
    access_token: profile.accessToken,
    profile_data: {
      publications: profile.publications
    }
  })
}

export async function deleteMediumConnection(userId: string) {
  await deleteConnection(userId, 'medium')
}

// Reddit
export async function getRedditConnection(userId: string): Promise<RedditProfile | null> {
  const data = await getConnection(userId, 'reddit')
  if (!data) return null
  return {
    id: data.platform_id,
    username: data.username || data.name,
    name: data.name,
    subreddits: data.profile_data?.subreddits || [{ id: 'u_' + (data.username || 'user'), name: 'u/' + (data.username || 'user') }],
    avatar: data.avatar || '',
    connectedAt: data.connected_at,
    accessToken: data.access_token
  }
}

export async function saveRedditConnection(userId: string, profile: RedditProfile) {
  await saveConnection(userId, 'reddit', {
    platform_id: profile.id,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar,
    access_token: profile.accessToken,
    profile_data: {
      subreddits: profile.subreddits
    }
  })
}

export async function deleteRedditConnection(userId: string) {
  await deleteConnection(userId, 'reddit')
}

// Twitch
export async function getTwitchConnection(userId: string): Promise<TwitchProfile | null> {
  const data = await getConnection(userId, 'twitch')
  if (!data) return null
  return {
    id: data.platform_id,
    username: data.username || data.name,
    name: data.name,
    avatar: data.avatar || '',
    connectedAt: data.connected_at,
    accessToken: data.access_token
  }
}

export async function saveTwitchConnection(userId: string, profile: TwitchProfile) {
  await saveConnection(userId, 'twitch', {
    platform_id: profile.id,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar,
    access_token: profile.accessToken
  })
}

export async function deleteTwitchConnection(userId: string) {
  await deleteConnection(userId, 'twitch')
}

// Kick
export async function getKickConnection(userId: string): Promise<KickProfile | null> {
  const data = await getConnection(userId, 'kick')
  if (!data) return null
  return {
    id: data.platform_id,
    username: data.username || data.name,
    name: data.name,
    avatar: data.avatar || '',
    connectedAt: data.connected_at,
    accessToken: data.access_token
  }
}

export async function saveKickConnection(userId: string, profile: KickProfile) {
  await saveConnection(userId, 'kick', {
    platform_id: profile.id,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar,
    access_token: profile.accessToken
  })
}

export async function deleteKickConnection(userId: string) {
  await deleteConnection(userId, 'kick')
}

export async function getTelegramConversationHistory(chatId: string, limit = 10): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  try {
    const cleanId = String(chatId).replace(/^(tg-channel-|tg-conv-|tg:channel:|tg:dm:|tg:)/i, '').replace(/^@-/g, '-').trim()
    let logs: any[] | null = null

    const { data: d1, error: e1 } = await supabase
      .from('message_logs')
      .select('message, response, timestamp, sender_name')
      .or(`page_id.eq.${chatId},page_id.eq.${cleanId},sender_id.ilike.%${cleanId}%`)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (e1 || !d1 || d1.length === 0) {
      const { data: d2 } = await supabase
        .from('message_logs')
        .select('message, response, created_at, sender_name')
        .or(`page_id.eq.${chatId},page_id.eq.${cleanId},sender_id.ilike.%${cleanId}%`)
        .order('created_at', { ascending: false })
        .limit(limit)
      logs = d2 || []
    } else {
      logs = d1
    }

    if (!logs || logs.length === 0) return []

    const history: Array<{ role: 'user' | 'assistant'; content: string }> = []
    const reversed = [...logs].reverse()

    for (const item of reversed) {
      const speakerName = item.sender_name || 'Group Member'
      if (item.message) {
        history.push({ role: 'user', content: `[User ${speakerName}]: ${item.message}` })
      }
      if (item.response && item.response !== item.message) {
        history.push({ role: 'assistant', content: `[AI Response to ${speakerName}]: ${item.response}` })
      }
    }
    return history
  } catch (e) {
    return []
  }
}

export async function getSlackConversationHistory(channelId: string, limit = 10): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  try {
    const cleanId = String(channelId).replace(/^(slack-channel-|slack-conv-|slack:channel:|slack:dm:|slack:)/i, '').trim()
    let logs: any[] | null = null

    const { data: d1, error: e1 } = await supabase
      .from('message_logs')
      .select('message, response, timestamp, sender_name')
      .or(`page_id.eq.${channelId},page_id.eq.${cleanId},sender_id.ilike.%${cleanId}%`)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (e1 || !d1 || d1.length === 0) {
      const { data: d2 } = await supabase
        .from('message_logs')
        .select('message, response, created_at, sender_name')
        .or(`page_id.eq.${channelId},page_id.eq.${cleanId},sender_id.ilike.%${cleanId}%`)
        .order('created_at', { ascending: false })
        .limit(limit)
      logs = d2 || []
    } else {
      logs = d1
    }

    if (!logs || logs.length === 0) return []

    const history: Array<{ role: 'user' | 'assistant'; content: string }> = []
    const reversed = [...logs].reverse()

    for (const item of reversed) {
      const speakerName = item.sender_name || 'Slack User'
      if (item.message) {
        history.push({ role: 'user', content: `[User ${speakerName}]: ${item.message}` })
      }
      if (item.response && item.response !== item.message) {
        history.push({ role: 'assistant', content: `[AI Response to ${speakerName}]: ${item.response}` })
      }
    }
    return history
  } catch (e) {
    return []
  }
}

export async function getDiscordConversationHistory(channelId: string, limit = 10): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  try {
    const cleanId = String(channelId).replace(/^(discord-channel-|discord-conv-|discord:channel:|discord:dm:|discord:)/i, '').trim()
    let logs: any[] | null = null

    const { data: d1, error: e1 } = await supabase
      .from('message_logs')
      .select('message, response, timestamp, sender_name')
      .or(`page_id.eq.${channelId},page_id.eq.${cleanId},sender_id.ilike.%${cleanId}%`)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (e1 || !d1 || d1.length === 0) {
      const { data: d2 } = await supabase
        .from('message_logs')
        .select('message, response, created_at, sender_name')
        .or(`page_id.eq.${channelId},page_id.eq.${cleanId},sender_id.ilike.%${cleanId}%`)
        .order('created_at', { ascending: false })
        .limit(limit)
      logs = d2 || []
    } else {
      logs = d1
    }

    if (!logs || logs.length === 0) return []

    const history: Array<{ role: 'user' | 'assistant'; content: string }> = []
    const reversed = [...logs].reverse()

    for (const item of reversed) {
      const speakerName = item.sender_name || 'Discord User'
      if (item.message) {
        history.push({ role: 'user', content: `[User ${speakerName}]: ${item.message}` })
      }
      if (item.response && item.response !== item.message) {
        history.push({ role: 'assistant', content: `[AI Response to ${speakerName}]: ${item.response}` })
      }
    }
    return history
  } catch (e) {
    return []
  }
}
