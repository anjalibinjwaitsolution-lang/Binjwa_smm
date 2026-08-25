// facebook.js
// Handles Facebook Messenger sends only. Instagram is intentionally NOT
// handled here anymore -- see instagram.js for why that separation matters.

const axios = require("axios");

const { PAGE_ID, PAGE_ACCESS_TOKEN, GRAPH_API_VERSION } = process.env;
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function sendFacebookMessage(recipientId, text) {
  const url = `${GRAPH_BASE}/${PAGE_ID}/messages`;

  try {
    await axios.post(
      url,
      {
        recipient: { id: recipientId },
        message: { text },
        messaging_type: "RESPONSE",
      },
      { params: { access_token: PAGE_ACCESS_TOKEN } }
    );
    console.log("[facebook.js] Reply sent to", recipientId);
    return { success: true };
  } catch (err) {
    console.error(
      "[facebook.js] Send failed:",
      err.response?.data || err.message
    );
    return { success: false, error: err.response?.data || err.message };
  }
}

module.exports = { sendFacebookMessage };
