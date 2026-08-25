import { supabaseAdmin } from './supabase'

export interface PostItem {
  id: string
  imageUrl?: string
  videoUrl?: string
  caption: string
  platforms: string[]
  status: string
  date: string
  time?: string
  createdAt?: string
  engagement?: { likes: number; comments: number; shares: number } | null
  platform?: string
  reach?: number
  likes?: number
  comments?: number
  shares?: number
  platformPostIds?: Record<string, string>
  youtubeSettings?: any
}

// Maps Supabase row to PostItem
function mapRowToPost(row: any): PostItem {
  return {
    id: row.id,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    caption: row.caption,
    platforms: row.platforms || [],
    platform: row.platform,
    status: row.status,
    date: row.date,
    time: row.time,
    createdAt: row.created_at,
    reach: row.reach,
    likes: row.likes,
    comments: row.comments,
    shares: row.shares,
    engagement: row.engagement,
    platformPostIds: row.platform_post_ids,
    youtubeSettings: row.youtube_settings,
  }
}

import fs from 'fs'
import path from 'path'

const CACHE_FILE_PATH = path.join(process.cwd(), '.binjwa_posts_cache.json')
const TMP_CACHE_PATH = '/tmp/.binjwa_posts_cache.json'

function loadLocalCache(): Record<string, PostItem[]> {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf-8'))
    }
    if (fs.existsSync(TMP_CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(TMP_CACHE_PATH, 'utf-8'))
    }
  } catch (e) {
    console.warn('[Content Store] Error reading local cache file:', e)
  }
  return {}
}

function saveLocalCache(cache: Record<string, PostItem[]>) {
  try {
    const content = JSON.stringify(cache, null, 2)
    try {
      fs.writeFileSync(CACHE_FILE_PATH, content, 'utf-8')
    } catch (e) {
      // Ignore write errors to read-only fs
    }
    try {
      fs.writeFileSync(TMP_CACHE_PATH, content, 'utf-8')
    } catch (e) {
      // Ignore
    }
  } catch (e) {
    console.warn('[Content Store] Error saving local cache file:', e)
  }
}

export async function getContentLibrary(userId: string): Promise<PostItem[]> {
  let supabasePosts: PostItem[] = []
  try {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      supabasePosts = data.map(mapRowToPost)
    }
  } catch (err) {
    console.warn('[Content Store] Supabase fetch fallback for posts:', err)
  }

  const cache = loadLocalCache()
  let localPosts = cache[userId] || []
  if (localPosts.length === 0) {
    const allCached: PostItem[] = []
    for (const k of Object.keys(cache)) {
      if (Array.isArray(cache[k])) {
        allCached.push(...cache[k])
      }
    }
    localPosts = allCached
  }

  const mergedMap = new Map<string, PostItem>()
  for (const p of [...supabasePosts, ...localPosts]) {
    mergedMap.set(p.id, p)
  }

  return Array.from(mergedMap.values()).sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date).getTime()
    const dateB = new Date(b.createdAt || b.date).getTime()
    return dateB - dateA
  })
}

