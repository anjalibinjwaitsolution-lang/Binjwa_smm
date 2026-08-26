export async function callBrandAnalyzer(brandData: {
  logo?: string
  colors: string[]
  voice: string
  keywords: string[]
}) {
  console.log("[v0] Calling Brand Analyzer with:", brandData)

  const response = await fetch("/api/agents/brand-analyzer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(brandData),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ details: "Brand analysis failed" }))
    console.error("[v0] Brand Analyzer failed:", error)
    throw new Error(error.details || "Brand analysis failed")
  }

  const result = await response.json()
  console.log("[v0] Brand Analyzer result:", result)
  return result
}

export async function callStrategist(data: {
  brandProfile: any
  topic: string
  platforms: string[]
  tone: string
}) {
  console.log("[v0] Calling Strategist with:", data)

  const response = await fetch("/api/agents/content-strategist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ details: "Strategy creation failed" }))
    console.error("[v0] Strategist failed:", error)
    throw new Error(error.details || "Strategy creation failed")
  }

  const result = await response.json()
  console.log("[v0] Strategist result:", result)
  return result
}

export async function callCopywriter(data: {
  strategy: any
  maxLength?: number
  includeHashtags?: boolean
  includeCTA?: boolean
}) {
  console.log("[v0] Calling Copywriter with:", data)

  const response = await fetch("/api/agents/copywriter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ details: "Copy generation failed" }))
    console.error("[v0] Copywriter failed:", error)
    throw new Error(error.error || error.details || "Copy generation failed")
  }

  const result = await response.json()
  console.log("[v0] Copywriter result:", result)
  return result
}

export async function callImageGenerator(data: {
  caption: string
  brandColors?: string[]
  style?: string
  aspectRatio?: string
}) {
  console.log("[v0] Calling Image Generator with:", data)

  const response = await fetch("/api/agents/image-generator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caption: data.caption,
      brandColors: data.brandColors,
      style: data.style,
      aspectRatio: data.aspectRatio || "1:1",
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ details: "Image generation failed" }))
    console.error("[v0] Image Generator failed:", error)
    throw new Error(error.error || error.details || "Image generation failed")
  }

  const result = await response.json()
  console.log("[v0] Image Generator result:", result)
  return result
}

export async function callOptimizer(data: {
  baseCopy: any
  image: any
  platforms: string[]
}) {
  console.log("[v0] Calling Optimizer with:", data)

  const response = await fetch("/api/agents/platform-optimizer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ details: "Optimization failed" }))
    console.error("[v0] Optimizer failed:", error)
    throw new Error(error.details || "Optimization failed")
  }

  const result = await response.json()
  console.log("[v0] Optimizer result:", result)
  return result
}

export async function callQualityChecker(data: {
  content: any
  brandGuidelines: any
}) {
  console.log("[v0] Calling Quality Checker with:", data)

  const response = await fetch("/api/agents/quality-checker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ details: "Quality check failed" }))
    console.error("[v0] Quality Checker failed:", error)
    throw new Error(error.details || "Quality check failed")
  }

  const result = await response.json()
  console.log("[v0] Quality Checker result:", result)
  return result
}
