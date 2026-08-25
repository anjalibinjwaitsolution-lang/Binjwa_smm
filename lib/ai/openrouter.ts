// Set the model here or override in environment variables
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

export async function generateAIResponse(
  messageText: string,
  pageName: string,
  nicheInstructions?: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  const systemPrompt = nicheInstructions 
    ? nicheInstructions
    : `You are an AI assistant responding on behalf of "${pageName}". Be helpful, concise, polite, and accurate.`;

  const messagesPayload: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt }
  ];

  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    conversationHistory.forEach(hMsg => {
      if (hMsg.content && hMsg.content.trim()) {
        messagesPayload.push({
          role: hMsg.role === 'assistant' ? 'assistant' : 'user',
          content: hMsg.content
        });
      }
    });
  }

  // Ensure current message is appended to payload if not already present
  const lastMsg = messagesPayload[messagesPayload.length - 1];
  if (!lastMsg || lastMsg.content !== messageText) {
    messagesPayload.push({ role: "user", content: messageText });
  }

  // 1. Prioritize OpenRouter API orchestrator if OPENROUTER_API_KEY is configured
  if (OPENROUTER_API_KEY) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://binjwa-ssm.vercel.app",
          "X-Title": "Binjwa SSM AI Agent",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
          messages: messagesPayload,
          temperature: 0.6,
          max_tokens: 220
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content.trim();
      } else {
        console.error("OpenRouter API error:", await response.text());
      }
    } catch (error) {
      console.error("Failed to generate OpenRouter response:", error);
    }
  }

  // 2. Fallback to direct OpenAI API if key is available
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: messagesPayload,
          temperature: 0.7,
          max_tokens: 350
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content.trim();
      } else {
        console.error("OpenAI API error:", await response.text());
      }
    } catch (error) {
      console.error("Failed to generate OpenAI response:", error);
    }
  }

  // 3. Fallback response simulation if API keys are unreachable
  const isQuestion = messageText.includes('?') || messageText.toLowerCase().includes('how') || messageText.toLowerCase().includes('what') || messageText.toLowerCase().includes('can');
  if (isQuestion) {
    return `Hello! On behalf of ${pageName}, thanks for reaching out. Yes, our team and automated AI agent are available 24/7. Let us know if you need further details!`;
  }
  return `Thank you for reaching out to ${pageName}! We have received your message and will follow up shortly.`;
}

