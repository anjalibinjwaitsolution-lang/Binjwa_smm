// instagram.js
//
// ROOT CAUSE OF YOUR ERROR #100:
// Meta now delivers Instagram DMs through the SAME "messaging" array shape
// as Facebook Messenger (entry.messaging), not entry.changes like older docs
// suggested. Your old code checked `if (entry.messaging)` and treated that as
// "this is a Facebook message" unconditionally -- so real Instagram DMs
// (object: "instagram" in the payload) got routed into sendFacebookMessage(),
// which posted to `/me/messages`. That endpoint does not correctly resolve
// Instagram-scoped sender IDs (IGSIDs), producing:
//   { message: '(#100) No matching user found', code: 100, error_subcode: 2018001 }
//
// THE FIX:
//   1. Branch on `body.object` ("instagram" vs "page") at the top level in
//      server.js -- not on which array key is present, since both now use
//      `messaging`.
//   2. Send Instagram replies via the Page ID explicitly (not "me").
//   3. Skip events with no actual text (deleted messages, reactions, etc.)
//      -- your logs show `is_deleted: true` with no `message.text` at all,
//      so the bot was trying to AI-reply to an empty string on top of the
//      routing bug.

const axios = require("axios");

const { PAGE_ID, PAGE_ACCESS_TOKEN, GRAPH_API_VERSION } = process.env;
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Pulls clean, replyable message events out of an Instagram webhook entry.
 * Filters out echoes, deleted messages, and anything without text.
 */
function extractInstagramMessages(entry) {
  const events = [];

  for (const msgEvent of entry.messaging || []) {
    if (msgEvent.message?.is_echo) continue; // our own outgoing message, re-delivered
    if (msgEvent.message?.is_deleted) continue; // sender deleted it, nothing to reply to
    if (!msgEvent.message?.text) continue; // no text (sticker, reaction, etc.)

    events.push({
      senderId: msgEvent.sender.id, // IGSID
      text: msgEvent.message.text,
      mid: msgEvent.message.mid,
    });
  }

  return events;
}

async function sendInstagramMessage(recipientIgsid, text) {
  const url = `${GRAPH_BASE}/${PAGE_ID}/messages`;

  try {
    await axios.post(
      url,
      {
        recipient: { id: recipientIgsid },
        message: { text },
        messaging_type: "RESPONSE",
      },
      { params: { access_token: PAGE_ACCESS_TOKEN } }
    );
    console.log("[instagram.js] Reply sent to", recipientIgsid);
    return { success: true };
  } catch (err) {
    const metaError = err.response?.data?.error;
    console.error("[instagram.js] Send failed:", metaError || err.message);

    // If this STILL throws #100 after the routing fix, check:
    //  - PAGE_ACCESS_TOKEN was generated for PAGE_ID above (not a different Page)
    //  - The IG account is actually connected to that same Page in Meta Business Suite
    //  - The IGSID hasn't gone stale (24h messaging window / 7-day session rules)
    return { success: false, error: metaError || err.message };
  }
}

module.exports = { extractInstagramMessages, sendInstagramMessage };
