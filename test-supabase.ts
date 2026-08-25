import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

async function run() {
  const { data, error } = await supabase
    .from('social_connections')
    .select('*')
    
  if (error) {
    console.error('Select All Error:', error)
  } else {
    console.log(`Found ${data.length} total rows in social_connections.`)
    console.dir(data, { depth: null })
  }
}

run()
