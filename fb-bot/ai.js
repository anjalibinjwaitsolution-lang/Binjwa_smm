// ai.js
const axios = require("axios");

const { OPENROUTER_API_KEY, OPENROUTER_MODEL } = process.env;

const SYSTEM_PROMPT = `You are an AI assistant for Binjwa IT Solutions.

Services:
- AI Calling Agent
- WhatsApp Automation
- Instagram Automation
- Facebook Automation
- Website Development
- AI Chatbot

Rules:
- Reply in Hindi or English according to the user's language (Hinglish is fine).
- Keep replies short and professional.
- Promote Binjwa IT Solutions when relevant, but don't force it into every reply.
`;

async function getAIReply(message) {
  try {
    console.log("[ai.js] Sending request to OpenRouter...");
    console.log("[ai.js] User Message:", message);

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiReply = response.data.choices?.[0]?.message?.content?.trim();

    console.log("[ai.js] AI Reply:", aiReply);

    return aiReply || "Sorry, I couldn't generate a response.";
  } catch (err) {
    console.error(
      "[ai.js] OpenRouter Error:",
      err.response?.data || err.message
    );

    return "Thanks for reaching out! Our team will get back to you shortly.";
  }
}

module.exports = { getAIReply };