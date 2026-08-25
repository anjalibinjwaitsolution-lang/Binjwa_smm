import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envStr = fs.readFileSync('.env.local', 'utf8')
const env = Object.fromEntries(envStr.split('\n').filter(line => line.includes('=')).map(line => line.split('=')))
process.env = { ...process.env, ...env }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .not('platform_post_ids', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)

  const fbPost = posts!.find(p => p.platform_post_ids && p.platform_post_ids.facebook)
  const { data: connections } = await supabase
    .from('social_connections')
    .select('*')
    .eq('user_id', fbPost!.user_id)
    .eq('platform', 'facebook')
    .single()

  const fbConn = connections!.profile_data
  const pageToken = fbConn.pages && fbConn.pages.length > 0 ? fbConn.pages[0].accessToken : fbConn.accessToken

  const res = await fetch(`https://graph.facebook.com/v19.0/${fbPost!.platform_post_ids.facebook}?fields=comments.summary(true),likes.summary(true)&access_token=${pageToken}`)
  
  if (!res.ok) {
    const text = await res.text()
    console.log("FB API Error:", res.status, text)
  } else {
    const data = await res.json()
    console.log("FB API Success:", JSON.stringify(data, null, 2))
  }
}
main()
