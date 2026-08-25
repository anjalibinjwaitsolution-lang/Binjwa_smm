// server.js
require("dotenv").config();
const express = require("express");

const { sendFacebookMessage } = require("./facebook");
const { extractInstagramMessages, sendInstagramMessage } = require("./instagram");
const { getAIReply } = require("./ai");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// ===============================
// Webhook Verification
// ===============================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Verified");
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// ===============================
// Webhook Receiver
// ===============================
app.post("/webhook", async (req, res) => {
  // Ack immediately -- Meta retries hard (and can disable your webhook)
  // if you don't return 200 fast.
  res.sendStatus(200);

  try {
    const body = req.body;

    if (body.object !== "page" && body.object !== "instagram") {
      return; // not something we handle
    }

    // *** THE KEY FIX ***
    // Branch on body.object at the TOP LEVEL, not on which array key exists
    // on the entry. Both Facebook and Instagram now deliver via
    // entry.messaging, so checking `if (entry.messaging)` alone can't tell
    // them apart -- that ambiguity is what sent Instagram DMs down the
    // Facebook send path last time.
    if (body.object === "page") {
      await handleFacebookEntries(body.entry);
    } else if (body.object === "instagram") {
      await handleInstagramEntries(body.entry);
    }
  } catch (err) {
    console.error("[server.js] Webhook processing error:", err.response?.data || err.message);
  }
});

async function handleFacebookEntries(entries) {
  for (const entry of entries || []) {
    for (const event of entry.messaging || []) {
      if (!event.message || !event.sender) continue;
      if (event.message.is_echo) continue;

      const senderId = event.sender.id;
      const userMessage = event.message.text || "";
      if (!userMessage) continue;

      console.log("Facebook Message:", userMessage);
      const aiReply = await getAIReply(userMessage);
      await sendFacebookMessage(senderId, aiReply);
    }
  }
}

async function handleInstagramEntries(entries) {
  for (const entry of entries || []) {
    const messages = extractInstagramMessages(entry);

    for (const msg of messages) {
      console.log("Instagram Message:", msg.text);
      const aiReply = await getAIReply(msg.text);
      await sendInstagramMessage(msg.senderId, aiReply);
    }
  }
}

app.get("/", (req, res) => res.send("FB-BOT server running."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
