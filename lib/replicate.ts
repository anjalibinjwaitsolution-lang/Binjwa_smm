/**
 * Replicate API Integration
 *
 * This module provides utilities for interacting with the Replicate API
 * for AI image generation using models like Flux Schnell.
 */

interface ReplicateResponse {
  id: string
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled"
  output?: string[]
  error?: string
}

interface GenerateImageOptions {
  prompt: string
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:5" | "5:4"
  numOutputs?: number
  outputFormat?: "webp" | "jpg" | "png"
  outputQuality?: number
}

/**
 * Generate an image using Replicate's Flux Schnell model
 */
export async function generateImage(options: GenerateImageOptions): Promise<string> {
  const apiKey = process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_TOKEN || ""

  const { prompt, aspectRatio = "1:1", numOutputs = 1, outputFormat = "webp", outputQuality = 90 } = options

  // Start the prediction
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "black-forest-labs/flux-schnell",
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        num_outputs: numOutputs,
        output_format: outputFormat,
        output_quality: outputQuality,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Replicate API error: ${error}`)
  }

  const prediction = (await response.json()) as ReplicateResponse

  // Poll for completion
  return await pollForCompletion(prediction.id, apiKey)
}

/**
 * Poll Replicate API until the prediction is complete
 */
async function pollForCompletion(predictionId: string, apiKey: string): Promise<string> {
  const maxAttempts = 60 // 60 seconds timeout
  const pollInterval = 1000 // 1 second

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to check prediction status")
    }

    const prediction = (await response.json()) as ReplicateResponse

    if (prediction.status === "succeeded") {
      if (!prediction.output || prediction.output.length === 0) {
        throw new Error("No output generated")
      }
      return prediction.output[0]
    }

    if (prediction.status === "failed") {
      throw new Error(prediction.error || "Image generation failed")
    }

    if (prediction.status === "canceled") {
      throw new Error("Image generation was canceled")
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  throw new Error("Image generation timed out after 60 seconds")
}

/**
 * Create an optimized image prompt from content details
 */
export function createImagePrompt(caption: string, style: string, brandColors?: string[]): string {
  let prompt = `Create a professional social media image. Style: ${style}. `

  // Extract key themes from caption
  const captionWords = caption.split(" ").slice(0, 20).join(" ")
  prompt += `Content theme: ${captionWords}. `

  // Add brand colors if provided
  if (brandColors && brandColors.length > 0) {
    prompt += `Use brand colors: ${brandColors.join(", ")}. `
  }

  prompt += "High quality, eye-catching, modern design, professional photography style."

  return prompt
}
