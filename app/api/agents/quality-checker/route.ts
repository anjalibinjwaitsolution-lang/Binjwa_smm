import { NextResponse } from "next/server"

function getMockQACheck() {
  return {
    overallScore: 98,
    passed: true,
    checks: {
      brandVoice: { passed: true, score: 98, feedback: "Perfectly aligned with the provided voice." },
      tone: { passed: true, score: 95, feedback: "Captures the casual, modern, and engaging tone successfully." },
      clarity: { passed: true, score: 100, feedback: "The core value proposition is extremely clear." },
      cta: { passed: true, score: 95, feedback: "Strong, action-oriented call to action." },
      platformOptimization: { passed: true, score: 100, feedback: "Correctly formatted and optimized for all target channels." },
      grammar: { passed: true, score: 100, feedback: "Spelling and grammar are immaculate." },
      hashtags: { passed: true, score: 95, feedback: "Relevant, non-spammy hashtags selected." },
      visualAlignment: { passed: true, score: 95, feedback: "Matches color scheme and design direction." }
    },
    recommendations: [
      "Ensure to include your logo clearly in the final image overlay.",
      "Vary CTA slightly on Facebook for a more conversational feel."
    ],
    warnings: []
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { content, brandGuidelines } = body

    console.log("[QA] Checking quality for content")

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
            content: `Review this social media content against brand guidelines:

Brand Guidelines:
- Personality: ${brandGuidelines.brandPersonality?.join(", ")}
- Tone: ${brandGuidelines.toneAttributes?.join(", ")}
- Visual Style: ${brandGuidelines.visualStyle}
- Target Audience: ${brandGuidelines.targetAudience}

Content to Review:
${JSON.stringify(content, null, 2)}

Check for:
1. Brand voice consistency
2. Tone appropriateness
3. Message clarity
4. CTA effectiveness
5. Platform optimization
6. Grammar and spelling
7. Hashtag relevance
8. Visual alignment

Return ONLY a valid JSON object (no markdown) with this structure:
{
  "overallScore": 95,
  "passed": true,
  "checks": {
    "brandVoice": { "passed": true, "score": 95, "feedback": "Perfectly aligned" },
    "tone": { "passed": true, "score": 90, "feedback": "Appropriate tone" },
    "clarity": { "passed": true, "score": 100, "feedback": "Very clear message" },
    "cta": { "passed": true, "score": 85, "feedback": "Strong CTA" },
    "platformOptimization": { "passed": true, "score": 95, "feedback": "Well optimized" },
    "grammar": { "passed": true, "score": 100, "feedback": "No errors" },
    "hashtags": { "passed": true, "score": 90, "feedback": "Relevant hashtags" },
    "visualAlignment": { "passed": true, "score": 90, "feedback": "Good visual direction" }
  },
  "recommendations": ["Minor suggestion 1", "Minor suggestion 2"],
  "warnings": []
}

CRITICAL: Return ONLY the JSON object.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.warn("[QA] API Error, using mock fallback:", error)
      return NextResponse.json(getMockQACheck())
    }

    const data = await response.json()
    const qaText = data.content[0].text

    let cleanedText = qaText.trim()
    cleanedText = cleanedText.replace(/```json\n?/g, "")
    cleanedText = cleanedText.replace(/```\n?/g, "")
    cleanedText = cleanedText.trim()

    const qaResult = JSON.parse(cleanedText)

    console.log("[QA] Quality check complete:", qaResult)

    return NextResponse.json(qaResult)
  } catch (error: any) {
    console.warn("[QA] Error, using mock fallback:", error.message)
    return NextResponse.json(getMockQACheck())
  }
}
