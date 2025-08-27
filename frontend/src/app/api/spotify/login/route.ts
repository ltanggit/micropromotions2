// import { NextRequest, NextResponse } from 'next/server';
// import crypto from 'crypto';

// function hmac(data: string, secret: string) {
//   return crypto.createHmac('sha256', secret).update(data).digest('base64url');
// }

// export async function GET(req: NextRequest) {
//   const env = process.env;
//   const clientId = env.SPOTIFY_CLIENT_ID!;
//   const redirectUri = env.SPOTIFY_REDIRECT_URI!;
//   const scopes =
//     env.SPOTIFY_SCOPES ??
//     'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state';

//   const returnTo = (req.nextUrl.searchParams.get('returnTo') ?? '/spotify/connect').toString();

//   // Create signed state (cookie-less)
//   const nonce = crypto.randomBytes(16).toString('base64url');
//   const statePayload = `${nonce}|${encodeURIComponent(returnTo)}`;
//   const sig = hmac(statePayload, env.SPOTIFY_STATE_SECRET!);
//   const state = `${statePayload}|${sig}`;

//   // Build authorize URL
//   const params = new URLSearchParams({
//     response_type: 'code',
//     client_id: clientId,
//     redirect_uri: redirectUri,
//     scope: scopes,
//     state: state
//   });

//   const authorizeUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

//   // Optionally drop a short-lived cookie to help debug CSRF (not required)
//   const res = NextResponse.redirect(authorizeUrl);
//   res.cookies.set('spotify_csrf_hint', nonce, {
//     httpOnly: true,
//     sameSite: 'lax',
//     secure: true,
//     path: '/',
//     maxAge: 10 * 60,
//   });
//   return res;
// }

import { NextRequest, NextResponse } from 'next/server';

function randomString(len = 32) {
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
    return NextResponse.json({ error: 'Missing env SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI' }, { status: 500 });
  }

  const origin = req.nextUrl.origin; // Your current public origin
  const returnTo = req.nextUrl.searchParams.get('returnTo') || '/';
  const nonce = randomString(32);
  const state = `${nonce}|${encodeURIComponent(returnTo)}`;

  // Build Spotify authorize URL
  const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing'
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    state
  });

  const authorizeUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  // Prepare redirect + set the state cookie (so we can verify it)
  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set('spotify_oauth_state', nonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV !== 'development', // true for HTTPS tunnels
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  });

  return res;
}
