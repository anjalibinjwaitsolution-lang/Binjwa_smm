import { NextRequest, NextResponse } from 'next/server'
import { saveMediumConnection } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const targetUserId = userId || 'default_user_id'

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return htmlResponse(error, false)
    }

    let accessToken = 'medium_demo_access_token'
    let authorName = 'Medium Editorial Profile'
    let username = 'medium_author'
    let publications = [
      { id: 'PUB_TECH_01', name: 'Tech Insights Publication' },
      { id: 'PUB_MARKETING_02', name: 'Digital Growth Strategies' }
    ]

    const connection = {
      id: username,
      username: username,
      name: authorName,
      publications: publications,
      avatar: '/placeholder.svg?height=64&width=64',
      connectedAt: new Date().toISOString(),
      accessToken: accessToken
    }

    await saveMediumConnection(targetUserId, connection)

    return htmlResponse('Success', true, connection)
  } catch (err: any) {
    return htmlResponse(err.message || 'Error connecting Medium', false)
  }
}

function htmlResponse(message: string, success: boolean, profile?: any) {
  const payload = success
    ? { type: 'MEDIUM_AUTH_SUCCESS', profile }
    : { type: 'MEDIUM_AUTH_ERROR', error: message }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Medium Auth ${success ? 'Success' : 'Error'}</title></head>
      <body>
        <p>${success ? 'Medium connected successfully! Closing window...' : 'Failed: ' + message}</p>
        <script>
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(payload)}, "*");
          }
          window.close();
        </script>
      </body>
    </html>
  `
  return new NextResponse(html, {
    status: success ? 200 : 400,
    headers: { 'Content-Type': 'text/html' }
  })
}
