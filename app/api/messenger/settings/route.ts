import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

const MESSENGER_CACHE_PATH = path.join(process.cwd(), '.binjwa_messenger_settings.json')
const TMP_MESSENGER_PATH = '/tmp/.binjwa_messenger_settings.json'

function loadMessengerCache(userId: string, platform: string) {
  try {
    const key = `${userId}_${platform.toLowerCase()}`
    const keyDefault = `default_user_id_${platform.toLowerCase()}`
    if (fs.existsSync(MESSENGER_CACHE_PATH)) {
      const data = JSON.parse(fs.readFileSync(MESSENGER_CACHE_PATH, 'utf-8'))
      if (data[key]) return data[key]
      if (data[keyDefault]) return data[keyDefault]
    }
    if (fs.existsSync(TMP_MESSENGER_PATH)) {
      const data = JSON.parse(fs.readFileSync(TMP_MESSENGER_PATH, 'utf-8'))
      if (data[key]) return data[key]
      if (data[keyDefault]) return data[keyDefault]
    }
  } catch (e) {}
  return null
}

function saveMessengerCache(userId: string, platform: string, settings: any) {
  try {
    const key = `${userId}_${platform.toLowerCase()}`
    const keyDefault = `default_user_id_${platform.toLowerCase()}`
    let data: Record<string, any> = {}
    if (fs.existsSync(MESSENGER_CACHE_PATH)) {
      try { data = JSON.parse(fs.readFileSync(MESSENGER_CACHE_PATH, 'utf-8')) } catch (e) {}
    }
    data[key] = settings
    data[keyDefault] = settings
    const content = JSON.stringify(data, null, 2)
    try { fs.writeFileSync(MESSENGER_CACHE_PATH, content, 'utf-8') } catch (e) {}
    try { fs.writeFileSync(TMP_MESSENGER_PATH, content, 'utf-8') } catch (e) {}
  } catch (e) {}
}

export async function GET(request: NextRequest) {
  try {
    const { userId: authId } = await auth()
    const headerUserId = request.headers.get("x-user-id")
    const userId = authId || headerUserId || 'default_user_id'

    const platform = request.nextUrl.searchParams.get('platform')
    if (!platform) {
      return NextResponse.json({ error: 'Missing platform parameter' }, { status: 400 })
    }

    const platformLower = platform.toLowerCase()

    let conn: any = null
    const { data: userConns } = await supabase
      .from('social_connections')
      .select('profile_data')
      .eq('user_id', userId)
      .eq('platform', platformLower)
      .order('connected_at', { ascending: false })
      .limit(1)

    if (userConns && userConns.length > 0) {
      conn = userConns[0]
    } else if (userId !== 'default_user_id') {
      const { data: defaultConns } = await supabase
        .from('social_connections')
        .select('profile_data')
        .eq('user_id', 'default_user_id')
        .eq('platform', platformLower)
        .order('connected_at', { ascending: false })
        .limit(1)
      if (defaultConns && defaultConns.length > 0) {
        conn = defaultConns[0]
      }
    }

    const localSaved = loadMessengerCache(userId, platform)

    const aiSettings = conn?.profile_data?.aiSettings || localSaved || {
      aiEnabled: true,
      aiCommentsEnabled: true,
      dmPrompt: '',
      commentPrompt: '',
      channelPrompt: '',
      logToInbox: true
    }

    return NextResponse.json({ success: true, aiSettings })
  } catch (err: any) {
    console.error('Error fetching messenger settings:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: authId } = await auth()
    const headerUserId = request.headers.get("x-user-id")
    const userId = authId || headerUserId || 'default_user_id'

    const body = await request.json()
    const {
      platform,
      aiEnabled = false,
      aiCommentsEnabled = false,
      dmPrompt = '',
      commentPrompt = '',
      channelPrompt = '',
      logToInbox = true
    } = body

    if (!platform) {
      return NextResponse.json({ error: 'Missing platform' }, { status: 400 })
    }

    const platformLower = platform.toLowerCase()

    // Query existing connection
    const { data: conns } = await supabase
      .from('social_connections')
      .select('*')
      .eq('platform', platformLower)
      .order('connected_at', { ascending: false })

    const aiSettings = {
      aiEnabled: !!aiEnabled,
      aiCommentsEnabled: !!aiCommentsEnabled,
      dmPrompt: String(dmPrompt || ''),
      commentPrompt: String(commentPrompt || ''),
      channelPrompt: String(channelPrompt || commentPrompt || ''),
      logToInbox: logToInbox !== false
    }

    const targetConns = conns?.filter(c => c.user_id === userId || c.user_id === 'default_user_id') || []

    if (targetConns.length > 0) {
      for (const conn of targetConns) {
        const updatedProfileData = {
          ...(conn.profile_data || {}),
          aiSettings
        }

        if (Array.isArray(updatedProfileData.pages)) {
          updatedProfileData.pages = updatedProfileData.pages.map((p: any) => ({
            ...p,
            aiEnabled: aiSettings.aiEnabled,
            aiCommentsEnabled: aiSettings.aiCommentsEnabled,
            nicheInstructions: aiSettings.dmPrompt,
            dmPrompt: aiSettings.dmPrompt,
            commentPrompt: aiSettings.commentPrompt,
            logToInbox: aiSettings.logToInbox
          }))
        }

        await supabase
          .from('social_connections')
          .update({
            profile_data: updatedProfileData,
            connected_at: new Date().toISOString()
          })
          .eq('id', conn.id)
      }
    } else {
      let tenantId = '00000000-0000-0000-0000-000000000000'
      try {
        const { data: tenantRow } = await supabase
          .from('tenants')
          .select('id')
          .limit(1)
        if (tenantRow?.[0]?.id && /^[0-9a-fA-F-]{36}$/.test(tenantRow[0].id)) {
          tenantId = tenantRow[0].id
        }
      } catch (e) {}

      await supabase
        .from('social_connections')
        .insert({
          user_id: userId,
          platform: platformLower,
          platform_id: `${platformLower}_ai_agent`,
          name: `${platform} AI Agent`,
          profile_data: { aiSettings },
          connected_at: new Date().toISOString()
        })
    }

    saveMessengerCache(userId, platform, aiSettings)

    return NextResponse.json({ success: true, aiSettings })
  } catch (err: any) {
    console.error('Error saving messenger settings:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
