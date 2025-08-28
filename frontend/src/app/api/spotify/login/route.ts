import { NextRequest, NextResponse } from 'next/server';

function randomString(len = 24) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * GET /api/spotify/login?returnTo=/spotify/connect
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!; // e.g. https://your-tunnel.trycloudflare.com/api/spotify/callback
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Missing SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI' }, { status: 500 });
  }

  const returnTo = req.nextUrl.searchParams.get('returnTo') || '/';

  // 1) Short state (nonce only)
  const nonce = randomString(24);

  // 2) Save returnTo in a cookie (tiny)
  const resOrigin = req.nextUrl.origin;

  const res = NextResponse.redirect(new URL(
    'https://accounts.spotify.com/authorize?' + new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing'
      ].join(' '),
      state: nonce,
    }).toString()
  ));

  // IMPORTANT: set cookies for the SAME host you are browsing (your HTTPS tunnel)
  res.cookies.set('spotify_oauth_state', nonce, {
    httpOnly: true,
    sameSite: 'lax',
    // secure: process.env.NODE_ENV !== 'development', // must be true on HTTPS tunnel
    secure: true,
    path: '/',
    maxAge: 10 * 60,
  });

  res.cookies.set('spotify_return', returnTo, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV !== 'development',
    path: '/',
    maxAge: 10 * 60,
  });

  return res;
}