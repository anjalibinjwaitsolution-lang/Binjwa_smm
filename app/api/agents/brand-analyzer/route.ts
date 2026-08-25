import { NextResponse } from "next/server"

function getMockBrandAnalysis(body: any) {
  const voice = body?.voice || "Friendly and professional"
  const keywords = body?.keywords || ["innovation", "creativity"]
  const colors = body?.colors || ["#8b5cf6", "#ec4899"]
  //test//
  //test2//
  return {
    brandPersonality: ["Innovative", "Creative", "Customer-centric", "Friendly"],
    toneAttributes: ["Helpful", "Professional", "Informative", "Approachable"],
    visualStyle: `A modern and vibrant aesthetic focusing on the palette: ${colors.join(", ")}. Uses clean typography and engaging patterns.`,
    targetAudience: `Small businesses, innovators, and professionals interested in ${keywords.join(" and ")}.`,
    keyMessages: [
      "We simplify complex tasks to help you grow.",
      "Creativity and technology combined for perfect solutions.",
      "Your success is our main priority."
    ],
    contentPillars: ["Product Updates", "Industry Best Practices", "Customer Success Stories"]
  }
}

export async function POST(request: Request) {
  let body: any = {}
  try {
    body = await request.json()

    console.log("[Brand Analyzer] Received:", body)

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
            content: `Analyze this brand and extract key characteristics:
        
Brand Voice: ${body.voice || "Not provided"}
Keywords: ${body.keywords?.join(", ") || "Not provided"}
Colors: ${body.colors?.join(", ") || "Not provided"}

Return ONLY a valid JSON object (no markdown, no explanations) with this exact structure:
{
  "brandPersonality": ["trait1", "trait2", "trait3"],
  "toneAttributes": ["attribute1", "attribute2", "attribute3"],
  "visualStyle": "description of visual style",
  "targetAudience": "description of target audience",
  "keyMessages": ["message1", "message2", "message3"],
  "contentPillars": ["pillar1", "pillar2", "pillar3"]
}

CRITICAL: Return ONLY the JSON object, nothing else. No markdown code blocks, no explanations.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.warn("[Brand Analyzer] API Error, using mock fallback:", error)
      return NextResponse.json(getMockBrandAnalysis(body))
    }

    const data = await response.json()
    console.log("[Brand Analyzer] API Response:", data)

    const analysisText = data.content[0].text

    let cleanedText = analysisText.trim()
    cleanedText = cleanedText.replace(/```json\n?/g, "")
    cleanedText = cleanedText.replace(/```\n?/g, "")
    cleanedText = cleanedText.trim()

    const analysis = JSON.parse(cleanedText)

    console.log("[Brand Analyzer] Parsed analysis:", analysis)

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.warn("[Brand Analyzer] Error, using mock fallback:", error.message)
    return NextResponse.json(getMockBrandAnalysis(body))
  }
}
