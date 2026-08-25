import { NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { caption, brandColors, style, aspectRatio } = body

    console.log("[Image Generator] Received:", body)

    const imagePrompt = `Professional social media image for: ${caption}

Visual style: ${style || "modern and clean"}
Color palette: ${brandColors?.join(", ") || "vibrant and engaging"}
Aspect ratio: ${aspectRatio || "1:1"}
Mood: Eye-catching, engaging, professional

CRITICAL INSTRUCTION: DO NOT include any text, typography, letters, words, or watermarks in this image. The image must be a pure graphic or photograph with NO text whatsoever. 

Create a high-quality image that is visually appealing and on-brand.`

    console.log("[Image Generator] Prompt:", imagePrompt)

    // Using Pollinations AI for free, keyless image generation
    const encodedPrompt = encodeURIComponent(imagePrompt)
    const seed = Math.floor(Math.random() * 1000000)
    let width = 1080
    let height = 1080
    
    if (aspectRatio === "16:9") {
      height = 607
    } else if (aspectRatio === "9:16") {
      width = 607
    }

    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`
    
    console.log("[Image Generator] Generated Image URL:", imageUrl)

    return NextResponse.json({
      imageUrl,
      prompt: imagePrompt,
      aspectRatio: aspectRatio || "1:1",
    })
  } catch (error: any) {
    console.error("[Image Generator] Error:", error.message)
    // 👇 THIS IS THE IMPORTANT PART — print the FULL error, not just .message
    console.error("[Image Generator] Full error object:", JSON.stringify(error, null, 2))
    console.error("[Image Generator] Error message:", error.message)
    console.error("[Image Generator] Error status:", error.status)
    console.error("[Image Generator] Error body:", error.body)

    return NextResponse.json({
      imageUrl: "https://placehold.co/1080x1080/8b5cf6/ffffff?text=Image+Generation+Failed",
      prompt: "Placeholder image",
      error: error.message,
    },)
  }
}
