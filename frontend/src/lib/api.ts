// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

// Accept string | null here
export function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T = any>(
  path: string,
  opts: { method?: HttpMethod; token?: string | null; body?: any } = {}
): Promise<T> {

  const { method = 'GET', token, body } = opts;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...authHeaders(token), // token can be string | null
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}
