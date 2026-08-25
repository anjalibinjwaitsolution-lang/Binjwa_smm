import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupOrphanedPosts() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')

  if (error) {
    console.error("Error fetching posts:", error)
    return
  }

  const { data: connections, error: connError } = await supabase
    .from('social_connections')
    .select('*')
    .eq('platform', 'facebook')

  if (connError) {
    console.error("Error fetching connections:", connError)
    return
  }

  let deletedCount = 0;
  
  for (const post of posts) {
    if (post.platform !== 'facebook' && !(post.platforms && post.platforms.includes('facebook')) && !(post.platforms && post.platforms.includes('Facebook'))) {
       continue;
    }

    const userConn = connections.find(c => c.user_id === post.user_id)
    
    let isOrphaned = false;
    
    if (!userConn) {
      isOrphaned = true;
    } else {
      const pages = userConn.pages || [];
      if (post.platform_post_ids && post.platform_post_ids.facebook) {
        const hasPage = pages.some(p => post.platform_post_ids.facebook.includes(p.id));
        if (!hasPage) {
          isOrphaned = true;
        }
      } else {
        if (pages.length === 0) {
          isOrphaned = true;
        }
      }
    }
    
    if (isOrphaned) {
      console.log(`Deleting orphaned post ${post.id}`);
      await supabase.from('posts').delete().eq('id', post.id);
      deletedCount++;
    }
  }

  console.log(`Cleanup complete. Deleted ${deletedCount} orphaned posts.`);
}

cleanupOrphanedPosts();
