import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"
import { clearUserContentCache } from "@/lib/content-store"
import { clearUserInboxCache } from "@/lib/inbox-store"

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { deleteAccount } = await request.json().catch(() => ({ deleteAccount: false }))

    // 0. Clear local persistent caches immediately
    clearUserContentCache(userId)
    clearUserInboxCache(userId)

    // 1. Delete all posts
    const { error: postsError } = await supabase
      .from('posts')
      .delete()
      .eq('user_id', userId)
      
    if (postsError) {
      console.error("Error deleting posts:", postsError)
      return NextResponse.json({ error: "Failed to delete posts data" }, { status: 500 })
    }

    // 2. Delete all social connections
    const { error: connectionsError } = await supabase
      .from('social_connections')
      .delete()
      .eq('user_id', userId)

    if (connectionsError) {
      console.error("Error deleting connections:", connectionsError)
      return NextResponse.json({ error: "Failed to delete connections data" }, { status: 500 })
    }

    // 3. Delete message logs
    const { error: messagesError } = await supabase
      .from('message_logs')
      .delete()
      .eq('user_id', userId)

    if (messagesError) {
      console.error("Error deleting messages:", messagesError)
      return NextResponse.json({ error: "Failed to delete message logs" }, { status: 500 })
    }

    // 4. Optionally delete the Clerk user account entirely
    if (deleteAccount) {
      try {
        const client = await clerkClient()
        await client.users.deleteUser(userId)
      } catch (clerkErr) {
        console.error("Failed to delete Clerk user:", clerkErr)
        return NextResponse.json({ error: "Failed to delete authentication account" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Data deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
