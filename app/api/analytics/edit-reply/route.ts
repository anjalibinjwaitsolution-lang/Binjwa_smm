import { NextRequest, NextResponse } from 'next/server';
import { getFacebookConnectionByPageId } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { replyId, pageId, messageText } = await req.json();

    if (!replyId || !pageId || !messageText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connectionLookup = await getFacebookConnectionByPageId(pageId);
    if (!connectionLookup || !connectionLookup.targetPage || !connectionLookup.targetPage.accessToken) {
      return NextResponse.json({ error: 'Page connection not found or missing access token' }, { status: 404 });
    }

    const accessToken = connectionLookup.targetPage.accessToken;

    const res = await fetch(`https://graph.facebook.com/v19.0/${replyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        access_token: accessToken
      })
    });

    if (!res.ok) {
        const errorData = await res.json();
        console.error("Facebook API Error (Edit Reply):", errorData);
        return NextResponse.json({ error: 'Failed to edit comment reply' }, { status: 500 });
    }

    const data = await res.json();

    return NextResponse.json({ success: true, id: replyId });
  } catch (error) {
    console.error('Analytics Edit Reply Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
