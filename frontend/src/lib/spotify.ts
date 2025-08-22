// src/lib/spotify.ts
export async function getSpotifyAccessToken(): Promise<string> {
  const r = await fetch('/api/spotify/token', { credentials: 'include' });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'token_error');
  return j.token as string;
}