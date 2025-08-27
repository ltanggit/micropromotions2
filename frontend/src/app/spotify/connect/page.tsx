'use client';
import { useMemo } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!; // e.g. http://localhost:5000/api

export default function SpotifyConnectPage() {
  const returnTo = '/spotify/connect';
  const loginUrl = useMemo(() => {
    const u = new URL(`${API_BASE}/spotify/login`);
    u.searchParams.set('returnTo', returnTo);
    return u.toString();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-2">Connect Spotify</h1>
      <p className="text-sm opacity-80 mb-4">
        You’ll be redirected to Spotify to grant permission.
      </p>
      <a
        href={loginUrl}
        className="inline-block rounded bg-black text-white px-4 py-2"
      >
        Connect Spotify
      </a>
    </div>
  );
}

// 'use client';

// import { useMemo } from 'react';

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

// export default function SpotifyConnectPage() {
//   const url = useMemo(() => {
//     if (typeof window === 'undefined') return null;
//     return new URL(window.location.href);
//   }, []);

//   const connected = url?.searchParams.get('connected') === '1';
//   const error = url?.searchParams.get('error');

//   const loginHref = `${API_BASE}/spotify/login?returnTo=${encodeURIComponent(
//     '/spotify/connect'
//   )}`;

//   const testToken = async () => {
//     const r = await fetch(`${API_BASE}/spotify/token`, {
//       credentials: 'include', // <-- IMPORTANT (send cookies)
//     });
//     const j = await r.json();
//     alert(r.ok ? `Token OK: ${String(j.accessToken).slice(0, 10)}…` : `Error: ${j.error}`);
//   };

//   return (
//     <div className="max-w-xl mx-auto p-6 space-y-4">
//       <h1 className="text-2xl font-semibold">Connect Spotify</h1>
//       <p>You’ll be redirected to Spotify to grant permission.</p>

//       {error && <p className="text-red-600">Error: {error}</p>}

//       {!connected ? (
//         <a className="px-4 py-2 rounded bg-black text-white" href={loginHref}>
//           Connect Spotify
//         </a>
//       ) : (
//         <div className="space-y-2">
//           <p className="text-green-600">Connected ✓</p>
//           <button className="border px-3 py-1 rounded" onClick={testToken}>
//             Test token
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
