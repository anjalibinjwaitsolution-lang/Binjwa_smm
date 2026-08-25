import { NextResponse } from "next/server"

function getMockOptimization(body: any) {
  const { baseCopy, image } = body
  const caption = baseCopy?.caption || "Excited to share our brand journey!"
  const hashtags = baseCopy?.hashtags || ["Success", "Marketing", "Brand"]
  const cta = baseCopy?.cta || ""

  const result: Record<string, any> = {}
  const platformsList = ["instagram", "facebook", "twitter", "linkedin", "threads", "pinterest", "whatsapp", "bluesky", "tiktok"]

  platformsList.forEach((platform) => {
    let pCaption = caption
    let pTags = hashtags
    if (platform === "instagram") {
      pCaption = `📸 ${caption}\n\n${cta}`
      pTags = [...hashtags, "InstaGood", "PicOfTheDay"]
    } else if (platform === "facebook") {
      pCaption = `✨ ${caption}\n\nWe'd love to hear your thoughts. ${cta}`
    } else if (platform === "twitter") {
      pCaption = `${caption.slice(0, 180)}... ${cta}`.slice(0, 240)
      pTags = hashtags.slice(0, 3)
    } else if (platform === "linkedin") {
      pCaption = `💼 INDUSTRY HIGHLIGHT:\n\n${caption}\n\n${cta}`
      pTags = [...hashtags, "Networking", "Professional"]
    } else if (platform === "threads") {
      pCaption = `${caption}\n\nLet's talk about it! ${cta}`
    } else if (platform === "pinterest") {
      pCaption = `📌 ${caption}\n\n${cta}`
      pTags = [...hashtags, "PinIdea", "Inspiration"]
    } else if (platform === "whatsapp") {
      pCaption = `📣 *Update:*\n\n${caption}\n\n${cta}`
      pTags = []
    } else if (platform === "bluesky") {
      pCaption = `🦋 ${caption.slice(0, 250)}... ${cta}`
    } else if (platform === "tiktok") {
      pCaption = `🎵 ${caption}\n\n${cta}`
      pTags = [...hashtags, "fyp", "trending"]
    }

    result[platform] = {
      caption: pCaption,
      hashtags: pTags,
      characterCount: pCaption.length + (pTags.length > 0 ? pTags.map((t: string) => t.length + 2).reduce((a: number, b: number) => a + b, 0) : 0)
    }
  })

  return {
    platforms: result,
    imageUrl: image?.imageUrl || null
  }
}

export async function POST(request: Request) {
  let body: any = {}
  try {
    body = await request.json()
    const { baseCopy, image, platforms } = body

    console.log("[Optimizer] Received:", { baseCopy, image, platforms })

    if (!baseCopy || !platforms) {
      return NextResponse.json({ error: "Base copy and platforms are required" }, { status: 400 })
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
        max_tokens: 3000,
        messages: [
          {
            role: "user",
            content: `Optimize this social media content for multiple platforms:

Base Caption: ${baseCopy.caption}
Hashtags: ${baseCopy.hashtags?.join(" ") || ""}
CTA: ${baseCopy.cta}

Target Platforms: ${platforms.join(", ")}

For each platform, adapt the content considering:
- Instagram: Visual-first, hashtags, emojis, character limit 2,200
- Facebook: Longer form OK, conversational, character limit 63,206
- Twitter: Concise, 280 chars max, trending hashtags
- LinkedIn: Professional, thought leadership, character limit 3,000
- Threads: Conversational, engaging, character limit 500
- Pinterest: Visual description, keywords, character limit 500
- WhatsApp: Direct, bold/italic text, no hashtags, character limit 1000
- Bluesky: Similar to Twitter, character limit 300
- TikTok: Short, punchy, trending hashtags, character limit 2,200

Return ONLY a valid JSON object (no markdown) with this structure:
{
  "instagram": {
    "caption": "optimized caption",
    "hashtags": ["tag1", "tag2"],
    "characterCount": 150
  },
  "facebook": {
    "caption": "optimized caption",
    "hashtags": ["tag1", "tag2"],
    "characterCount": 200
  },
  "twitter": {
    "caption": "optimized caption",
    "hashtags": ["tag1", "tag2"],
    "characterCount": 280
  },
  "linkedin": {
    "caption": "optimized caption",
    "hashtags": ["tag1", "tag2"],
    "characterCount": 250
  },
  "threads": {
    "caption": "optimized caption",
    "hashtags": ["tag1"],
    "characterCount": 150
  },
  "pinterest": {
    "caption": "optimized caption",
    "hashtags": ["tag1"],
    "characterCount": 200
  },
  "whatsapp": {
    "caption": "optimized caption",
    "hashtags": [],
    "characterCount": 150
  },
  "bluesky": {
    "caption": "optimized caption",
    "hashtags": ["tag1"],
    "characterCount": 150
  },
  "tiktok": {
    "caption": "optimized caption",
    "hashtags": ["fyp", "tag1"],
    "characterCount": 150
  }
}

CRITICAL: Return ONLY the JSON object.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.warn("[Optimizer] API Error, using mock fallback:", error)
      return NextResponse.json(getMockOptimization(body))
    }

    const data = await response.json()
    const optimizedText = data.content[0].text

    let cleanedText = optimizedText.trim()
    cleanedText = cleanedText.replace(/```json\n?/g, "")
    cleanedText = cleanedText.replace(/```\n?/g, "")
    cleanedText = cleanedText.trim()

    const optimized = JSON.parse(cleanedText)

    console.log("[Optimizer] Optimized content:", optimized)

    return NextResponse.json({
      platforms: optimized,
      imageUrl: image?.imageUrl || null,
    })
  } catch (error: any) {
    console.warn("[Optimizer] Error, using mock fallback:", error.message)
    return NextResponse.json(getMockOptimization(body))
  }
}
