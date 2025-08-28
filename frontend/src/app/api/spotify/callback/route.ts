import { NextRequest, NextResponse } from 'next/server';

async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
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
 * GET /api/spotify/callback?code=...&state=nonce
 */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code') || '';
    const state = req.nextUrl.searchParams.get('state') || '';
    if (!code || !state) {
      return NextResponse.json({ error: 'missing_params' }, { status: 400 });
    }

    // Verify state (nonce from cookie)
    const stateCookie = req.cookies.get('spotify_oauth_state')?.value || '';
    if (state !== stateCookie) {
      return NextResponse.json({ error: 'invalid_state. state: ' + state + ' stateCookie: ' + stateCookie }, { status: 400 });
    }

    // Pull returnTo from cookie
    const returnToCookie = req.cookies.get('spotify_return')?.value || '/';
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
    const tokenData = await exchangeCodeForTokens(code, redirectUri);

    const base = req.nextUrl.origin;
    const returnTo = new URL(returnToCookie, base);

    const res = NextResponse.redirect(returnTo);

    res.cookies.set('spotify_access', tokenData.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: tokenData.expires_in,
    });

    if (tokenData.refresh_token) {
      res.cookies.set('spotify_refresh', tokenData.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV !== 'development',
        path: '/',
        maxAge: 30 * 24 * 3600,
      });
    }

    // clear state + return cookies
    res.cookies.set('spotify_oauth_state', '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV !== 'development', path: '/', maxAge: 0 });
    res.cookies.set('spotify_return', '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV !== 'development', path: '/', maxAge: 0 });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'callback_failed' }, { status: 500 });
  }
}