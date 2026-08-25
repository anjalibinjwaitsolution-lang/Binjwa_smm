import { NextResponse } from "next/server"
import { generateSocialImage } from "@/lib/ai/gemini-image"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { caption, brandColors, style, aspectRatio } = body

    console.log("[Image Generator] Received request for caption:", caption?.substring?.(0, 60))

    const result = await generateSocialImage({
      prompt: caption || "High quality social media post graphic",
      aspectRatio: aspectRatio || "1:1",
      style,
      brandColors,
    })

    return NextResponse.json({
      imageUrl: result.imageUrl,
      prompt: result.prompt,
      aspectRatio: result.aspectRatio,
      provider: result.provider,
    })
  } catch (error: any) {
    console.error("[Image Generator] Route Error:", error)

    return NextResponse.json(
      {
        imageUrl: "https://placehold.co/1080x1080/8b5cf6/ffffff?text=Image+Generation+Failed",
        prompt: "Placeholder image",
        error: error.message || "Failed to generate image",
      },
      { status: 500 }
    )
  }
}
