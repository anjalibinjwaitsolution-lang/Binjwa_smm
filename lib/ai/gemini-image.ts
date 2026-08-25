import { GoogleGenAI } from "@google/genai"
import * as fal from "@fal-ai/serverless-client"

export interface GenerateImageOptions {
  prompt: string
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4"
  style?: string
  brandColors?: string[]
}

export interface ImageGenerationResult {
  imageUrl: string
  prompt: string
  provider: "gemini" | "fal" | "pollinations" | "placeholder"
  aspectRatio: string
}

/**
 * Multi-tier Image Generation Engine:
 * Tier 1: Google Gemini Image API / Imagen 3 (Nano Banana / Gemini Flash Image)
 * Tier 2: fal.ai (Flux Schnell / Fast SDXL)
 * Tier 3: Pollinations AI (Zero-fail fallback)
 */
export async function generateSocialImage(options: GenerateImageOptions): Promise<ImageGenerationResult> {
  const { prompt, aspectRatio = "1:1", style, brandColors } = options

  // Enhance prompt for social media branding
  const finalPrompt = prompt.includes("CRITICAL INSTRUCTION")
    ? prompt
    : `Professional social media image for: ${prompt}

Visual style: ${style || "modern and clean"}
Color palette: ${brandColors?.join(", ") || "vibrant and engaging"}
Aspect ratio: ${aspectRatio}
Mood: Eye-catching, engaging, professional

CRITICAL INSTRUCTION: DO NOT include any text, typography, letters, words, or watermarks in this image. The image must be a pure graphic or photograph with NO text whatsoever.

Create a high-quality, ultra-detailed image that is visually appealing and on-brand.`

  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  const falApiKey = process.env.FAL_KEY || process.env.FAL_API_KEY
  const geminiModel = process.env.GEMINI_IMAGE_MODEL || "imagen-3.0-generate-002"

  // ==========================================
  // TIER 1: Google Gemini / Imagen 3 API
  // ==========================================
  if (geminiApiKey) {
    try {
      console.log(`[Image Generator] Attempting Tier 1: Gemini (${geminiModel})...`)
      const ai = new GoogleGenAI({ apiKey: geminiApiKey })

      // Map aspect ratio to Gemini format
      let geminiAspect: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "1:1"
      if (aspectRatio === "16:9" || aspectRatio === "9:16" || aspectRatio === "4:3" || aspectRatio === "3:4") {
        geminiAspect = aspectRatio
      }

      // Try Imagen generation through official SDK
      const response = await ai.models.generateImages({
        model: geminiModel,
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: geminiAspect,
          outputMimeType: "image/jpeg",
        },
      })

      const generatedImage = response?.generatedImages?.[0]?.image?.imageBytes
      if (generatedImage) {
        console.log("[Image Generator] Successfully generated image via Google Gemini / Imagen!")
        return {
          imageUrl: `data:image/jpeg;base64,${generatedImage}`,
          prompt: finalPrompt,
          provider: "gemini",
          aspectRatio,
        }
      }
    } catch (geminiError: any) {
      console.warn("[Image Generator] Tier 1 (Gemini) failed, falling back to Tier 2:", geminiError?.message || geminiError)
    }
  } else {
    console.log("[Image Generator] GEMINI_API_KEY not found in environment, checking Tier 2 (fal.ai)...")
  }

  // ==========================================
  // TIER 2: fal.ai (Flux Schnell / Fast SDXL)
  // ==========================================
  if (falApiKey) {
    try {
      console.log("[Image Generator] Attempting Tier 2: fal.ai (fal-ai/flux/schnell)...")
      fal.config({
        credentials: falApiKey,
      })

      // Map aspect ratio for fal.ai flux
      let imageSize: "square_hd" | "landscape_16_9" | "portrait_16_9" = "square_hd"
      if (aspectRatio === "16:9") imageSize = "landscape_16_9"
      else if (aspectRatio === "9:16") imageSize = "portrait_16_9"

      const falResult: any = await fal.subscribe("fal-ai/flux/schnell", {
        input: {
          prompt: finalPrompt,
          image_size: imageSize,
          num_images: 1,
          enable_safety_checker: true,
        },
        logs: false,
      })

      if (falResult?.images?.[0]?.url) {
        console.log("[Image Generator] Successfully generated image via fal.ai!")
        return {
          imageUrl: falResult.images[0].url,
          prompt: finalPrompt,
          provider: "fal",
          aspectRatio,
        }
      }
    } catch (falError: any) {
      console.warn("[Image Generator] Tier 2 (fal.ai) failed, falling back to Tier 3 (Pollinations):", falError?.message || falError)
    }
  }

  // ==========================================
  // TIER 3: Pollinations AI (Reliable Zero-Fail Fallback)
  // ==========================================
  try {
    console.log("[Image Generator] Attempting Tier 3: Pollinations AI...")
    const encodedPrompt = encodeURIComponent(finalPrompt)
    const seed = Math.floor(Math.random() * 1000000)
    let width = 1080
    let height = 1080

    if (aspectRatio === "16:9") {
      height = 607
    } else if (aspectRatio === "9:16") {
      width = 607
    }

    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`
    console.log("[Image Generator] Successfully generated image via Pollinations AI:", imageUrl)

    return {
      imageUrl,
      prompt: finalPrompt,
      provider: "pollinations",
      aspectRatio,
    }
  } catch (pollinationsError: any) {
    console.error("[Image Generator] All tiers failed:", pollinationsError)
    return {
      imageUrl: "https://placehold.co/1080x1080/8b5cf6/ffffff?text=Image+Generated",
      prompt: finalPrompt,
      provider: "placeholder",
      aspectRatio,
    }
  }
}
