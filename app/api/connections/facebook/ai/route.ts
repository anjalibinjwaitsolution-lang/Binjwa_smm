import { NextRequest, NextResponse } from 'next/server'
import { getFacebookConnection, saveFacebookConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { pageId, aiEnabled } = await request.json()

    if (!pageId) {
      return NextResponse.json({ error: 'Missing pageId' }, { status: 400 })
    }

    const connection = await getFacebookConnection(userId)
    if (!connection) {
      return NextResponse.json({ error: 'No Facebook connection found' }, { status: 404 })
    }

    if (connection.pages) {
      connection.pages = connection.pages.map(page => 
        page.id === pageId ? { ...page, aiEnabled } : page
      )
      await saveFacebookConnection(userId, connection)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error toggling AI:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
