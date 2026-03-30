// Auth storage helpers
export function getToken(): string | null {
  const auth = localStorage.getItem('mound_auth')
  if (!auth) return null
  try {
    return (JSON.parse(auth) as { token?: string }).token ?? null
  } catch {
    return null
  }
}

export function setAuth(data: { email: string; name: string; token: string }) {
  localStorage.setItem('mound_auth', JSON.stringify(data))
}

export function clearAuth() {
  localStorage.removeItem('mound_auth')
}

// Fetch wrapper that automatically adds Authorization header
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken()
  return fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
}
