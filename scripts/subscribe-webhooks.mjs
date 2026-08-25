import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function subscribeWebhooks() {
  const { data: connections, error } = await supabase
    .from('social_connections')
    .select('*')
    .in('platform', ['facebook', 'instagram'])

  if (error) {
    console.error("Error fetching connections:", error)
    return
  }

  for (const conn of connections) {
    if (conn.platform === 'facebook') {
      const pages = conn.profile_data?.pages || []
      for (const page of pages) {
        if (page.accessToken) {
          console.log(`Subscribing FB page ${page.name} (${page.id})...`)
          const res = await fetch(`https://graph.facebook.com/v19.0/${page.id}/subscribed_apps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              subscribed_fields: 'messages,messaging_postbacks,feed',
              access_token: page.accessToken
            })
          })
          const data = await res.json()
          console.log(`[FB Page ${page.id} Result]:`, data)

          let igId = page.igAccountId || page.instagram_business_account?.id
          if (!igId) {
            try {
              const igRes = await fetch(
                `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.accessToken}`
              )
              const igJson = await igRes.json()
              igId = igJson.instagram_business_account?.id
            } catch (e) {}
          }

          if (igId) {
            console.log(`Subscribing linked IG Account ${igId}...`)
            const igSubRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/subscribed_apps`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                subscribed_fields: 'messages,messaging_postbacks,comments,mentions',
                access_token: page.accessToken
              })
            })
            const igSubData = await igSubRes.json()
            console.log(`[IG Account ${igId} Result]:`, igSubData)
          }
        }
      }
    } else if (conn.platform === 'instagram' && conn.access_token) {
      console.log(`Subscribing standalone IG Account ${conn.name} (${conn.platform_id})...`)
      const igSubRes = await fetch(`https://graph.facebook.com/v19.0/${conn.platform_id}/subscribed_apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          subscribed_fields: 'messages,messaging_postbacks,comments,mentions',
          access_token: conn.access_token
        })
      })
      const igSubData = await igSubRes.json()
      console.log(`[IG Standalone ${conn.platform_id} Result]:`, igSubData)
    }
  }
}

subscribeWebhooks()
