// import { NextRequest, NextResponse } from 'next/server';

// async function exchangeCodeForTokens(code: string) {
//   const body = new URLSearchParams({
//     grant_type: 'authorization_code',
//     code,
//     redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
//   });

//   const basic = Buffer.from(
//     `${process.env.SPOTIFY_CLIENT_ID!}:${process.env.SPOTIFY_CLIENT_SECRET!}`
//   ).toString('base64');

//   const r = await fetch('https://accounts.spotify.com/api/token', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/x-www-form-urlencoded',
//       Authorization: `Basic ${basic}`,
//     },
//     body,
//   });

//   if (!r.ok) {
//     throw new Error(`Token exchange failed: ${r.status}`);
//   }
//   return r.json() as Promise<{
//     access_token: string;
//     token_type: string;
//     scope: string;
//     expires_in: number;
//     refresh_token?: string;
//   }>;
// }

// function verifyState(raw: string) {
//   const [nonce, encodedReturnTo, sig] = raw.split('|');
//   if (!nonce || !encodedReturnTo || !sig) return { ok: false as const };

//   const crypto = require('crypto') as typeof import('crypto');
//   const payload = `${nonce}|${encodedReturnTo}`;
//   const expected = crypto
//     .createHmac('sha256', process.env.SPOTIFY_STATE_SECRET!)
//     .update(payload)
//     .digest('base64url');

//   if (expected !== sig) return { ok: false as const };
//   return { ok: true as const, returnTo: decodeURIComponent(encodedReturnTo) };
// }

// export async function GET(req: NextRequest) {
//   try {
//     const code = (req.nextUrl.searchParams.get('code') ?? '').toString();
//     const state = (req.nextUrl.searchParams.get('state') ?? '').toString();
//     if (!code || !state) return NextResponse.json({ error: 'missing_params' }, { status: 400 });

//     const check = verifyState(state);
//     if (!check.ok) return NextResponse.json({ error: 'invalid_state' }, { status: 400 });

//     const data = await exchangeCodeForTokens(code);

//     // Set httpOnly cookies on the SAME ORIGIN (tunnel) – they will stick.
//     const res = NextResponse.redirect(check.returnTo || '/spotify/connect');

//     res.cookies.set('spotify_access', data.access_token, {
//       httpOnly: true,
//       sameSite: 'lax',
//       secure: true,
//       path: '/',
//       maxAge: data.expires_in, // seconds
//     });

//     if (data.refresh_token) {
//       res.cookies.set('spotify_refresh', data.refresh_token, {
//         httpOnly: true,
//         sameSite: 'lax',
//         secure: true,
//         path: '/',
//         maxAge: 30 * 24 * 3600, // ~30 days
//       });
//     }

//     // Cleanup hint cookie
//     res.cookies.delete('spotify_csrf_hint');

//     return res;
//   } catch (err: any) {
//     return NextResponse.json({ error: err?.message ?? 'callback_failed' }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from 'next/server';

async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri
  });

  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed: ${text}`);
  }
  return resp.json() as Promise<{
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
  }>;
}

/**
 * GET /api/spotify/callback?code=...&state=nonce|%2FreturnTo
 */
export async function GET(req: NextRequest) {
  try {
    const code = (req.nextUrl.searchParams.get('code') ?? '').toString();
    const state = (req.nextUrl.searchParams.get('state') ?? '').toString();
    if (!code || !state) {
      return NextResponse.json({ error: 'missing_params' }, { status: 400 });
    }

    // Verify state (nonce stored in cookie)
    const stateCookie = req.cookies.get('spotify_oauth_state')?.value || '';
    const [nonce, encodedReturnTo] = state.split('|');
    if (!nonce || nonce !== stateCookie) {
      return NextResponse.json({ error: 'invalid_state' }, { status: 400 });
    }
    const returnToPath = decodeURIComponent(encodedReturnTo || '/') || '/';

    const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
    const tokenData = await exchangeCodeForTokens(code, redirectUri);

    // Build absolute returnTo URL for NextResponse.redirect
    const base = req.nextUrl.origin;
    const returnTo = new URL(returnToPath, base);

    const res = NextResponse.redirect(returnTo);

    // Set access + refresh cookie(s)
    res.cookies.set('spotify_access', tokenData.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: tokenData.expires_in, // seconds
    });

    if (tokenData.refresh_token) {
      res.cookies.set('spotify_refresh', tokenData.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV !== 'development',
        path: '/',
        maxAge: 30 * 24 * 3600, // 30 days
      });
    }

    // Clear state cookie
    res.cookies.set('spotify_oauth_state', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: 0,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'callback_failed' }, { status: 500 });
  }
}
