import { type NextRequest, NextResponse } from "next/server"
import JSZip from "jszip"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl, caption, hashtags, cta, platform, brandName } = body

    console.log("[v0] Download request:", { platform, brandName })

    // Create a ZIP file
    const zip = new JSZip()

    // Add caption and hashtags as text file
    let textContent = `${brandName} - ${platform.toUpperCase()} Content\n\n`
    textContent += `CAPTION:\n${caption}\n\n`
    if (cta) {
      textContent += `CALL TO ACTION:\n${cta}\n\n`
    }
    if (hashtags && hashtags.length > 0) {
      textContent += `HASHTAGS:\n${hashtags.map((tag: string) => `#${tag}`).join(" ")}\n`
    }
    zip.file("content.txt", textContent)

    // Download and add image to ZIP
    if (imageUrl) {
      try {
        const imageResponse = await fetch(imageUrl)
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob()
          const imageBuffer = await imageBlob.arrayBuffer()
          const extension = imageUrl.split(".").pop()?.split("?")[0] || "jpg"
          zip.file(`image.${extension}`, imageBuffer)
        }
      } catch (error) {
        console.error("[v0] Error downloading image:", error)
      }
    }

    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" })

    return new NextResponse(zipBlob, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${brandName}-${platform}-content.zip"`,
      },
    })
  } catch (error) {
    console.error("[v0] Download error:", error)
    return NextResponse.json({ error: "Failed to create download" }, { status: 500 })
  }
}
