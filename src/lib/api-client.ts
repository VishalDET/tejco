/**
 * API Client — Base HTTP utility
 * Base URL is read from NEXT_PUBLIC_API_BASE_URL env var,
 * falling back to the local dev server.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://tejco.digitaledgetech.in/api"

// Bypass TLS certificate verification for local development on the server
// This is necessary because Node.js rejects self-signed certificates by default.
if (
  typeof window === "undefined" &&
  API_BASE_URL.includes("localhost") &&
  process.env.NODE_ENV === "development"
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options

  if (process.env.NODE_ENV === 'development') {
    console.log(`[apiClient] Fetching: ${API_BASE_URL}${path}`)
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let message = `API error ${res.status}: ${res.statusText}`
    let data = null
    try {
      data = await res.json()
      message = data?.message ?? data?.title ?? message
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
