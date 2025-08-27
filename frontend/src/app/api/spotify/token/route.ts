// import { NextRequest, NextResponse } from 'next/server';

// async function refreshTokens(refreshToken: string) {
//   const body = new URLSearchParams({
//     grant_type: 'refresh_token',
//     refresh_token: refreshToken,
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
//     cache: 'no-store',
//   });

//   if (!r.ok) throw new Error(`Refresh failed: ${r.status}`);
//   return r.json() as Promise<{ access_token: string; expires_in: number; refresh_token?: string }>;
// }

// export async function GET(req: NextRequest) {
//   try {
//     const cookies = req.cookies;
//     let access = cookies.get('spotify_access')?.value;
//     const refresh = cookies.get('spotify_refresh')?.value;

//     // If we still have a non-expired access token, just return it.
//     if (access) return NextResponse.json({ access_token: access });

//     if (!refresh) {
//       return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
//     }

//     const data = await refreshTokens(refresh);
//     access = data.access_token;

//     const res = NextResponse.json({ access_token: access });

//     res.cookies.set('spotify_access', access, {
//       httpOnly: true,
//       sameSite: 'lax',
//       secure: true,
//       path: '/',
//       maxAge: data.expires_in,
//     });

//     if (data.refresh_token) {
//       res.cookies.set('spotify_refresh', data.refresh_token, {
//         httpOnly: true,
//         sameSite: 'lax',
//         secure: true,
//         path: '/',
//         maxAge: 30 * 24 * 3600,
//       });
//     }

//     return res;
//   } catch (err: any) {
//     return NextResponse.json({ error: err?.message ?? 'token_failed' }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from 'next/server';

async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
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
    throw new Error(`Refresh failed: ${text}`);
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
 * GET /api/spotify/token
 * - Returns a playable user access token for the Web Playback SDK.
 * - If access token missing, tries to refresh with cookie refresh token.
 */
export async function GET(req: NextRequest) {
  try {
    const access = req.cookies.get('spotify_access')?.value;
    const refresh = req.cookies.get('spotify_refresh')?.value;

    if (access) {
      return NextResponse.json({ access_token: access, from: 'cookie' });
    }

    if (!refresh) {
      return NextResponse.json({ error: 'no_token' }, { status: 401 });
    }

    const data = await refreshAccessToken(refresh);

    const res = NextResponse.json({ access_token: data.access_token, from: 'refresh' });
    res.cookies.set('spotify_access', data.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: data.expires_in,
    });

    // Some refresh responses also include a new refresh_token
    if (data.refresh_token) {
      res.cookies.set('spotify_refresh', data.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV !== 'development',
        path: '/',
        maxAge: 30 * 24 * 3600,
      });
    }

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'token_failed' }, { status: 500 });
  }
}
