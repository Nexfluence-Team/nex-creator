const TOKEN_KEY = 'nex_access_token'
const API       = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export function getToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

export async function refreshToken(): Promise<string | null> {
  try {
    const res  = await fetch(`${API}/auth/refresh`, {
      method:      'POST',
      credentials: 'include',
    })
    const json = await res.json()
    if (!json.success) return null
    setToken(json.data.accessToken)
    return json.data.accessToken
  } catch {
    return null
  }
}

export async function getValidToken(): Promise<string> {
  const token = getToken()
  if (token) return token
  const fresh = await refreshToken()
  return fresh ?? ''
}