import { NextRequest, NextResponse } from 'next/server';
import { getFacebookConnectionByPageId, getFacebookPageForInstagramAccount, getConnectionForWebhook, logMessage } from '@/lib/db';
import { generateAIResponse } from '@/lib/ai/openrouter';
import { sendMessengerReply } from '@/lib/facebook/messenger';
import { addSimulatedConversationToInbox } from '@/lib/inbox-store';

const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'my_secure_verify_token_123';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return new NextResponse('Bad Request', { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object === 'page' || body.object === 'instagram') {
      for (const entry of body.entry) {
        // Both Facebook and Instagram now deliver via entry.messaging
        const messagingEvents = entry.messaging || [];
        
        for (const webhookEvent of messagingEvents) {
          // Filter out echoes and deleted messages
          if (webhookEvent.message?.is_echo) continue;
          if (webhookEvent.message?.is_deleted) continue;
          
          const senderId = webhookEvent.sender?.id;
          const recipientId = webhookEvent.recipient?.id;
          const messageText = webhookEvent.message?.text;

          if (senderId && recipientId && messageText) {
            console.log(`Received ${body.object} message from ${senderId} to ${recipientId}: ${messageText}`);

            // Robust check if we have this page/account connected
            const connectionLookup = await getConnectionForWebhook(recipientId);

            if (connectionLookup) {
              const { userId, targetPage, isInstagram } = connectionLookup;
              const platformName = (body.object === 'instagram' || isInstagram) ? 'Instagram' : 'Facebook';
              
              if (targetPage && targetPage.accessToken) {
                let aiResponseText = "";
                if (targetPage.aiEnabled) {
                  // 1. Generate AI Response
                  aiResponseText = await generateAIResponse(messageText, targetPage.name, targetPage.nicheInstructions);
                  
                  // 3. Send the response back to the user via Messenger API
                  await sendMessengerReply(
                    targetPage.id,
                    senderId,
                    aiResponseText,
                    targetPage.accessToken,
                    platformName === 'Instagram',
                    targetPage.igAccountId || targetPage.instagram_business_account?.id || targetPage.instagramId || (platformName === 'Instagram' ? recipientId : null)
                  );
                  console.log(`Successfully replied to ${platformName} message from ${senderId}`);
                } else {
                  console.log(`AI Auto-Reply is not enabled for ${platformName} ${recipientId}. Logging for manual reply.`);
                }

                // 2. Log for manual review or inbox tracking
                const isUrgent = messageText.toLowerCase().includes("urgent") || messageText.toLowerCase().includes("human") || targetPage.needsReview;
                await logMessage(userId, {
                  pageId: targetPage.id,
                  senderId: `dm:${senderId}`,
                  message: messageText,
                  response: aiResponseText,
                  needsReview: isUrgent,
                  timestamp: new Date().toISOString(),
                  platform: platformName,
                  messageType: 'dm',
                  senderName: `${platformName} User (${senderId.slice(-4)})`,
                  senderHandle: `@${platformName.toLowerCase()}_${senderId.slice(-4)}`
                });

                // 4. Update Inbox cache immediately so live message appears without reload delay
                try {
                  await addSimulatedConversationToInbox(userId, {
                    platform: platformName,
                    isComment: false,
                    customerText: messageText,
                    aiReply: aiResponseText || "Message received and logged.",
                    senderName: `${platformName} User (${senderId.slice(-4)})`
                  });
                } catch (cacheErr) {
                  console.error("Failed to update inbox cache after webhook DM:", cacheErr);
                }
              } else {
                 console.log(`No access token found for ${body.object} ${recipientId}.`);
              }
            } else {
                 console.log(`Could not find a matching database connection for ${body.object} ${recipientId}.`);
            }
          }
        }

        // Process Feed / Instagram Comments
        const changesEvents = entry.changes || [];
        for (const change of changesEvents) {
          try {
            const isFbComment = change.field === 'feed' && change.value?.item === 'comment' && change.value?.verb === 'add';
            const isIgComment = change.field === 'comments' || change.field === 'mentions';

            if (isFbComment || isIgComment) {
               const pageId = body.object === 'page' ? entry.id : (change.value?.media?.id || entry.id);
               if (!pageId) continue;
               
               const senderId = change.value.from?.id || change.value.sender_id;
               const senderUsername = change.value.from?.username || "";
               if (!senderId) {
                  console.log("Comment webhook missing sender ID, ignoring.");
                  continue;
               }
               
               if (
                 senderId === entry.id ||
                 senderId === pageId ||
                 senderId === change.value?.owner_id ||
                 senderUsername.toLowerCase().includes('binjwa')
               ) {
                  console.log("Ignoring comment from the page/admin itself.");
                  continue; 
               }

               const messageText = change.value.message || change.value.text || "";
               const commentId = change.value.comment_id || change.value.id;

               console.log(`Received feed/IG comment on ${pageId} from ${senderId}: ${messageText}`);

               const connectionLookup = await getConnectionForWebhook(String(entry.id || pageId));
               if (connectionLookup) {
                 const { userId, targetPage, isInstagram } = connectionLookup;
                 const platformName = (body.object === 'instagram' || isInstagram || isIgComment) ? 'Instagram' : 'Facebook';
                 
                 if (targetPage && targetPage.accessToken) {
                    const dbSenderId = `comment:${commentId}:${senderId}`;
                    
                    let aiResponseText = "";
                    if (targetPage.aiCommentsEnabled) {
                       aiResponseText = await generateAIResponse(messageText, targetPage.name, targetPage.nicheInstructions);
                       try {
                         const commentEndpoint = (platformName === 'Instagram' || isIgComment)
                           ? `https://graph.facebook.com/v19.0/${commentId}/replies`
                           : `https://graph.facebook.com/v19.0/${commentId}/comments`;

                         const res = await fetch(commentEndpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                               message: aiResponseText,
                               access_token: targetPage.accessToken
                            })
                         });
                         
                         const responseData = await res.json();
                         if (!res.ok) {
                           console.error(`Facebook/IG API Error replying to comment ${commentId}:`, responseData);
                         } else {
                           console.log(`Successfully auto-replied to comment ${commentId}. ID:`, responseData.id);
                         }
                       } catch (e) {
                         console.error("Network/Internal failure sending auto-reply to comment", e);
                       }
                    } else {
                       console.log(`AI Auto-Reply is not enabled for comment on page ${pageId}. Logging for manual review.`);
                    }
                    
                    const isUrgent = messageText.toLowerCase().includes("urgent") || messageText.toLowerCase().includes("human") || targetPage.needsReview;
                    await logMessage(userId, {
                      pageId: targetPage.id, 
                      senderId: dbSenderId,
                      message: messageText,
                      response: aiResponseText,
                      needsReview: isUrgent,
                      timestamp: new Date().toISOString(),
                      platform: platformName,
                      messageType: 'comment',
                      senderName: `${platformName} Commenter (${String(senderId).slice(-4)})`,
                      senderHandle: `@${platformName.toLowerCase()}_commenter`
                    });

                    try {
                      await addSimulatedConversationToInbox(userId, {
                        platform: platformName,
                        isComment: true,
                        customerText: messageText,
                        aiReply: aiResponseText || "Comment logged.",
                        senderName: `${platformName} Commenter (${String(senderId).slice(-4)})`
                      });
                    } catch (cacheErr) {
                      console.error("Failed to update inbox cache after webhook comment:", cacheErr);
                    }
                 }
               }
            }
          } catch (innerError) {
             console.error("Error processing feed/IG comment change event:", innerError);
          }
        }
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    return new NextResponse('Not Found', { status: 404 });
  } catch (error) {
    console.error('Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

