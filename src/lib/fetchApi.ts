/**
 * Fetch wrapper that always bypasses browser cache for API calls.
 * Drop-in replacement for fetch() — same signature, same return type.
 */
export function fetchApi(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, { ...init, cache: 'no-store' });
}
