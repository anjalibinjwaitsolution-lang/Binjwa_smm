import { NextResponse } from 'next/server'
import { deleteFacebookConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    await deleteFacebookConnection(userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Facebook Disconnect Error:', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
