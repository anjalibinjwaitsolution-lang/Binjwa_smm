import { NextResponse } from "next/server"
import { getContentLibrary, saveContentEntry, updateContentEntry, deleteContentEntry, deleteMultipleContentEntries, PostItem } from "@/lib/content-store"
import { auth } from "@clerk/nextjs/server"

export async function GET(request: Request) {
  try {
    const authId = (await auth()).userId
    const headerUserId = request.headers.get("x-user-id")
    const userId = headerUserId || authId
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const platform = searchParams.get("platform")

    let filtered = await getContentLibrary(userId)

    if (status && status !== "All") {
      filtered = filtered.filter((post) => post.status === status)
    }

    if (platform && platform !== "All") {
      filtered = filtered.filter((post) => post.platforms.includes(platform))
    }

    return NextResponse.json({
      content: filtered,
      total: filtered.length,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authId = (await auth()).userId
    const headerUserId = request.headers.get("x-user-id")
    const userId = headerUserId || authId
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { imageUrl, videoUrl, caption, platform, platforms, status, date, time, platformPostIds, youtubeSettings } = body

    const contentEntry: PostItem = {
      id: `content-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      imageUrl: imageUrl || (videoUrl ? undefined : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop"),
      videoUrl: videoUrl || undefined,
      caption,
      platforms: platforms || (platform ? [platform.charAt(0).toUpperCase() + platform.slice(1)] : ["Instagram"]),
      status: status || "Draft",
      date: date || new Date().toISOString().split("T")[0],
      time: time || undefined,
      createdAt: new Date().toISOString(),
      platformPostIds: platformPostIds || {},
      youtubeSettings: youtubeSettings || undefined,
      engagement: null,
    }

    await saveContentEntry(userId, contentEntry)
    const lib = await getContentLibrary(userId)
    console.log("[v0] Content saved:", contentEntry.id)
    console.log("[v0] Library size:", lib.length)

    return NextResponse.json({
      success: true,
      content: lib,
      total: lib.length,
    })
  } catch (error: any) {
    console.error("Upload Error (detailed):", error, error.message, error.details, error.hint)
    return NextResponse.json({ error: error?.message || "Failed to upload content" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const authId = (await auth()).userId
    const headerUserId = request.headers.get("x-user-id")
    const userId = headerUserId || authId
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { id, caption, platforms, status, date, time, youtubeSettings } = body

    if (!id) return NextResponse.json({ error: "Post ID required" }, { status: 400 })

    await updateContentEntry(userId, id, { caption, platforms, status, date, time, youtubeSettings })
    
    // Fetch updated post
    const lib = await getContentLibrary(userId)
    const index = lib.findIndex((post) => post.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, content: lib[index] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authId = (await auth()).userId
    const headerUserId = request.headers.get("x-user-id")
    const userId = headerUserId || authId
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const singleId = searchParams.get("id")

    if (singleId) {
      await deleteContentEntry(userId, singleId)
      return NextResponse.json({ success: true })
    }

    const body = await request.json().catch(() => ({}))
    if (body.ids && Array.isArray(body.ids)) {
      await deleteMultipleContentEntries(userId, body.ids)
      return NextResponse.json({ success: true, deleted: body.ids.length })
    }

    return NextResponse.json({ error: "Invalid delete request" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
