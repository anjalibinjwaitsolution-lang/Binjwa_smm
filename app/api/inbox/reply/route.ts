import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getFacebookConnectionByPageId, getTelegramConnection, getSlackConnection, getDiscordConnection, logMessage } from '@/lib/db';
import { sendMessengerReply } from '@/lib/facebook/messenger';
import { auth } from '@clerk/nextjs/server';
import { addMessageToConversation } from '@/lib/inbox-store';

export async function POST(req: NextRequest) {
  try {
    const { userId: authId } = await auth();
    const headerUserId = req.headers.get("x-user-id");
    const userId = authId || headerUserId || 'default_user_id';

    const { logId, conversationId, pageId, senderId, messageText } = await req.json();

    const targetId = conversationId || logId;
    if (!targetId || !messageText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Immediately save to persistent inbox store
    const conversations = await addMessageToConversation(userId, targetId, 'admin', messageText);

    // 2a. Try sending Facebook / Instagram live reply if connected
    if (pageId && senderId && !senderId.startsWith('tg:') && !senderId.startsWith('slack:')) {
      try {
        const connectionLookup = await getFacebookConnectionByPageId(pageId);
        if (connectionLookup?.targetPage?.accessToken) {
          const accessToken = connectionLookup.targetPage.accessToken;
          if (senderId.startsWith('comment:')) {
            const commentId = senderId.split(':')[1];
            await fetch(`https://graph.facebook.com/v19.0/${commentId}/comments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: messageText, access_token: accessToken })
            });
          } else {
            let psid = senderId;
            if (senderId.startsWith('dm:')) psid = senderId.split(':')[1];
            await sendMessengerReply(pageId, psid, messageText, accessToken);
          }
        }
      } catch (err) {
        console.warn('[Inbox Reply] Social API send notice:', err);
      }
    }

    // 2b. Try sending Telegram live reply if Telegram conversation
    const isTelegram = (typeof senderId === 'string' && (senderId.startsWith('tg') || senderId.toLowerCase().includes('telegram'))) ||
                       (typeof targetId === 'string' && (targetId.toLowerCase().includes('telegram') || targetId.startsWith('tg'))) ||
                       (typeof pageId === 'string' && (pageId.startsWith('tg') || pageId.toLowerCase().includes('telegram')));

    if (isTelegram) {
      try {
        const tgConn = await getTelegramConnection(userId);
        const botToken = tgConn?.botToken || process.env.TELEGRAM_BOT_TOKEN || '';
        let chatId = targetId || pageId || senderId;
        if (chatId) {
          chatId = String(chatId)
            .replace(/^tg-channel-/i, '')
            .replace(/^tg-conv-/i, '')
            .replace(/^tg:channel:/i, '')
            .replace(/^tg:dm:/i, '')
            .replace(/^tg:/i, '')
            .replace(/^@-/g, '-')
            .trim();
        }
        if (botToken && chatId) {
          const resTg = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: messageText })
          });
          const tgJson = await resTg.json();
          console.log(`[Inbox Reply] Sent live Telegram message to ${chatId}:`, tgJson);
        }
      } catch (tgErr) {
        console.warn('[Inbox Reply] Telegram send notice:', tgErr);
      }
    }

    // 2c. Try sending Slack live reply if Slack conversation
    const isSlack = (typeof senderId === 'string' && senderId.startsWith('slack:')) ||
                    (typeof targetId === 'string' && targetId.toLowerCase().includes('slack')) ||
                    (typeof pageId === 'string' && pageId.startsWith('slack:')) ||
                    (typeof conversationId === 'string' && conversationId.toLowerCase().includes('slack'));

    if (isSlack) {
      try {
        const slackConn = await getSlackConnection(userId);
        const botToken = slackConn?.accessToken || process.env.SLACK_BOT_TOKEN || '';
        
        let rawId = conversationId || targetId || pageId || senderId || '';
        let channelId = String(rawId)
          .replace(/^slack-channel-/i, '')
          .replace(/^slack-conv-/i, '')
          .replace(/^slack-/i, '')
          .replace(/^slack:channel:/i, '')
          .replace(/^slack:dm:/i, '')
          .replace(/^slack:/i, '')
          .split(':')[0]
          .trim();

        if (senderId && senderId.startsWith('slack:channel:')) {
          const parts = senderId.split(':');
          channelId = parts[2] || channelId;
        }

        if (botToken && channelId) {
          const postRes = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${botToken}`,
              'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
              channel: channelId,
              text: messageText
            })
          });
          const postJson = await postRes.json().catch(() => ({}));
          console.log(`[Inbox Reply] Sent live Slack message to ${channelId}:`, postJson);
        }
      } catch (slackErr) {
        console.warn('[Inbox Reply] Slack send notice:', slackErr);
      }
    }

    // 2d. Try sending Discord live reply if Discord conversation
    const isDiscord = (typeof senderId === 'string' && senderId.startsWith('discord:')) ||
                      (typeof targetId === 'string' && targetId.toLowerCase().includes('discord')) ||
                      (typeof pageId === 'string' && pageId.startsWith('discord:')) ||
                      (typeof conversationId === 'string' && conversationId.toLowerCase().includes('discord'));

    if (isDiscord) {
      try {
        const discordConn = await getDiscordConnection(userId);
        const botToken = discordConn?.botToken || discordConn?.accessToken || process.env.DISCORD_BOT_TOKEN || '';

        let rawId = conversationId || targetId || pageId || senderId || '';
        let channelId = String(rawId)
          .replace(/^discord-channel-/i, '')
          .replace(/^discord-conv-/i, '')
          .replace(/^discord-/i, '')
          .replace(/^discord:channel:/i, '')
          .replace(/^discord:dm:/i, '')
          .replace(/^discord:/i, '')
          .split(':')[0]
          .trim();

        if (senderId && senderId.startsWith('discord:channel:')) {
          const parts = senderId.split(':');
          channelId = parts[2] || channelId;
        }

        if (botToken && channelId) {
          const postRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bot ${botToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: messageText })
          });
          const postJson = await postRes.json().catch(() => ({}));
          console.log(`[Inbox Reply] Sent live Discord message to ${channelId}:`, postJson);

          // Log sent manual reply to Supabase message_logs & inbox store so it persists across refreshes!
          try {
            await logMessage(userId, {
              pageId: String(channelId),
              senderId: `discord:channel:${channelId}:admin`,
              message: messageText,
              response: messageText,
              senderName: 'Binjwa Admin',
              senderHandle: '@admin',
              postCaption: `Discord Channel (${channelId})`,
              needsReview: false,
              timestamp: new Date().toISOString()
            });
          } catch (eLog) {}

          try {
            await addMessageToConversation(userId, `discord-channel-${channelId}`, 'admin', messageText);
          } catch (eStore) {}
        }
      } catch (discordErr) {
        console.warn('[Inbox Reply] Discord send notice:', discordErr);
      }
    }

    // 3. Try updating Supabase message_logs if it was a db log
    try {
      const dbIdVal = logId || (typeof targetId === 'string' && targetId.startsWith('db-') ? targetId.replace('db-', '') : null);
      if (dbIdVal && !isNaN(Number(dbIdVal))) {
        await supabase
          .from('message_logs')
          .update({ response: messageText, needs_review: false })
          .eq('id', Number(dbIdVal));
      }
    } catch (e) {
      // Ignore
    }

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error('Inbox Reply Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
