import { Buffer } from 'buffer'

/**
 * Ensures that any image URL (base64 data URI, dynamic Pollinations AI URL, etc.)
 * is converted to a direct, fast, publicly accessible HTTPS image URL (.png / .jpg)
 * suitable for Instagram Graph API and Meta web crawlers.
 */
export async function ensurePublicImageUrl(url: string): Promise<string> {
  // If already a clean static HTTPS URL (not data:, not blob:, not pollinations), return as-is
  if (!url.startsWith('data:image/') && !url.startsWith('blob:') && !url.includes('pollinations.ai')) {
    return url
  }

  try {
    let base64String = ''

    if (url.startsWith('data:image/')) {
      base64String = url.split(',')[1] || ''
    } else {
      const resp = await fetch(url)
      if (!resp.ok) return url
      const buffer = await resp.arrayBuffer()
      base64String = Buffer.from(buffer).toString('base64')
    }

    if (!base64String) return url

    // Try Catbox.moe FIRST (returns direct .jpg CDN URLs like https://files.catbox.moe/xxx.jpg)
    try {
      const catboxForm = new FormData()
      const buffer = Buffer.from(base64String, 'base64')
      catboxForm.append('reqtype', 'fileupload')
      catboxForm.append('fileToUpload', new Blob([buffer], { type: 'image/jpeg' }), 'post.jpg')
      const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: catboxForm,
      })
      if (catboxRes.ok) {
        const text = (await catboxRes.text()).trim()
        if (text && text.startsWith('http') && (text.endsWith('.jpg') || text.endsWith('.png') || text.endsWith('.jpeg'))) {
          console.log('[Media Helper] Converted image using Catbox:', text)
          return text
        }
      }
    } catch (cbErr) {
      console.warn('[Media Helper] Catbox upload failed, trying ImgBB...', cbErr)
    }

    // Try ImgBB SECOND (reliable direct image URLs)
    try {
      const imgbbParams = new URLSearchParams()
      imgbbParams.append('key', 'c2c19e71ab8ca6dcfd0bfcc6c16ecfc2')
      imgbbParams.append('image', base64String)
      const imgbbRes = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: imgbbParams,
      })
      if (imgbbRes.ok) {
        const data = await imgbbRes.json()
        if (data?.data?.url) {
          console.log('[Media Helper] Converted image using ImgBB:', data.data.url)
          return data.data.url
        }
      }
    } catch (ibErr) {
      console.warn('[Media Helper] ImgBB upload failed, trying Freeimage...', ibErr)
    }

    // Try Freeimage.host THIRD (making sure to get direct image URL)
    try {
      const formData = new URLSearchParams()
      formData.append('key', '6d207e02198a847aa98d0a2a901485a5')
      formData.append('action', 'upload')
      formData.append('source', base64String)
      formData.append('format', 'json')

      const uploadRes = await fetch('https://freeimage.host/api/1/upload', {
        method: 'POST',
        body: formData,
      })

      if (uploadRes.ok) {
        const data = await uploadRes.json()
        const directUrl = data?.image?.image?.url || data?.image?.url
        if (directUrl && (directUrl.endsWith('.jpg') || directUrl.endsWith('.png') || directUrl.endsWith('.jpeg') || directUrl.includes('iili.io'))) {
          console.log('[Media Helper] Converted image using FreeImage:', directUrl)
          return directUrl
        }
      }
    } catch (fiErr) {
      console.warn('[Media Helper] Freeimage upload failed:', fiErr)
    }
  } catch (err) {
    console.error('[Media Helper] Error converting image for Graph API:', err)
  }

  // Preserve original data/blob URL if conversion attempts fail
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }

  return url
}
