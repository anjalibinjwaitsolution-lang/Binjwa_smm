import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { deleteMultipleContentEntries } from '@/lib/content-store'
import { clearInboxCacheForPlatform } from '@/lib/inbox-store'
import { 
  getFacebookConnection, saveFacebookConnection, deleteFacebookConnection,
  getTwitterConnection, deleteTwitterConnection,
  getLinkedInConnection, deleteLinkedInConnection,
  getInstagramConnection, deleteInstagramConnection
} from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { platformId, accountId, deleteHistory, deleteScheduled, deleteMessages } = await req.json()

    if (!platformId || !accountId) {
      return NextResponse.json({ error: 'Missing platformId or accountId' }, { status: 400 })
    }

    const platLower = platformId.toLowerCase()

    // 1. Fetch & delete connection for this platform
    if (platLower === 'facebook') {
      const connection = await getFacebookConnection(userId)
      if (connection) {
        const pages = connection.pages || []
        const remainingPages = pages.filter((p: any) => p.id !== accountId)
        
        if (remainingPages.length === 0) {
          await deleteFacebookConnection(userId)
        } else {
          await saveFacebookConnection(userId, {
            ...connection,
            pages: remainingPages
          })
        }
      }
    } else if (platLower === 'twitter') {
      await deleteTwitterConnection(userId)
    } else if (platLower === 'linkedin') {
      await deleteLinkedInConnection(userId)
    } else if (platLower === 'instagram') {
      await deleteInstagramConnection(userId)
    } else {
      await supabase.from('social_connections').delete().eq('user_id', userId).eq('platform', platLower)
    }

    // 2. Handle Cascading Deletions in `posts` table & local post store
    if (deleteHistory || deleteScheduled) {
      const { data: allPosts, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)

      if (fetchError) {
        console.error("Error fetching posts for cascading deletion:", fetchError)
      } else if (allPosts && allPosts.length > 0) {
        const postsToDelete: string[] = []
        
        for (const post of allPosts) {
          let shouldDelete = false;
          const isScheduled = post.status === 'Scheduled';
          let isTargetPlatform = false;
          
          if (post.platform && typeof post.platform === 'string' && post.platform.toLowerCase() === platLower) {
            isTargetPlatform = true;
          }
          if (post.platforms && Array.isArray(post.platforms) && post.platforms.some((p: any) => typeof p === 'string' && p.toLowerCase() === platLower)) {
            isTargetPlatform = true;
          }
          if (post.platform_post_ids && typeof post.platform_post_ids === 'object' && post.platform_post_ids[platLower] !== undefined) {
            isTargetPlatform = true;
          }
          
          if (deleteScheduled && isScheduled && isTargetPlatform) {
            shouldDelete = true;
          }
          
          if (deleteHistory && !isScheduled && isTargetPlatform) {
            shouldDelete = true;
          }

          if (shouldDelete) {
            postsToDelete.push(post.id);
          }
        }

        if (postsToDelete.length > 0) {
          await deleteMultipleContentEntries(userId, postsToDelete)
        }
      }
    }

    // 3. Handle deleting messages & purging local inbox cache for platform
    if (deleteMessages) {
       const { error: msgError } = await supabase
        .from('message_logs')
        .delete()
        .eq('user_id', userId)

       if (msgError) console.error("Error deleting messages:", msgError)
       clearInboxCacheForPlatform(userId, platLower)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Disconnect Account Error:', error)
    return NextResponse.json({ error: 'Failed to disconnect account' }, { status: 500 })
  }
}

