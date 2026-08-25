import fs from 'fs'
import path from 'path'
import { supabase } from './supabase'
import { getTelegramConnection, getSlackConnection } from './db'

export interface InboxMessage {
  id: string
  sender: 'customer' | 'ai' | 'admin'
  senderName?: string
  text: string
  timestamp: string
  isEdited?: boolean
  mediaUrl?: string
  mediaType?: 'image' | 'video' | 'document' | 'audio'
  mediaName?: string
  telegramMessageId?: string | number
  reactions?: string
}

export interface InboxConversation {
  id: string
  personName: string
  personHandle: string
  personAvatar: string
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'Twitter' | 'YouTube' | 'Threads' | 'Pinterest' | 'WhatsApp' | 'Bluesky' | 'TikTok' | string
  type: 'dm' | 'comment'
  postCaption?: string
  aiAutoReplyActive: boolean
  needsReview: boolean
  unreadCount: number
  updatedAt: string
  messages: InboxMessage[]
}

const INBOX_CACHE_PATH = path.join(process.cwd(), '.binjwa_inbox_cache.json')
const TMP_INBOX_PATH = '/tmp/.binjwa_inbox_cache.json'

export function normalizeTelegramChatId(rawId: string): string {
  return String(rawId || '')
    .replace(/^(tg-channel-|tg-conv-|tg:channel:|tg:dm:|tg:)/i, '')
    .replace(/^@-/g, '-')
    .trim()
}

