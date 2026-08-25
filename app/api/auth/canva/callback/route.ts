import { NextRequest, NextResponse } from 'next/server'
import { saveCanvaConnection } from '@/lib/db'
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

    let accessToken = 'canva_demo_access_token'
    let workspaceName = 'Canva Design Team'
    let workspaceId = 'WS_CANVA_01'

    const connection = {
      id: workspaceId,
      name: workspaceName,
      workspaceId: workspaceId,
      avatar: '/placeholder.svg?height=64&width=64',
      connectedAt: new Date().toISOString(),
      accessToken: accessToken
    }

    await saveCanvaConnection(targetUserId, connection)

    return htmlResponse('Success', true, connection)
  } catch (err: any) {
    return htmlResponse(err.message || 'Error connecting Canva', false)
  }
}

function htmlResponse(message: string, success: boolean, profile?: any) {
  const payload = success
    ? { type: 'CANVA_AUTH_SUCCESS', profile }
    : { type: 'CANVA_AUTH_ERROR', error: message }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Canva Auth ${success ? 'Success' : 'Error'}</title></head>
      <body>
        <p>${success ? 'Canva connected successfully! Closing window...' : 'Failed: ' + message}</p>
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
