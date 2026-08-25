import { NextRequest, NextResponse } from 'next/server'
import { getFacebookConnection, saveFacebookConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { subscribeToMetaWebhooks } from '@/lib/facebook/messenger'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { pageId, aiEnabled, aiCommentsEnabled, nicheInstructions, dmPrompt, commentPrompt, logToInbox, needsReview } = await request.json()

    if (!pageId) {
      return NextResponse.json({ error: 'Missing pageId' }, { status: 400 })
    }

    const connection = await getFacebookConnection(userId)
    if (!connection) {
      return NextResponse.json({ error: 'No Facebook connection found' }, { status: 404 })
    }

    if (connection.pages) {
      connection.pages = await Promise.all(connection.pages.map(async (page) => {
        if (page.id === pageId) {
          const updatedPage = {
            ...page,
            aiEnabled: aiEnabled !== undefined ? aiEnabled : page.aiEnabled,
            aiCommentsEnabled: aiCommentsEnabled !== undefined ? aiCommentsEnabled : page.aiCommentsEnabled,
            nicheInstructions: nicheInstructions !== undefined ? nicheInstructions : (dmPrompt !== undefined ? dmPrompt : page.nicheInstructions),
            dmPrompt: dmPrompt !== undefined ? dmPrompt : (nicheInstructions !== undefined ? nicheInstructions : (page as any).dmPrompt),
            commentPrompt: commentPrompt !== undefined ? commentPrompt : (page as any).commentPrompt,
            logToInbox: logToInbox !== undefined ? logToInbox : ((page as any).logToInbox !== undefined ? (page as any).logToInbox : true),
            needsReview: needsReview !== undefined ? needsReview : page.needsReview
          }
          await subscribeToMetaWebhooks(updatedPage)
          return updatedPage
        }
        return page
      }))
      await saveFacebookConnection(userId, connection)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating page settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


