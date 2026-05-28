'use client'
import { useEffect } from 'react'

const API       = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const TOKEN_KEY = 'nex_access_token'

export default function AuthProvider() {
  useEffect(() => {
    const existing = localStorage.getItem(TOKEN_KEY)
    if (existing) return

    // No token in localStorage — try to recover using the httpOnly cookie
    fetch(`${API}/auth/refresh`, {
      method:      'POST',
      credentials: 'include',
    })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.accessToken) {
          localStorage.setItem(TOKEN_KEY, json.data.accessToken)
        }
      })
      .catch(() => {})
  }, [])

  return null
}