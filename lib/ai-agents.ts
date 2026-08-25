// AI Agent API Integration Functions
// These functions handle communication with the backend AI agent endpoints

// Brand Analyzer Agent
// Analyzes brand assets to extract visual identity, tone, and key characteristics
export async function analyzeBrand(brandData: any) {
  const response = await fetch("/api/agents/brand-analyzer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      logo: brandData.logo,
      colors: brandData.colors,
      voice: brandData.voice,
      keywords: brandData.keywords,
    }),
  })

  if (!response.ok) {
    throw new Error("Brand analysis failed")
  }

  return await response.json()
}

// Content Strategist Agent
// Creates content strategy based on brand profile and content requirements
export async function planContent(brandAnalysis: any, contentRequest: any) {
  const response = await fetch("/api/agents/content-strategist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brandProfile: brandAnalysis,
      topic: contentRequest.topic,
      platforms: contentRequest.platforms,
      tone: contentRequest.tone,
    }),
  })

  if (!response.ok) {
    throw new Error("Content planning failed")
  }

  return await response.json()
}

// Copywriter Agent
// Generates engaging captions with hashtags and CTAs
export async function generateCopy(strategy: any) {
  const response = await fetch("/api/agents/copywriter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      strategy: strategy,
      maxLength: 280,
      includeHashtags: true,
      includeCTA: true,
    }),
  })

  if (!response.ok) {
    throw new Error("Copy generation failed")
  }

  return await response.json()
}

// Image Generator Agent
// Creates visuals that match the brand identity and caption
export async function generateImage(copy: any, brandProfile: any) {
  const response = await fetch("/api/agents/image-generator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caption: copy.text,
      brandColors: brandProfile.colors,
      style: brandProfile.visualStyle,
      aspectRatio: "1:1",
    }),
  })

  if (!response.ok) {
    throw new Error("Image generation failed")
  }

  return await response.json()
}

// Platform Optimizer Agent
// Adapts content for different social media platforms
export async function optimizeForPlatforms(allResults: any) {
  const response = await fetch("/api/agents/platform-optimizer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      baseCopy: allResults.copywriter,
      image: allResults["image-gen"],
      platforms: ["instagram", "facebook", "twitter", "linkedin", "threads", "pinterest", "whatsapp", "bluesky", "tiktok"],
    }),
  })

  if (!response.ok) {
    throw new Error("Platform optimization failed")
  }

  return await response.json()
}

// Quality Checker Agent
// Validates content consistency with brand guidelines
export async function checkQuality(allResults: any) {
  const response = await fetch("/api/agents/quality-checker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: allResults,
      brandGuidelines: allResults["brand-analyzer"],
    }),
  })

  if (!response.ok) {
    throw new Error("Quality check failed")
  }

  return await response.json()
}

// Type definitions for better TypeScript support
export interface BrandData {
  logo?: string
  colors: string[]
  voice: string
  keywords: string[]
}

export interface ContentRequest {
  topic: string
  platforms: string[]
  tone: string
}

export interface AgentResult {
  status: "success" | "error"
  data: any
  message?: string
}
