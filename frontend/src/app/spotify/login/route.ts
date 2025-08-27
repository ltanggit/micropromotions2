// // src/app/spotify/login/route.ts
// import { NextResponse } from 'next/server';

// const SCOPES = [
//   'streaming',
//   'user-read-email',
//   'user-read-private',
//   'user-modify-playback-state',
//   'user-read-playback-state',
// ].join(' ');

// function randVerifier(len = 64) {
//   const charset =
//     'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
//   const a = Array.from(crypto.getRandomValues(new Uint8Array(len)));
//   return a.map((x) => charset[x % charset.length]).join('');
// }

// async function sha256base64url(input: string) {
//   const data = new TextEncoder().encode(input);
//   const digest = await crypto.subtle.digest('SHA-256', data);
//   return Buffer.from(digest)
//     .toString('base64')
//     .replace(/\+/g, '-')
//     .replace(/\//g, '_')
//     .replace(/=+$/, '');
// }

// export async function GET() {
//   const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
//   const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
//   const verifier = randVerifier();
//   const challenge = await sha256base64url(verifier);

//   const params = new URLSearchParams({
//     client_id: clientId,
//     response_type: 'code',
//     redirect_uri: redirectUri,
//     code_challenge_method: 'S256',
//     code_challenge: challenge,
//     scope: SCOPES,
//   });

//   const authUrl = `https://accounts.spotify.com/authorize?${params}`;

//   const res = NextResponse.redirect(authUrl);
//   // Keep the PKCE verifier for the callback
//   res.cookies.set('spotify_pkce_verifier', verifier, {
//     httpOnly: true,
//     secure: true,
//     sameSite: 'lax',
//     path: '/',
//     maxAge: 10 * 60, // 10 minutes
//   });
//   return res;
// }