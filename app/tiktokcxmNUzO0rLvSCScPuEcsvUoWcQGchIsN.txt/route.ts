import { NextResponse } from 'next/server'

export async function GET() {
  return new NextResponse('tiktok-devloper-site-verification=cxmNUzO0rLvSCScPuEcsvUoWcQGcHlsN', {
    headers: { 'Content-Type': 'text/plain' }
  })
}
