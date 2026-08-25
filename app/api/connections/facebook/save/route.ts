import { NextRequest, NextResponse } from 'next/server'
import { getFacebookConnection, saveFacebookConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { subscribeToMetaWebhooks } from '@/lib/facebook/messenger'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { connectionData, selectedPages } = await request.json()

    if (!connectionData || !selectedPages) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    // Merge with existing or create new connection
    const currentConnection = await getFacebookConnection(userId);
    
    const newConnection = {
      ...connectionData,
      pages: selectedPages
    };

    await saveFacebookConnection(userId, newConnection);

    // Programmatically subscribe BOTH the Facebook Page and any attached Instagram account to all messaging webhooks
    for (const page of selectedPages) {
      await subscribeToMetaWebhooks(page)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving pages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
