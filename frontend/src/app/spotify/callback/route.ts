// // src/app/spotify/callback/route.ts
// import { NextResponse } from 'next/server';
// import { cookies } from 'next/headers';

// export async function GET(req: Request) {
//   const url = new URL(req.url);
//   const code = url.searchParams.get('code');
//   const error = url.searchParams.get('error');

//   if (error) {
//     return NextResponse.redirect(`/?spotify_error=${encodeURIComponent(error)}`);
//   }
//   if (!code) {
//     return NextResponse.redirect('/?spotify_error=missing_code');
//   }

//   const jar = await cookies();
//   const verifier = jar.get('spotify_pkce_verifier')?.value;
//   if (!verifier) {
//     return NextResponse.redirect('/?spotify_error=missing_verifier');
//   }

//   const body = new URLSearchParams({
//     client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
//     grant_type: 'authorization_code',
//     code,
//     redirect_uri: process.env.SPOTIFY_REDIRECT_URI!, // MUST match exactly
//     code_verifier: verifier,
//   });

//   const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//     body,
//   });

//   if (!tokenRes.ok) {
//     const txt = await tokenRes.text();
//     return NextResponse.redirect('/?spotify_error=' + encodeURIComponent(txt));
//   }

//   const tokens = await tokenRes.json() as {
//     access_token: string;
//     refresh_token?: string;
//     expires_in: number;
//     token_type: string;
//     scope: string;
//   };

//   // Save tokens (simple: httpOnly cookies). In production you may want a server session.
//   const res = NextResponse.redirect('/worker/dashboard');
//   res.cookies.set('spotify_access_token', tokens.access_token, {
//     httpOnly: true,
//     secure: true,
//     sameSite: 'lax',
//     path: '/',
//     maxAge: tokens.expires_in - 30,
//   });
//   if (tokens.refresh_token) {
//     res.cookies.set('spotify_refresh_token', tokens.refresh_token, {
//       httpOnly: true,
//       secure: true,
//       sameSite: 'lax',
//       path: '/',
//       maxAge: 60 * 60 * 24 * 30,
//     });
//   }
//   // clear the PKCE verifier
//   res.cookies.set('spotify_pkce_verifier', '', { path: '/', maxAge: 0 });
//   return res;
// }

import { NextRequest, NextResponse } from 'next/server';

async function exchangeCodeForTokens(code: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
  });

  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID!}:${process.env.SPOTIFY_CLIENT_SECRET!}`
  ).toString('base64');

  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body,
  });

  if (!r.ok) {
    throw new Error(`Token exchange failed: ${r.status}`);
  }
  return r.json() as Promise<{
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
  }>;
}

function verifyState(raw: string) {
  const [nonce, encodedReturnTo, sig] = raw.split('|');
  if (!nonce || !encodedReturnTo || !sig) return { ok: false as const };

  const crypto = require('crypto') as typeof import('crypto');
  const payload = `${nonce}|${encodedReturnTo}`;
  const expected = crypto
    .createHmac('sha256', process.env.SPOTIFY_STATE_SECRET!)
    .update(payload)
    .digest('base64url');

  if (expected !== sig) return { ok: false as const };
  return { ok: true as const, returnTo: decodeURIComponent(encodedReturnTo) };
}

export async function GET(req: NextRequest) {
  try {
    const code = (req.nextUrl.searchParams.get('code') ?? '').toString();
    const state = (req.nextUrl.searchParams.get('state') ?? '').toString();
    if (!code || !state) return NextResponse.json({ error: 'missing_params' }, { status: 400 });

    const check = verifyState(state);
    if (!check.ok) return NextResponse.json({ error: 'invalid_state: ' + state }, { status: 400 });

    const data = await exchangeCodeForTokens(code);

    // Set httpOnly cookies on the SAME ORIGIN (tunnel) – they will stick.
    const res = NextResponse.redirect(check.returnTo || '/spotify/connect');

    res.cookies.set('spotify_access', data.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: data.expires_in, // seconds
    });

    if (data.refresh_token) {
      res.cookies.set('spotify_refresh', data.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: 30 * 24 * 3600, // ~30 days
      });
    }

    // Cleanup hint cookie
    res.cookies.delete('spotify_csrf_hint');

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'callback_failed' }, { status: 500 });
  }
}
