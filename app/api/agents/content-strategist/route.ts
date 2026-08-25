import { NextResponse } from "next/server"

function getMockStrategy(body: any) {
  const { topic, tone, platforms } = body
  const bestPlatform = Array.isArray(platforms) && platforms.length > 0 ? platforms[0] : "Instagram"

  return {
    contentType: "post",
    platform: bestPlatform,
    objective: `Increase engagement and brand awareness around: ${topic}`,
    targetAudience: "Niche professionals and retail customers interested in modern solutions",
    keyMessage: `Discover how our latest updates simplify your work and boost productivity.`,
    callToAction: "Click the link in bio to learn more!",
    tone: tone || "Casual",
    visualDirection: "Bright, contrast-rich photography featuring minimal elements and human faces",
    hashtags: ["Innovation", "Success", "Productivity", "Tech", "Startup"]
  }
}

export async function POST(request: Request) {
  let body: any = {}
  try {
    body = await request.json()
    const { brandProfile, topic, platforms, tone } = body

    console.log("[Strategist] Received:", {
      hasBrandProfile: !!brandProfile,
      topic,
      platforms,
      tone,
    })

    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile is required" }, { status: 400 })
    }

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
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
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `Create a content strategy based on this brand analysis:

Brand Personality: ${brandProfile.brandPersonality?.join(", ") || "Not specified"}
Tone Attributes: ${brandProfile.toneAttributes?.join(", ") || "Not specified"}
Visual Style: ${brandProfile.visualStyle || "Not specified"}
Target Audience: ${brandProfile.targetAudience || "General audience"}
Content Pillars: ${brandProfile.contentPillars?.join(", ") || "Not specified"}

Content Requirements:
- Topic: ${topic}
- Platforms: ${Array.isArray(platforms) ? platforms.join(", ") : platforms}
- Desired Tone: ${tone}

Develop a comprehensive content strategy.

Return ONLY a valid JSON object (no markdown, no explanations) with this exact structure:
{
  "contentType": "post/story/reel/carousel",
  "platform": "best platform for this content",
  "objective": "primary objective",
  "targetAudience": "specific audience details",
  "keyMessage": "main message to communicate",
  "callToAction": "specific CTA",
  "tone": "tone to use",
  "visualDirection": "visual approach description",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

CRITICAL: Return ONLY the JSON object, nothing else.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.warn("[Strategist] API Error, using mock fallback:", error)
      return NextResponse.json(getMockStrategy(body))
    }

    const data = await response.json()
    const strategyText = data.content[0].text

    let cleanedText = strategyText.trim()
    cleanedText = cleanedText.replace(/```json\n?/g, "")
    cleanedText = cleanedText.replace(/```\n?/g, "")
    cleanedText = cleanedText.trim()

    const strategy = JSON.parse(cleanedText)

    console.log("[Strategist] Strategy created:", strategy)

    return NextResponse.json(strategy)
  } catch (error: any) {
    console.warn("[Strategist] Error, using mock fallback:", error.message)
    return NextResponse.json(getMockStrategy(body))
  }
}
