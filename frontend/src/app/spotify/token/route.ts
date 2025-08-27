// // frontend/src/app/spotify/token/route.ts
// // Next.js Route Handler: POST /api/spotify/token
// // Exchanges authorization code for access token using PKCE.
// import { NextResponse } from 'next/server';

// export async function POST(req: Request) {
//   try {
//     const { code, code_verifier, redirect_uri, client_id } = await req.json();

//     if (!code || !code_verifier || !redirect_uri || !client_id) {
//       return NextResponse.json(
//         { error: 'Missing required fields' },
//         { status: 400 }
//       );
//     }

//     const body = new URLSearchParams({
//       grant_type: 'authorization_code',
//       code,
//       redirect_uri,
//       client_id,
//       code_verifier,
//     });

//     const resp = await fetch('https://accounts.spotify.com/api/token', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//       body,
//       // Note: no Authorization header when using PKCE + public client
//     });

//     const data = await resp.json();

//     if (!resp.ok) {
//       // Pass Spotify’s error through for easier debugging
//       return NextResponse.json({ error: data }, { status: resp.status });
//     }

//     return NextResponse.json(data);
//   } catch (e: any) {
//     return NextResponse.json(
//       { error: e?.message ?? 'Token exchange failed' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';

async function refreshTokens(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
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
    cache: 'no-store',
  });

  if (!r.ok) throw new Error(`Refresh failed: ${r.status}`);
  return r.json() as Promise<{ access_token: string; expires_in: number; refresh_token?: string }>;
}

export async function GET(req: NextRequest) {
  try {
    const cookies = req.cookies;
    let access = cookies.get('spotify_access')?.value;
    const refresh = cookies.get('spotify_refresh')?.value;

    // If we still have a non-expired access token, just return it.
    if (access) return NextResponse.json({ access_token: access });

    if (!refresh) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }

    const data = await refreshTokens(refresh);
    access = data.access_token;

    const res = NextResponse.json({ access_token: access });

    res.cookies.set('spotify_access', access, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: data.expires_in,
    });

    if (data.refresh_token) {
      res.cookies.set('spotify_refresh', data.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: 30 * 24 * 3600,
      });
    }

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'token_failed' }, { status: 500 });
  }
}
