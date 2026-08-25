import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envStr = fs.readFileSync('.env.local', 'utf8')
const env = Object.fromEntries(envStr.split('\n').map(line => line.split('=')))
process.env = { ...process.env, ...env }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const { error } = await supabase.from('posts').update({
    engagement: null
  }).not('id', 'is', null)
  if (error) console.error(error)
  else console.log("Successfully reset engagement to null")
}
main()
