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