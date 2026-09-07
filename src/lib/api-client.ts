/**
 * API Client — Base HTTP utility
 * Base URL is read from NEXT_PUBLIC_API_BASE_URL env var,
 * falling back to the local dev server.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://tejco.digitaledgetech.in/api"

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options

  if (import.meta.env.DEV) {
    console.log(`[apiClient] Fetching: ${API_BASE_URL}${path}`)
  }

  const token = localStorage.getItem("tejco_auth_token")

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let message = `API error ${res.status}: ${res.statusText}`
    let data = null
    try {
      data = await res.json()
      console.error(`[apiClient] Error ${res.status} on ${path}:`, data)
      if (data && typeof data === "object") {
        if (data.errors && typeof data.errors === "object") {
          const detailMsgs = Object.entries(data.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
            .join(" | ")
          message = `${data.title ?? data.message ?? message} (${detailMsgs})`
        } else {
          message = data.message ?? data.title ?? message
        }
      }
    } catch {
      // ignore parse errors
    }

    const error = new Error(message) as any
    error.status = res.status
    error.info = data
    throw error
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body, ...options }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PUT", body, ...options }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PATCH", body, ...options }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...options }),
}
