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