export async function saveContentEntry(userId: string, entry: PostItem) {
  // 1. Always save immediately to local persistent cache
  const cache = loadLocalCache()
  const list = cache[userId] || []
  const idx = list.findIndex(p => p.id === entry.id)
  if (idx >= 0) {
    list[idx] = entry
  } else {
    list.unshift(entry)
  }
  cache[userId] = list
  saveLocalCache(cache)

  // 2. Safe Supabase Insert with UUID validation
  let tenantId = '00000000-0000-0000-0000-000000000000'
  try {
    const { data: userData } = await supabaseAdmin
      .from('workspace_users')
      .select('tenant_id')
      .eq('user_id', userId)
      .single()
    if (userData?.tenant_id && /^[0-9a-fA-F-]{36}$/.test(userData.tenant_id)) {
      tenantId = userData.tenant_id
    } else {
      const { data: tenantRow } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .limit(1)
        .single()
      if (tenantRow?.id && /^[0-9a-fA-F-]{36}$/.test(tenantRow.id)) {
        tenantId = tenantRow.id
      }
    }
  } catch (e) {
    // Keep safe UUID fallback
  }

  try {
    const { error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        caption: entry.caption,
        image_url: entry.imageUrl,
        video_url: entry.videoUrl,
        platforms: entry.platforms,
        platform: entry.platform,
        status: entry.status,
        date: entry.date,
        time: entry.time,
        reach: entry.reach || 0,
        likes: entry.likes || 0,
        comments: entry.comments || 0,
        shares: entry.shares || 0,
        engagement: entry.engagement,
        platform_post_ids: entry.platformPostIds,
        youtube_settings: entry.youtubeSettings,
      })

    if (error) {
      console.warn('[Content Store] Supabase insert note (using persistent cache):', error.message)
    }
  } catch (e: any) {
    console.warn('[Content Store] Supabase insert note (using persistent cache):', e.message)
  }
}

export async function updateContentEntry(userId: string, id: string, updates: Partial<PostItem>) {
  // 1. Update local cache
  const cache = loadLocalCache()
  const list = cache[userId] || []
  const idx = list.findIndex(p => p.id === id)
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...updates }
    cache[userId] = list
    saveLocalCache(cache)
  }

  // 2. Try Supabase update
  const payload: any = {}
  if (updates.caption !== undefined) payload.caption = updates.caption
  if (updates.platforms !== undefined) payload.platforms = updates.platforms
  if (updates.status !== undefined) payload.status = updates.status
  if (updates.date !== undefined) payload.date = updates.date
  if (updates.time !== undefined) payload.time = updates.time
  if (updates.youtubeSettings !== undefined) payload.youtube_settings = updates.youtubeSettings
  if (updates.reach !== undefined) payload.reach = updates.reach
  if (updates.likes !== undefined) payload.likes = updates.likes
  if (updates.comments !== undefined) payload.comments = updates.comments
  if (updates.shares !== undefined) payload.shares = updates.shares

  try {
    await supabaseAdmin
      .from('posts')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
  } catch (e) {
    // Ignore
  }
}

export async function deleteContentEntry(userId: string, id: string) {
  // 1. Delete from local cache
  const cache = loadLocalCache()
  const list = cache[userId] || []
  cache[userId] = list.filter(p => String(p.id) !== String(id))
  saveLocalCache(cache)

  // 2. Try Supabase delete (handle both string and numeric ID types)
  try {
    const numericId = Number(id)
    if (!isNaN(numericId) && String(numericId) === String(id)) {
      await supabaseAdmin
        .from('posts')
        .delete()
        .eq('id', numericId)
        .eq('user_id', userId)
    } else {
      await supabaseAdmin
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
    }
  } catch (e) {
    // Ignore
  }
}

export async function deleteMultipleContentEntries(userId: string, ids: string[]) {
  if (!ids || ids.length === 0) return
  const stringIds = ids.map(id => String(id))
  // 1. Delete from local cache
  const cache = loadLocalCache()
  const list = cache[userId] || []
  cache[userId] = list.filter(p => !stringIds.includes(String(p.id)))
  saveLocalCache(cache)

  // 2. Try Supabase delete
  try {
    const numIds = ids.map(id => Number(id)).filter(n => !isNaN(n))
    await supabaseAdmin
      .from('posts')
      .delete()
      .eq('user_id', userId)
      .in('id', ids)

    if (numIds.length > 0) {
      await supabaseAdmin
        .from('posts')
        .delete()
        .eq('user_id', userId)
        .in('id', numIds)
    }
  } catch (e) {
    // Ignore
  }
}

export function clearUserContentCache(userId: string) {
  try {
    const cache = loadLocalCache()
    if (cache[userId]) {
      delete cache[userId]
      saveLocalCache(cache)
    }
  } catch (e) {
    // Ignore
  }
}

