// ---------------------------------------------------------------------------
// API client — a thin, typed wrapper over fetch.
//
// .NET analogy: this is your typed HttpClient + a DelegatingHandler for auth,
// minus the DI ceremony. Deliberately dependency-free (no axios) — fetch is
// built into every browser and does everything we need here. If you later want
// interceptors/retries/cancellation sugar, axios is a reasonable swap; this
// file is the only thing that would change.
//
// Design choices worth knowing:
//  - One place sets the base URL and auth header, so calls stay terse.
//  - Non-2xx responses THROW (fetch does NOT throw on 4xx/5xx by itself — a
//    classic gotcha for people coming from HttpClient, where you'd check
//    EnsureSuccessStatusCode). We replicate EnsureSuccessStatusCode here.
//  - Responses are typed via generics: request<WeatherForecast[]>(...).
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL

/** Error thrown for any non-2xx response. Carries status + parsed body. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
  ) {
    super(`API ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

// Auth token holder. Swap this for a Pinia store / composable once you add
// real auth. Keeping it module-local for now means every request below
// automatically attaches the bearer token if one is set — same idea as a
// DelegatingHandler injecting the Authorization header.
let authToken: string | null = null
export function setAuthToken(token: string | null): void {
  authToken = token
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** JSON-serializable body. Serialized + Content-Type set automatically. */
  json?: unknown
}

async function request<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { json, headers, ...rest } = options

  const finalHeaders = new Headers(headers)
  if (json !== undefined) {
    finalHeaders.set('Content-Type', 'application/json')
  }
  if (authToken) {
    finalHeaders.set('Authorization', `Bearer ${authToken}`)
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  })

  // fetch resolves successfully for 404/500 etc. We must check .ok ourselves.
  if (!response.ok) {
    const errorBody = await safeParse(response)
    throw new ApiError(response.status, response.statusText, errorBody)
  }

  // 204 No Content has no body to parse.
  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}

/** Best-effort body parse for error responses (may be JSON, text, or empty). */
async function safeParse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

// Public surface. Each verb is a tiny generic wrapper. Add put/patch/delete
// the same way as you need them.
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, json?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', json }),
}
