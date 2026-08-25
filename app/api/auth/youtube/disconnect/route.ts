import { NextResponse } from 'next/server'
import { createClerkSupabaseClient } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export async function POST() {
  const { userId, getToken } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const clerkToken = await getToken({ template: 'supabase' })
    if (!clerkToken) throw new Error("No supabase token")

    const supabase = createClerkSupabaseClient(clerkToken)

    const { error } = await supabase
      .from('social_connections')
      .delete()
      .eq('user_id', userId)
      .eq('platform', 'youtube')

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