async function fetchRealMetaConversations(userId: string): Promise<InboxConversation[]> {
  const metaConvs: InboxConversation[] = []
  try {
    const { data: userConns } = await supabase
      .from('social_connections')
      .select('platform, platform_id, profile_data, access_token, name, username, avatar')
      .eq('user_id', userId)
      .in('platform', [
        'facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'threads',
        'pinterest', 'whatsapp', 'bluesky', 'tiktok', 'slack', 'telegram',
        'discord', 'canva', 'medium', 'reddit', 'twitch', 'kick'
      ])

    let connections = userConns || []
    if (connections.length === 0 && userId !== 'default_user_id') {
      const { data: defConns } = await supabase
        .from('social_connections')
        .select('platform, platform_id, profile_data, access_token, name, username, avatar')
        .eq('user_id', 'default_user_id')
        .in('platform', [
          'facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'threads',
          'pinterest', 'whatsapp', 'bluesky', 'tiktok', 'slack', 'telegram',
          'discord', 'canva', 'medium', 'reddit', 'twitch', 'kick'
        ])
      connections = defConns || []
    }

    if (!connections || connections.length === 0) return metaConvs

    for (const conn of connections) {
      if (conn.platform === 'telegram') {
        const botName = conn.name || conn.username || 'Telegram Bot'
        const rawChannels = Array.isArray(conn.profile_data?.channels) ? conn.profile_data.channels : []
        for (const ch of rawChannels) {
          const chName = typeof ch === 'string' ? ch : (ch.name || ch.title || `${botName} Channel`)
          const chId = typeof ch === 'string' ? ch : (ch.id || ch.username || '')
          if (!chId) continue
          const cleanId = normalizeTelegramChatId(String(chId))
          const threadId = `tg-channel-${cleanId}`

          if (!metaConvs.some(exist => exist.id === threadId)) {
            metaConvs.push({
              id: threadId,
              personName: chName,
              personHandle: cleanId.startsWith('-') ? `@${cleanId}` : (cleanId.startsWith('@') ? cleanId : `@${cleanId}`),
              personAvatar: conn.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chName)}&background=0088cc&color=fff&size=150`,
              platform: 'Telegram',
              type: 'comment',
              postCaption: 'Connected Telegram Channel / Group',
              aiAutoReplyActive: true,
              needsReview: false,
              unreadCount: 0,
              updatedAt: new Date().toISOString(),
              messages: [
                {
                  id: `tg-init-${cleanId}`,
                  sender: 'admin',
                  text: `Telegram channel "${chName}" connected. All member posts, messages, photos, videos, and attachments will appear here live!`,
                  timestamp: 'Just now'
                }
              ]
            })
          }
        }
      }

      if (conn.platform === 'discord') {
        const serverName = conn.name || "binjwaitsolution's server"
        const botToken = conn.access_token || conn.profile_data?.botToken || process.env.DISCORD_BOT_TOKEN
        const rawChannels = Array.isArray(conn.profile_data?.channels) ? conn.profile_data.channels : [
          { id: '1531201718371483780', name: '#general' },
          { id: '1532099282495340794', name: '#test' }
        ]

        for (const ch of rawChannels) {
          const chName = typeof ch === 'string' ? ch : (ch.name || `#${ch.id}`)
          const chId = typeof ch === 'string' ? ch : String(ch.id)
          if (!chId) continue

          const threadId = `discord-channel-${chId}`
          let messages: InboxMessage[] = []

          if (botToken) {
            try {
              const mRes = await fetch(`https://discord.com/api/v10/channels/${chId}/messages?limit=15`, {
                headers: { 'Authorization': `Bot ${botToken}` }
              })
              if (mRes.ok) {
                const mData = await mRes.json()
                if (Array.isArray(mData)) {
                  const reversed = [...mData].reverse()
                  messages = reversed.map((m: any) => ({
                    id: `discord-${m.id}`,
                    sender: m.author?.bot ? 'ai' : 'customer',
                    senderName: m.author?.global_name || m.author?.username || 'Discord User',
                    text: m.content || '',
                    timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
                  }))
                }
              }
            } catch (eDiscord) {}
          }

          if (messages.length === 0) {
            messages = [{
              id: `discord-init-${chId}`,
              sender: 'admin',
              text: `Discord channel "${chName}" connected. Real-time messages will sync here automatically!`,
              timestamp: 'Just now'
            }]
          }

          if (!metaConvs.some(exist => exist.id === threadId)) {
            metaConvs.push({
              id: threadId,
              personName: chName,
              personHandle: `@discord_${chId}`,
              personAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chName)}&background=5865F2&color=fff&size=150`,
              platform: 'Discord',
              type: 'comment',
              postCaption: `Connected Discord Channel (${serverName})`,
              aiAutoReplyActive: true,
              needsReview: false,
              unreadCount: 0,
              updatedAt: new Date().toISOString(),
              messages
            })
          }
        }
      }

      if (conn.platform === 'facebook' && conn.profile_data?.pages) {
        for (const page of conn.profile_data.pages) {
          if (!page.id || !page.accessToken) continue
          try {
            // Fetch real DMs from Facebook Graph API with real user profile pictures
            const res = await fetch(
              `https://graph.facebook.com/v19.0/${page.id}/conversations?fields=participants{id,name,email,picture},messages{message,created_time,from},updated_time&limit=15&access_token=${page.accessToken}`
            )
            if (res.ok) {
              const json = await res.json()
              const data = json.data || []
              for (const item of data) {
                const participants = item.participants?.data || []
                const customer = participants.find((p: any) => p.id !== page.id) || participants[0] || { name: 'Customer', id: 'unknown' }
                const msgsData = (item.messages?.data || []).reverse()
                const messages: InboxMessage[] = msgsData.map((m: any, i: number) => ({
                  id: m.id || `fb-m-${i}`,
                  sender: m.from?.id === page.id ? 'admin' : 'customer',
                  text: m.message || '',
                  timestamp: m.created_time ? new Date(m.created_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
                }))

                const personName = customer.name || 'Facebook User'
                const personAvatar =
                  customer.picture?.data?.url ||
                  customer.profile_pic ||
                  `https://graph.facebook.com/v19.0/${customer.id}/picture?type=normal` ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(personName)}&background=random&color=fff&size=150`

                metaConvs.push({
                  id: `meta-dm-${item.id}`,
                  personName,
                  personHandle: `@user_${String(customer.id).slice(0, 6)}`,
                  personAvatar,
                  platform: 'Facebook',
                  type: 'dm',
                  aiAutoReplyActive: page.aiEnabled !== false,
                  needsReview: false,
                  unreadCount: 0,
                  updatedAt: item.updated_time || new Date().toISOString(),
                  messages: messages.length > 0 ? messages : [{ id: 'm0', sender: 'customer', text: 'Conversation started', timestamp: 'Recently' }]
                })
              }
            }

            // Fetch real Feed Comments from Facebook Graph API with real commenter profile pictures
            const commentsRes = await fetch(
              `https://graph.facebook.com/v19.0/${page.id}/feed?fields=id,message,comments{from{id,name,picture},message,created_time}&limit=10&access_token=${page.accessToken}`
            )
            if (commentsRes.ok) {
              const commentsJson = await commentsRes.json()
              const posts = commentsJson.data || []
              for (const post of posts) {
                const comments = post.comments?.data || []
                for (const comment of comments) {
                  if (comment.from?.id === page.id) continue
                  const personName = comment.from?.name || 'Facebook Commenter'
                  const personAvatar =
                    comment.from?.picture?.data?.url ||
                    `https://graph.facebook.com/v19.0/${comment.from?.id || '0'}/picture?type=normal` ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(personName)}&background=random&color=fff&size=150`

                  metaConvs.push({
                    id: `meta-comment-${comment.id}`,
                    personName,
                    personHandle: `@user_${String(comment.from?.id || 'id').slice(0, 6)}`,
                    personAvatar,
                    platform: 'Facebook',
                    type: 'comment',
                    postCaption: post.message ? post.message.slice(0, 60) : 'Facebook Post',
                    aiAutoReplyActive: !!page.aiCommentsEnabled,
                    needsReview: false,
                    unreadCount: 0,
                    updatedAt: comment.created_time || new Date().toISOString(),
                    messages: [
                      {
                        id: `comment-msg-${comment.id}`,
                        sender: 'customer',
                        text: comment.message || '',
                        timestamp: comment.created_time ? new Date(comment.created_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
                      }
                    ]
                  })
                }
              }
            }

            // If an Instagram Business Account is attached to this page, fetch IG DMs / Comments if available
            try {
              let igId = page.igAccountId || page.instagram_business_account?.id || page.instagramId
              if (!igId) {
                const igRes = await fetch(
                  `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.accessToken}`
                )
                if (igRes.ok) {
                  const igJson = await igRes.json()
                  igId = igJson.instagram_business_account?.id
                }
              }

              if (igId) {
                // Fetch Instagram DMs (conversations) with real profile pictures
                try {
                  const igDmsRes = await fetch(
                    `https://graph.facebook.com/v19.0/${igId}/conversations?platform=instagram&fields=id,participants{id,username,name},messages{id,message,from,created_time}&limit=15&access_token=${page.accessToken}`
                  )
                  if (igDmsRes.ok) {
                    const igDmsJson = await igDmsRes.json()
                    const igConvs = igDmsJson.data || []
                    for (const item of igConvs) {
                      const participants = item.participants?.data || []
                      const customer = participants.find((p: any) => p.id !== igId) || participants[0] || { name: 'Instagram User', id: 'user' }
                      const msgsData = item.messages?.data || []
                      const messages = msgsData.reverse().map((m: any, mIdx: number) => ({
                        id: m.id || `msg-${item.id}-${mIdx}`,
                        sender: m.from?.id === igId ? 'admin' : 'customer',
                        text: m.message || '',
                        timestamp: m.created_time ? new Date(m.created_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
                      }))

                      const personName = customer.username || customer.name || 'Instagram User'
                      const personAvatar =
                        customer.profile_pic ||
                        customer.profile_picture_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(personName)}&background=random&color=fff&size=150`

                      metaConvs.push({
                        id: `meta-ig-dm-${item.id}`,
                        personName,
                        personHandle: `@${customer.username || String(customer.id).slice(0, 8)}`,
                        personAvatar,
                        platform: 'Instagram',
                        type: 'dm',
                        aiAutoReplyActive: page.aiEnabled !== false,
                        needsReview: false,
                        unreadCount: 0,
                        updatedAt: item.updated_time || new Date().toISOString(),
                        messages: messages.length > 0 ? messages : [{ id: 'm0', sender: 'customer', text: 'Conversation started', timestamp: 'Recently' }]
                      })
                    }
                  } else {
                    // Note: Direct IG DMs API requires App Review (OAuthException #3); messages arrive via webhooks
                  }
                } catch (eIgDms) {
                  console.error('Error fetching IG DMs:', eIgDms)
                }

                const igMediaRes = await fetch(
                  `https://graph.facebook.com/v19.0/${igId}/media?fields=id,caption,comments{from{id,username,profile_picture_url},text,timestamp}&limit=10&access_token=${page.accessToken}`
                )
                if (igMediaRes.ok) {
                  const mediaJson = await igMediaRes.json()
                  const mediaItems = mediaJson.data || []
                  for (const mItem of mediaItems) {
                    const igComments = mItem.comments?.data || []
                    for (const igC of igComments) {
                      if (igC.from?.id === igId || igC.from?.username === page.name || igC.from?.username?.toLowerCase().includes('binjwa')) continue
                      const personName = igC.from?.username || 'Instagram Commenter'
                      const personAvatar =
                        igC.from?.profile_picture_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(personName)}&background=random&color=fff&size=150`

                      metaConvs.push({
                        id: `meta-ig-comment-${igC.id}`,
                        personName,
                        personHandle: `@${igC.from?.username || 'user'}`,
                        personAvatar,
                        platform: 'Instagram',
                        type: 'comment',
                        postCaption: mItem.caption ? mItem.caption.slice(0, 60) : 'Instagram Post',
                        aiAutoReplyActive: true,
                        needsReview: false,
                        unreadCount: 0,
                        updatedAt: igC.timestamp || new Date().toISOString(),
                        messages: [
                          {
                            id: `ig-c-msg-${igC.id}`,
                            sender: 'customer',
                            text: igC.text || '',
                            timestamp: igC.timestamp ? new Date(igC.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
                          }
                        ]
                      })
                    }
                  }
                }
              }
            } catch (eIg) {
              console.error('Error checking IG business account:', eIg)
            }
          } catch (apiErr) {
            console.error('Error fetching real Graph API conversations:', apiErr)
          }
        }
      } else if (conn.platform === 'instagram' && (conn as any).platform_id && (conn as any).access_token) {
        try {
          const igId = (conn as any).platform_id
          const token = (conn as any).access_token
          const igDmsRes = await fetch(
            `https://graph.facebook.com/v19.0/${igId}/conversations?platform=instagram&fields=id,participants{id,username,name},messages{id,message,from,created_time}&limit=15&access_token=${token}`
          )
          if (igDmsRes.ok) {
            const igDmsJson = await igDmsRes.json()
            const igConvs = igDmsJson.data || []
            for (const item of igConvs) {
              const participants = item.participants?.data || []
              const customer = participants.find((p: any) => p.id !== igId) || participants[0] || { name: 'Instagram User', id: 'user' }
              const msgsData = item.messages?.data || []
              const messages = msgsData.reverse().map((m: any, mIdx: number) => ({
                id: m.id || `msg-${item.id}-${mIdx}`,
                sender: m.from?.id === igId ? 'admin' : 'customer',
                text: m.message || '',
                timestamp: m.created_time ? new Date(m.created_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
              }))

              const personName = customer.username || customer.name || 'Instagram User'
              const personAvatar = customer.profile_pic || customer.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(personName)}&background=random&color=fff&size=150`

              metaConvs.push({
                id: `meta-ig-dm-${item.id}`,
                personName,
                personHandle: `@${customer.username || String(customer.id).slice(0, 8)}`,
                personAvatar,
                platform: 'Instagram',
                type: 'dm',
                aiAutoReplyActive: true,
                needsReview: false,
                unreadCount: 0,
                updatedAt: item.updated_time || new Date().toISOString(),
                messages: messages.length > 0 ? messages : [{ id: 'm0', sender: 'customer', text: 'Conversation started', timestamp: 'Recently' }]
              })
            }
          } else {
            // Note: Direct IG DMs API requires App Review (OAuthException #3); messages arrive via webhooks
          }
        } catch (eIgDirect) {
          console.error('Error fetching direct IG DMs:', eIgDirect)
        }

        try {
          const igId = (conn as any).platform_id
          const token = (conn as any).access_token
          const igMediaRes = await fetch(
            `https://graph.facebook.com/v19.0/${igId}/media?fields=id,caption,comments{from{id,username,profile_picture_url},text,timestamp}&limit=10&access_token=${token}`
          )
          if (igMediaRes.ok) {
            const mediaJson = await igMediaRes.json()
            const mediaItems = mediaJson.data || []
            for (const mItem of mediaItems) {
              const igComments = mItem.comments?.data || []
              for (const igC of igComments) {
                if (igC.from?.id === igId || igC.from?.username === conn.name || igC.from?.username?.toLowerCase().includes('binjwa')) continue
                const personName = igC.from?.username || 'Instagram Commenter'
                const personAvatar =
                  igC.from?.profile_picture_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(personName)}&background=random&color=fff&size=150`

                metaConvs.push({
                  id: `meta-ig-comment-${igC.id}`,
                  personName,
                  personHandle: `@${igC.from?.username || 'user'}`,
                  personAvatar,
                  platform: 'Instagram',
                  type: 'comment',
                  postCaption: mItem.caption ? mItem.caption.slice(0, 60) : 'Instagram Post',
                  aiAutoReplyActive: true,
                  needsReview: false,
                  unreadCount: 0,
                  updatedAt: igC.timestamp || new Date().toISOString(),
                  messages: [
                    {
                      id: `ig-c-msg-${igC.id}`,
                      sender: 'customer',
                      text: igC.text || '',
                      timestamp: igC.timestamp ? new Date(igC.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
                    }
                  ]
                })
              }
            }
          }
        } catch (eIgMedia) {
          console.error('Error fetching standalone IG media comments:', eIgMedia)
        }
      }
    }
  } catch (err) {
    console.error('Error in fetchRealMetaConversations:', err)
  }
  return metaConvs
}

function loadInboxCache(userId: string): InboxConversation[] {
  try {
    const key = `inbox_${userId}`
    const filterConvs = (arr: any[]) => Array.isArray(arr) ? arr.filter((c: InboxConversation) => c.id.startsWith('meta-') || c.id.startsWith('db-') || c.id.startsWith('sim-')) : []

    if (fs.existsSync(INBOX_CACHE_PATH)) {
      const data = JSON.parse(fs.readFileSync(INBOX_CACHE_PATH, 'utf-8'))
      if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
        return filterConvs(data[key])
      }
      const all: InboxConversation[] = []
      for (const k of Object.keys(data)) {
        if (k.startsWith('inbox_') && Array.isArray(data[k])) {
          all.push(...filterConvs(data[k]))
        }
      }
      if (all.length > 0) return all
    }
    if (fs.existsSync(TMP_INBOX_PATH)) {
      const data = JSON.parse(fs.readFileSync(TMP_INBOX_PATH, 'utf-8'))
      if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
        return filterConvs(data[key])
      }
      const all: InboxConversation[] = []
      for (const k of Object.keys(data)) {
        if (k.startsWith('inbox_') && Array.isArray(data[k])) {
          all.push(...filterConvs(data[k]))
        }
      }
      if (all.length > 0) return all
    }
  } catch (e) {
    // Ignore cache load error
  }
  return []
}

function saveInboxCache(userId: string, conversations: InboxConversation[]) {
  try {
    const key = `inbox_${userId}`
    let data: Record<string, InboxConversation[]> = {}
    if (fs.existsSync(INBOX_CACHE_PATH)) {
      try {
        data = JSON.parse(fs.readFileSync(INBOX_CACHE_PATH, 'utf-8'))
      } catch (e) {}
    }
    data[key] = conversations
    const content = JSON.stringify(data, null, 2)
    try {
      fs.writeFileSync(INBOX_CACHE_PATH, content, 'utf-8')
    } catch (e) {}
    try {
      fs.writeFileSync(TMP_INBOX_PATH, content, 'utf-8')
    } catch (e) {}
  } catch (e) {
    // Ignore cache save error
  }
}

export function clearInboxCacheForPlatform(userId: string, platform?: string) {
  try {
    if (!platform) {
      clearUserInboxCache(userId)
      return
    }
    const convs = loadInboxCache(userId)
    const filtered = convs.filter(c => c.platform.toLowerCase() !== platform.toLowerCase())
    saveInboxCache(userId, filtered)
  } catch (e) {
    // Ignore
  }
}

export function clearUserInboxCache(userId: string) {
  try {
    const key = `inbox_${userId}`
    let data: Record<string, InboxConversation[]> = {}
    if (fs.existsSync(INBOX_CACHE_PATH)) {
      try { data = JSON.parse(fs.readFileSync(INBOX_CACHE_PATH, 'utf-8')) } catch (e) {}
    }
    if (data[key]) {
      delete data[key]
      const content = JSON.stringify(data, null, 2)
      try { fs.writeFileSync(INBOX_CACHE_PATH, content, 'utf-8') } catch (e) {}
      try { fs.writeFileSync(TMP_INBOX_PATH, content, 'utf-8') } catch (e) {}
    }
  } catch (e) {
    // Ignore
  }
}


export function formatMessageTime(timeInput?: string | Date): string {
  if (!timeInput) return 'Just now'
  try {
    const d = new Date(timeInput)
    if (isNaN(d.getTime())) return 'Recently'

    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })

    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()

    if (isToday) {
      return timeStr
    }

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${timeStr}`
    }

    const monthDay = d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    return `${monthDay}, ${timeStr}`
  } catch (e) {
    return 'Recently'
  }
}

export async function getInboxConversations(userId: string): Promise<InboxConversation[]> {
  const realConversations: InboxConversation[] = []
  const tgProfile = await getTelegramConnection(userId)
  const tgChannels = tgProfile?.channels || []

  // 1. Try fetching real Meta Graph API conversations for any connected FB/IG pages
  const metaConvs = await fetchRealMetaConversations(userId)
  metaConvs.forEach(c => {
    if (!realConversations.some(exist => exist.id === c.id)) {
      realConversations.push(c)
    }
  })

  // 2. Fetch real Supabase message_logs (from incoming webhooks or manual logs)
  try {
    let dbLogs: any[] | null = null
    const { data: d1, error: e1 } = await supabase
      .from('message_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1000)

    if (e1 || !d1 || d1.length === 0) {
      const { data: d2 } = await supabase
        .from('message_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)
      dbLogs = d2 || []
    } else {
      dbLogs = d1
    }

    if (dbLogs && dbLogs.length > 0) {
      // Sort oldest to newest so conversation history flows chronologically
      dbLogs.sort((a, b) => {
        const tA = new Date(a.timestamp || a.created_at || 0).getTime()
        const tB = new Date(b.timestamp || b.created_at || 0).getTime()
        return tA - tB
      })

      dbLogs.forEach((log: any, idx: number) => {
        const pageIdStr = String(log.page_id || '')
        const senderIdStr = String(log.sender_id || '')
        const isSlackLog = log.platform === 'Slack' || senderIdStr.startsWith('slack:') || pageIdStr.startsWith('slack:')

        if (isSlackLog) {
          const cleanSlackId = pageIdStr.replace(/^(slack:channel:|slack:dm:|slack:)/i, '').trim() || senderIdStr.replace(/^(slack:channel:|slack:dm:|slack:)/i, '').trim()
          if (!cleanSlackId) return

          let targetSlackConv = realConversations.find(c => c.id === `slack-${cleanSlackId}` || c.id === `tg-channel-slack-${cleanSlackId}`)

          const timeVal = log.timestamp || log.created_at || new Date().toISOString()
          const timeFormatted = formatMessageTime(timeVal)

          const slackChannelName = log.post_caption && log.post_caption !== 'Slack Channel / Chat'
            ? log.post_caption
            : `#channel-${cleanSlackId}`

          const slackSenderName = log.sender_name && !log.sender_name.startsWith('Slack User (')
            ? log.sender_name
            : `Slack Member`

          const customerMsg: InboxMessage = {
            id: `db-msg-cust-${log.id || idx}`,
            sender: 'customer',
            senderName: slackSenderName,
            text: log.message || 'Incoming message',
            timestamp: timeFormatted
          }

          if (!targetSlackConv) {
            targetSlackConv = {
              id: `slack-${cleanSlackId}`,
              personName: slackChannelName,
              personHandle: `@slack_${cleanSlackId}`,
              personAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(slackChannelName)}&background=4A154B&color=fff&size=150`,
              platform: 'Slack',
              type: 'comment',
              postCaption: 'Connected Slack Workspace',
              aiAutoReplyActive: log.needs_review ? false : true,
              needsReview: !!log.needs_review,
              unreadCount: 0,
              updatedAt: timeVal,
              messages: [customerMsg]
            }
            realConversations.push(targetSlackConv)
          } else {
            if (!targetSlackConv.messages.some(m => m.id === customerMsg.id)) {
              targetSlackConv.messages.push(customerMsg)
            }
          }

          if (log.response && log.response !== log.message) {
            const aiMsg: InboxMessage = {
              id: `db-msg-ai-${log.id || idx}`,
              sender: 'ai',
              senderName: 'Binjwa AI',
              text: log.response,
              timestamp: timeFormatted
            }
            if (!targetSlackConv.messages.some(m => m.id === aiMsg.id)) {
              targetSlackConv.messages.push(aiMsg)
            }
          }
          return
        }

        const isDiscordLog = log.platform === 'Discord' || senderIdStr.startsWith('discord:') || pageIdStr.startsWith('discord:')

        if (isDiscordLog) {
          const cleanDiscordId = pageIdStr.replace(/^(discord:channel:|discord:dm:|discord:)/i, '').trim() || senderIdStr.replace(/^(discord:channel:|discord:dm:|discord:)/i, '').trim()
          if (!cleanDiscordId) return

          let targetDiscordConv = realConversations.find(c => c.id === `discord-channel-${cleanDiscordId}` || c.id === `discord-${cleanDiscordId}`)

          const timeVal = log.timestamp || log.created_at || new Date().toISOString()
          const timeFormatted = formatMessageTime(timeVal)

          const discordChannelName = log.post_caption && log.post_caption !== 'Discord Channel' && !log.post_caption.startsWith('Discord Channel (')
            ? log.post_caption
            : `#channel-${cleanDiscordId}`

          const discordSenderName = log.sender_name || 'Discord User'

          const customerMsg: InboxMessage = {
            id: `db-disc-cust-${log.id || idx}`,
            sender: log.sender_id?.includes(':admin') ? 'admin' : 'customer',
            senderName: discordSenderName,
            text: log.message || 'Incoming message',
            timestamp: timeFormatted
          }

          if (!targetDiscordConv) {
            targetDiscordConv = {
              id: `discord-channel-${cleanDiscordId}`,
              personName: discordChannelName,
              personHandle: `@discord_${cleanDiscordId}`,
              personAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(discordChannelName)}&background=5865F2&color=fff&size=150`,
              platform: 'Discord',
              type: 'comment',
              postCaption: `Connected Discord Channel`,
              aiAutoReplyActive: log.needs_review ? false : true,
              needsReview: !!log.needs_review,
              unreadCount: 0,
              updatedAt: timeVal,
              messages: [customerMsg]
            }
            realConversations.push(targetDiscordConv)
          } else {
            // Remove initial placeholder message if real log messages exist
            targetDiscordConv.messages = targetDiscordConv.messages.filter(m => !m.id.startsWith('discord-init-'))

            if (!targetDiscordConv.messages.some(m => m.id === customerMsg.id || (m.text === customerMsg.text && m.sender === customerMsg.sender))) {
              targetDiscordConv.messages.push(customerMsg)
            }
          }

          if (log.response && log.response !== log.message) {
            const aiMsg: InboxMessage = {
              id: `db-disc-ai-${log.id || idx}`,
              sender: 'ai',
              senderName: 'Binjwa AI',
              text: log.response,
              timestamp: timeFormatted
            }
            if (!targetDiscordConv.messages.some(m => m.id === aiMsg.id || m.text === aiMsg.text)) {
              targetDiscordConv.messages.push(aiMsg)
            }
          }
          return
        }

        const cleanId = normalizeTelegramChatId(pageIdStr || senderIdStr)

        if (!cleanId) return

        const normClean = cleanId.replace(/^-/, '')
        let targetConv = realConversations.find(c => {
          const cId = normalizeTelegramChatId(c.id).replace(/^-/, '')
          const cHandle = normalizeTelegramChatId(c.personHandle).replace(/^-/, '')
          return cId === normClean || cHandle === normClean || c.id.includes(cleanId)
        })

        const timeVal = log.timestamp || log.created_at || new Date().toISOString()
        const timeFormatted = formatMessageTime(timeVal)

        // Clean up initial connection placeholder message if real log messages exist
        if (targetConv && targetConv.messages.some(m => m.id.startsWith('tg-init-'))) {
          targetConv.messages = targetConv.messages.filter(m => !m.id.startsWith('tg-init-'))
        }

        // Get user connected telegram channels for fallback channel title resolution
        const tgConn = tgChannels
        const realSenderName = (log.sender_name && !log.sender_name.startsWith('User ') && !log.sender_name.includes('Telegram Member') && log.sender_name !== 'Telegram User')
          ? log.sender_name
          : (log.post_caption && log.post_caption !== 'Telegram Channel / Chat' ? log.post_caption : 'Telegram Member')

        let convTitle = log.post_caption && log.post_caption !== 'Telegram Channel / Chat' ? log.post_caption : ''
        if (!convTitle && log.sender_name && !log.sender_name.startsWith('User ') && !log.sender_name.includes('Telegram Member')) {
          convTitle = log.sender_name
        }

        const matchCh = tgConn.find((ch: any) => {
          const cId = String(ch.id || '').replace(/[^\d]/g, '')
          const rawId = String(cleanId).replace(/[^\d]/g, '')
          return cId && rawId && (cId === rawId || rawId.includes(cId))
        })
        if (matchCh?.name) {
          convTitle = matchCh.name
        }

        if (!convTitle) {
          convTitle = cleanId.startsWith('-') ? `Telegram Group (${cleanId})` : `Telegram Chat (${cleanId})`
        }

        const customerMsg: InboxMessage = {
          id: `db-msg-cust-${log.id || idx}`,
          sender: 'customer',
          senderName: realSenderName !== 'Telegram Member' ? realSenderName : convTitle,
          text: log.message || (log.media_url ? '[Media Attached]' : 'Incoming inquiry'),
          timestamp: timeFormatted,
          mediaUrl: log.media_url || log.mediaUrl,
          mediaType: log.media_type || log.mediaType,
          mediaName: log.media_name || log.mediaName,
          reactions: typeof log.reactions === 'string' ? log.reactions : (log.reactions ? JSON.stringify(log.reactions) : undefined)
        }

        if (!targetConv) {
          targetConv = {
            id: `tg-channel-${cleanId}`,
            personName: convTitle,
            personHandle: cleanId.startsWith('-') ? `@${cleanId}` : `@${cleanId}`,
            personAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(convTitle)}&background=0088cc&color=fff&size=150`,
            platform: 'Telegram',
            type: 'comment',
            postCaption: 'Connected Telegram Channel / Group',
            aiAutoReplyActive: log.needs_review ? false : true,
            needsReview: !!log.needs_review,
            unreadCount: 0,
            updatedAt: timeVal,
            messages: [customerMsg]
          }
          realConversations.push(targetConv)
        } else {
          if (convTitle && targetConv.personName.startsWith('Telegram Member')) {
            targetConv.personName = convTitle
            targetConv.personAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(convTitle)}&background=0088cc&color=fff&size=150`
          }
          if (!targetConv.messages.some(m => m.id === customerMsg.id)) {
            targetConv.messages.push(customerMsg)
          }
        }

        if (log.response && log.response !== log.message) {
          const aiMsg: InboxMessage = {
            id: `db-msg-ai-${log.id || idx}`,
            sender: 'ai',
            text: log.response,
            timestamp: timeFormatted,
            telegramMessageId: log.telegram_message_id || log.message_id || log.response_message_id
          }
          if (!targetConv.messages.some(m => m.id === aiMsg.id)) {
            targetConv.messages.push(aiMsg)
          }
        }

        if (targetConv) {
          targetConv.updatedAt = timeVal
        }
      })
    }
  } catch (e) {
    console.error('Error fetching db message_logs:', e)
  }

  // 2b. Auto-seed connected Slack channels & fetch live history from Slack API
  try {
    const slackProfile = await getSlackConnection(userId)
    const botToken = slackProfile?.accessToken || process.env.SLACK_BOT_TOKEN

    if (slackProfile?.channels && Array.isArray(slackProfile.channels)) {
      for (const ch of slackProfile.channels) {
        const chId = typeof ch === 'string' ? ch : ch.id
        const chName = typeof ch === 'string' ? (String(ch).startsWith('#') ? String(ch) : `#${ch}`) : (ch.name || `#${chId}`)
        const fullConvId = `slack-${chId}`

        let existingConv = realConversations.find(c => c.id === fullConvId || c.id === `slack-${chId.replace(/^#/, '')}`)

        // Try joining public channel if bot token is available
        if (botToken && chId && !chId.startsWith('D')) {
          try {
            await fetch('https://slack.com/api/conversations.join', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${botToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: new URLSearchParams({ channel: chId })
            })
          } catch (eJoin) {}
        }

        // Try fetching live history from Slack Web API
        let liveSlackMessages: InboxMessage[] = []
        if (botToken && chId) {
          try {
            const histRes = await fetch(`https://slack.com/api/conversations.history?channel=${chId}&limit=15`, {
              headers: { 'Authorization': `Bearer ${botToken}` }
            })
            if (histRes.ok) {
              const histJson = await histRes.json()
              if (histJson.ok && Array.isArray(histJson.messages)) {
                // Sort oldest to newest
                const sorted = [...histJson.messages].reverse()
                for (const m of sorted) {
                  if (!m.text) continue
                  const isBot = !!m.bot_id || m.subtype === 'bot_message'
                  const userSlackId = m.user || 'U_MEMBER'

                  let senderName = isBot ? 'Binjwa AI' : `Slack Member`
                  if (!isBot && userSlackId && userSlackId !== 'U_MEMBER') {
                    try {
                      const uRes = await fetch(`https://slack.com/api/users.info?user=${userSlackId}`, {
                        headers: { 'Authorization': `Bearer ${botToken}` }
                      })
                      const uJson = await uRes.json()
                      if (uJson.ok && uJson.user) {
                        senderName = uJson.user.real_name || uJson.user.profile?.real_name || uJson.user.name || senderName
                      }
                    } catch (eU) {}
                  }

                  liveSlackMessages.push({
                    id: `slack-hist-${m.ts}`,
                    sender: isBot ? 'ai' : 'customer',
                    senderName: senderName,
                    text: m.text,
                    timestamp: formatMessageTime(new Date(Number(m.ts) * 1000))
                  })
                }
              }
            }
          } catch (eHist) {}
        }

        if (!existingConv) {
          realConversations.push({
            id: fullConvId,
            personName: chName,
            personHandle: `@slack_${chId}`,
            personAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chName)}&background=4A154B&color=fff&size=150`,
            platform: 'Slack',
            type: 'comment',
            postCaption: 'Connected Slack Workspace Channel',
            aiAutoReplyActive: true,
            needsReview: false,
            unreadCount: 0,
            updatedAt: new Date().toISOString(),
            messages: liveSlackMessages.length > 0 ? liveSlackMessages : [
              {
                id: `slack-init-${chId}`,
                sender: 'ai',
                text: `Channel ${chName} connected and active. Real-time messages will appear here as team members talk on Slack!`,
                timestamp: 'Just now'
              }
            ]
          })
        } else if (liveSlackMessages.length > 0) {
          // Merge live messages into existing thread
          liveSlackMessages.forEach(lm => {
            if (!existingConv!.messages.some(m => m.id === lm.id || (m.text === lm.text && m.timestamp === lm.timestamp))) {
              existingConv!.messages.push(lm)
            }
          })
        }
      }
    }
  } catch (eSlackSeed) {}

  // 3. Load any saved cached real conversations
  const cachedList = loadInboxCache(userId)
  cachedList.forEach(c => {
    const existingIndex = realConversations.findIndex(exist => exist.id === c.id)
    if (existingIndex >= 0) {
      const mergedMsgs = [...realConversations[existingIndex].messages]
      c.messages.forEach(m => {
        if (!mergedMsgs.some(existing => existing.id === m.id || (existing.text === m.text && existing.timestamp === m.timestamp))) {
          mergedMsgs.push(m)
        }
      })
      realConversations[existingIndex] = {
        ...realConversations[existingIndex],
        aiAutoReplyActive: c.aiAutoReplyActive,
        messages: mergedMsgs
      }
    } else {
      realConversations.push(c)
    }
  })

  // Synchronize cache so subsequent toggles/edits can find every conversation
  saveInboxCache(userId, realConversations)

  // Return ONLY real conversations (never fake data!)
  return realConversations
}

export async function addMessageToConversation(
  userId: string,
  conversationId: string,
  sender: 'customer' | 'ai' | 'admin',
  text: string
): Promise<InboxConversation[]> {
  const list = await getInboxConversations(userId)
  const cleanId = normalizeTelegramChatId(conversationId)
  
  let conv = list.find(c =>
    c.id === conversationId ||
    c.id.includes(cleanId) ||
    normalizeTelegramChatId(c.id) === cleanId ||
    normalizeTelegramChatId(c.personHandle) === cleanId
  )

  const newMsg: InboxMessage = {
    id: `msg-${Date.now()}`,
    sender,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (conv) {
    conv.messages.push(newMsg)
    conv.updatedAt = new Date().toISOString()
    conv.needsReview = false
  } else {
    conv = {
      id: `tg-channel-${cleanId}`,
      personName: 'Telegram Channel / Group',
      personHandle: cleanId.startsWith('-') ? `@${cleanId}` : `@${cleanId}`,
      personAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanId)}&background=0088cc&color=fff&size=150`,
      platform: 'Telegram',
      type: 'comment',
      postCaption: 'Connected Telegram Channel / Group',
      aiAutoReplyActive: true,
      needsReview: false,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
      messages: [newMsg]
    }
    list.unshift(conv)
  }

  saveInboxCache(userId, list)
  if (userId !== 'default_user_id') {
    saveInboxCache('default_user_id', list)
  }

  // Also log message into Supabase message_logs table
  let tenantId = '00000000-0000-0000-0000-000000000000'
  try {
    const { data: tenantRow } = await supabase.from('tenants').select('id').limit(1).maybeSingle()
    if (tenantRow?.id && /^[0-9a-fA-F-]{36}$/.test(tenantRow.id)) {
      tenantId = tenantRow.id
    }
  } catch (e) {}

  const logData: any = {
    user_id: userId,
    page_id: cleanId,
    sender_id: `admin:${cleanId}`,
    message: text,
    response: text,
    needs_review: false,
    timestamp: new Date().toISOString()
  }

  try {
    const { error: insertErr } = await supabase.from('message_logs').insert(logData)
    if (insertErr) {
      delete logData.timestamp
      logData.created_at = new Date().toISOString()
      await supabase.from('message_logs').insert(logData)
    }
  } catch (e) {}

  return list
}

export async function editMessageInConversation(
  userId: string,
  conversationId: string,
  messageId: string,
  newText: string
): Promise<InboxConversation[]> {
  const list = await getInboxConversations(userId)
  const cleanId = normalizeTelegramChatId(conversationId)

  let conv = list.find(c =>
    c.id === conversationId ||
    c.id.includes(cleanId) ||
    normalizeTelegramChatId(c.id) === cleanId ||
    normalizeTelegramChatId(c.personHandle) === cleanId
  )

  if (conv) {
    const msg = conv.messages.find(m => m.id === messageId)
    if (msg) {
      msg.text = newText
      msg.isEdited = true
      conv.updatedAt = new Date().toISOString()
      saveInboxCache(userId, list)

      // Live edit on Telegram API if Telegram platform
      if (conv.platform.toLowerCase() === 'telegram') {
        try {
          const rawChatId = conv.personHandle || conv.id || ''
          const { data: conn } = await supabase
            .from('social_connections')
            .select('access_token, profile_data')
            .eq('platform', 'telegram')
            .limit(1)
            .maybeSingle()

          const botToken = conn?.profile_data?.botToken || conn?.access_token || process.env.TELEGRAM_BOT_TOKEN || ''

          let tgMsgId: number | null = msg.telegramMessageId ? Number(msg.telegramMessageId) : null
          if (!tgMsgId || isNaN(tgMsgId)) {
            const dbIdMatch = messageId.match(/\d+/)
            if (dbIdMatch) {
              try {
                const { data: logRow } = await supabase
                  .from('message_logs')
                  .select('telegram_message_id')
                  .eq('id', Number(dbIdMatch[0]))
                  .maybeSingle()
                if (logRow?.telegram_message_id) {
                  tgMsgId = Number(logRow.telegram_message_id)
                }
              } catch (e) {}
            }
          }

          if (!tgMsgId || isNaN(tgMsgId)) {
            const tgMsgMatch = messageId.match(/\d+/)
            tgMsgId = tgMsgMatch ? Number(tgMsgMatch[0]) : null
          }

          if (botToken && rawChatId && tgMsgId) {
            const cleanDigits = String(rawChatId).replace(/[^\d]/g, '')
            const candidateChatIds: any[] = []

            if (cleanDigits.length >= 8) {
              candidateChatIds.push(`-${cleanDigits}`)
              candidateChatIds.push(Number(`-${cleanDigits}`))
              candidateChatIds.push(cleanDigits)
              candidateChatIds.push(Number(cleanDigits))
            }
            if (rawChatId.startsWith('@')) {
              candidateChatIds.push(rawChatId)
            } else if (rawChatId.includes('-')) {
              const fullClean = rawChatId.replace(/^(tg-channel-|tg-conv-|tg:channel:|tg:dm:|tg:)/i, '')
              candidateChatIds.push(fullClean)
              candidateChatIds.push(rawChatId)
            }

            console.log('[editMessageInConversation] Attempting live Telegram edit:', { candidateChatIds, tgMsgId, newText })

            for (const cId of candidateChatIds) {
              const editRes = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: cId,
                  message_id: tgMsgId,
                  text: newText
                })
              })
              const editJson = await editRes.json()
              console.log(`[editMessageInConversation] Telegram edit result for chat_id ${cId}:`, editJson)
              if (editJson.ok) break
            }
          }
        } catch (eTgEdit) {
          console.error('[editMessageInConversation] Telegram live edit error:', eTgEdit)
        }
      }

      // Update Supabase message_logs table permanently for all matching logs
      try {
        const dbIdMatch = messageId.match(/\d+/)
        const dbId = dbIdMatch ? Number(dbIdMatch[0]) : null

        if (dbId) {
          await supabase
            .from('message_logs')
            .update({ response: newText })
            .eq('id', dbId)
        }

        if (msg.telegramMessageId) {
          await supabase
            .from('message_logs')
            .update({ response: newText })
            .eq('telegram_message_id', String(msg.telegramMessageId))
        }
      } catch (dbErr) {
        console.error('[editMessageInConversation] Error updating message_logs:', dbErr)
      }
    }
  }
  return list
}

export async function toggleAIAutoReply(
  userId: string,
  conversationId: string,
  active?: boolean
): Promise<InboxConversation[]> {
  const list = await getInboxConversations(userId)
  const conv = list.find(c => c.id === conversationId)
  if (conv) {
    const newActive = active !== undefined ? active : !conv.aiAutoReplyActive
    conv.aiAutoReplyActive = newActive
    conv.updatedAt = new Date().toISOString()
    saveInboxCache(userId, list)

    // If this conversation originated from message_logs in Postgres, persist toggle to database
    if (conversationId.startsWith('db-')) {
      const dbId = conversationId.replace('db-', '')
      if (dbId && !isNaN(Number(dbId))) {
        await supabase
          .from('message_logs')
          .update({ needs_review: !newActive })
          .eq('id', Number(dbId))
          .eq('user_id', userId)
      }
    }
  }
  return list
}

export async function addSimulatedConversationToInbox(
  userId: string,
  data: {
    platform: string
    isComment?: boolean
    customerText: string
    aiReply: string
    senderName?: string
    senderHandle?: string
    chatId?: string
    messageId?: string
    reactions?: any
    postId?: string
    mediaUrl?: string
    mediaType?: 'image' | 'video' | 'document' | 'audio'
    mediaName?: string
  }
): Promise<InboxConversation[]> {
  const platform = data.platform || 'Telegram'
  const isComment = !!data.isComment
  const prefix = platform.toLowerCase()
  const chatKey = data.chatId || `tg_${Date.now()}`
  const senderId = `${prefix}:${isComment ? 'comment' : 'dm'}:${chatKey}`

  let tenantId = '00000000-0000-0000-0000-000000000000'
  try {
    const { data: tenantRow } = await supabase.from('tenants').select('id').limit(1).maybeSingle()
    if (tenantRow?.id && /^[0-9a-fA-F-]{36}$/.test(tenantRow.id)) {
      tenantId = tenantRow.id
    }
  } catch (e) {}

  const logPayload: any = {
    user_id: userId,
    page_id: data.chatId || platform,
    sender_id: senderId,
    message: data.customerText,
    response: data.aiReply,
    needs_review: false,
    timestamp: new Date().toISOString()
  }

  try {
    const { error: insertErr } = await supabase.from('message_logs').insert(logPayload)
    if (insertErr) {
      delete logPayload.timestamp
      logPayload.created_at = new Date().toISOString()
      await supabase.from('message_logs').insert(logPayload)
    }
  } catch (e) {
    console.error('Error inserting message_log:', e)
  }

  // Also construct and append to local cache so inbox updates instantly
  const existingConvs = loadInboxCache(userId)
  const convId = `tg-conv-${chatKey}`
  let conv = existingConvs.find(c => c.id === convId || c.personHandle === data.senderHandle)

  const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const newMessages: InboxMessage[] = [
    {
      id: `msg-in-${Date.now()}`,
      sender: 'customer',
      text: data.customerText,
      timestamp: timeNow,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      mediaName: data.mediaName
    }
  ]
  if (data.aiReply) {
    newMessages.push({
      id: `msg-out-${Date.now()}`,
      sender: 'ai',
      text: data.aiReply,
      timestamp: timeNow,
      telegramMessageId: data.messageId
    })
  }

  if (conv) {
    conv.messages.push(...newMessages)
    conv.updatedAt = new Date().toISOString()
  } else {
    conv = {
      id: convId,
      personName: data.senderName || 'Telegram User',
      personHandle: data.senderHandle || '@telegram_user',
      personAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.senderName || 'Telegram')}&background=0088cc&color=fff&size=150`,
      platform: 'Telegram',
      type: isComment ? 'comment' : 'dm',
      postCaption: data.postId ? `Linked Post #${data.postId}` : 'Telegram Chat / Group',
      aiAutoReplyActive: true,
      needsReview: false,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
      messages: newMessages
    }
    existingConvs.unshift(conv)
  }

  saveInboxCache(userId, existingConvs)
  if (userId !== 'default_user_id') {
    saveInboxCache('default_user_id', existingConvs)
  }

  return await getInboxConversations(userId)
}
