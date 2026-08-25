import { NextResponse } from 'next/server'
import { deleteInstagramConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await deleteInstagramConnection(userId)
    return NextResponse.json({ success: true, message: 'Successfully disconnected Instagram' })
  } catch (error: any) {
    console.error('Instagram Disconnect Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
