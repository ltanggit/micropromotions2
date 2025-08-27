// // src/app/spotify/refresh/route.ts
// import { NextResponse } from 'next/server';

// export async function POST(req: Request) {
//   try {
//     const { refresh_token, client_id } = await req.json();
//     if (!refresh_token || !client_id) {
//       return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
//     }

//     const body = new URLSearchParams({
//       grant_type: 'refresh_token',
//       refresh_token,
//       client_id,
//     });

//     const resp = await fetch('https://accounts.spotify.com/api/token', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//       body,
//     });

//     const data = await resp.json();
//     if (!resp.ok) return NextResponse.json({ error: data }, { status: resp.status });

//     return NextResponse.json(data);
//   } catch (e: any) {
//     return NextResponse.json({ error: e?.message ?? 'Refresh failed' }, { status: 500 });
//   }
// }
