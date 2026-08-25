import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return new NextResponse('URL parameter missing', { status: 400 })
  }

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return new NextResponse('Failed to fetch remote media', { status: 502 })
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error: any) {
    return new NextResponse(error.message || 'Media proxy error', { status: 500 })
  }
}
