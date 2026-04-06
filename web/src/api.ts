// Fetch wrapper that automatically sends credentials (HTTP-only cookie)
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {}
  // Don't set Content-Type for FormData — the browser must set it automatically
  // with the correct multipart/form-data boundary string
  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      ...headers,
      ...init.headers,
    },
  })
}
