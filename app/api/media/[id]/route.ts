import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory media buffer store for serving media on verified domain binjwa-ssm.vercel.app
const mediaStore = new Map<string, { buffer: Buffer; mimeType: string }>()

function storeMediaBuffer(id: string, buffer: Buffer, mimeType: string) {
  mediaStore.set(id, { buffer, mimeType })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = mediaStore.get(id)

  if (!item) {
    return new NextResponse('Media not found', { status: 404 })
  }

  return new NextResponse(new Uint8Array(item.buffer), {
    status: 200,
    headers: {
      'Content-Type': item.mimeType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
