export async function checkQuota(...args: any[]) {
  const action = typeof args[0] === "string" ? args[0] : "create";
  try {
    const response = await fetch(`/api/user/quota?action=${encodeURIComponent(action)}`)
    if (!response.ok) {
      return { allowed: true, remaining: 100 }
    }
    const data = await response.json()
    return data
  } catch (err) {
    console.error("Quota check error:", err)
    return { allowed: true, remaining: 100 }
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    })
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, data }
  } catch (error: any) {
    console.error(`API fetch error for ${endpoint}:`, error)
    return { ok: false, status: 500, error: error.message || "Network error" }
  }
}
