import { NextResponse } from "next/server"

function getMockCopy(body: any) {
  const { strategy, includeHashtags, includeCTA } = body
  const cta = includeCTA ? (strategy?.callToAction || "Check out the link in our bio for more details!") : ""
  const tags = includeHashtags ? (strategy?.hashtags || ["Success", "Innovation", "Productivity"]) : []
//test //
  return {
    caption: `Are you ready to take your branding to the next level? 🚀 We're sharing our best tips on how to streamline your workflows, automate redundant tasks, and focus on what truly matters: growth. Let us know your thoughts in the comments!`,
    hashtags: tags,
    cta: cta,
    hooks: [
      "Tired of wasting hours on manual tasks? Read this. 🧵",
      "The secret to supercharging your brand's growth in 2026. 👇",
      "Work smarter, not harder. Here is how we do it. 💡"
    ]
  }
}

export async function POST(request: Request) {
  let body: any = {}
  try {
    body = await request.json()
    const { strategy, maxLength, includeHashtags, includeCTA } = body

    console.log("[Copywriter] Received strategy:", strategy)

    if (!strategy) {
      return NextResponse.json({ error: "Strategy is required" }, { status: 400 })
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `Write engaging social media copy based on this strategy:

Content Type: ${strategy.contentType}
Platform: ${strategy.platform}
Key Message: ${strategy.keyMessage}
Call to Action: ${strategy.callToAction}
Tone: ${strategy.tone}
Target Audience: ${strategy.targetAudience}

Requirements:
- Max Length: ${maxLength || 280} characters for main caption
- Include Hashtags: ${includeHashtags}
- Include CTA: ${includeCTA}
- Write in a ${strategy.tone} tone
- Make it compelling and engaging

Return ONLY a valid JSON object (no markdown, no explanations) with this exact structure:
{
  "caption": "the main caption text (under ${maxLength || 280} chars)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "cta": "call to action text",
  "hooks": ["attention-grabbing opening 1", "attention-grabbing opening 2", "attention-grabbing opening 3"]
}

CRITICAL: Return ONLY the JSON object, nothing else.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.warn("[Copywriter] API Error, using mock fallback:", error)
      return NextResponse.json(getMockCopy(body))
    }

    const data = await response.json()
    const copyText = data.content[0].text

    let cleanedText = copyText.trim()
    cleanedText = cleanedText.replace(/```json\n?/g, "")
    cleanedText = cleanedText.replace(/```\n?/g, "")
    cleanedText = cleanedText.trim()

    const copy = JSON.parse(cleanedText)

    console.log("[Copywriter] Copy generated:", copy)

    return NextResponse.json(copy)
  } catch (error: any) {
    console.warn("[Copywriter] Error, using mock fallback:", error.message)
    return NextResponse.json(getMockCopy(body))
  }
}
