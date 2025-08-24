// frontend/src/app/worker/job/[jobId]/page.tsx
// 'use client';

// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';

// const API_BASE = 'http://localhost:5000/api';

// // ---------------------- helpers ----------------------
// function parseSpotifyUriFromLink(link: string | undefined): { uri?: string; embedSrc?: string; type?: 'track'|'album'|'playlist' } {
//   if (!link) return {};
//   try {
//     const url = new URL(link);
//     if (url.hostname.includes('open.spotify.com')) {
//       const parts = url.pathname.split('/').filter(Boolean); // ["track","<id>"]
//       const type = parts[0] as 'track'|'album'|'playlist';
//       const id = parts[1];
//       if (id) {
//         const uri = `${type}:${id}`.replace(':', ':'); // e.g. "track:abc" (we will convert below)
//         const properUri = `spotify:${type}:${id}`;     // "spotify:track:abc"
//         const embedSrc = `https://open.spotify.com/embed/${type}/${id}`;
//         return { uri: properUri, embedSrc, type };
//       }
//     }
//   } catch {}
//   return {};
// }

// async function fetchJSON(input: RequestInfo | URL, init?: RequestInit) {
//   const res = await fetch(input, init);
//   if (!res.ok) {
//     const txt = await res.text().catch(() => '');
//     throw new Error(`${res.status} ${res.statusText} – ${txt}`);
//   }
//   return res.json();
// }

// // Load SDK exactly once
// function useSpotifySdkScript() {
//   const [ready, setReady] = useState(false);
//   useEffect(() => {
//     if ((window as any).Spotify?.Player) {
//       setReady(true);
//       return;
//     }
//     const script = document.createElement('script');
//     script.src = 'https://sdk.scdn.co/spotify-player.js';
//     script.async = true;
//     (window as any).onSpotifyWebPlaybackSDKReady = () => setReady(true);
//     document.body.appendChild(script);
//     return () => {
//       // no removal to keep global cb, but it’s fine
//     };
//   }, []);
//   return ready;
// }

// // ---------------------- page ----------------------
// export default function WorkerJobPage() {
//   const { jobId } = useParams<{ jobId: string }>();
//   const router = useRouter();

//   const [job, setJob] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState<string | null>(null);

//   // playback + timer state
//   const [deviceId, setDeviceId] = useState<string | null>(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [positionMs, setPositionMs] = useState(0);
//   const [durationMs, setDurationMs] = useState(0);

//   const requiredMs = 30_000;
//   const listenedMsRef = useRef(0);
//   const [listenedMsUi, setListenedMsUi] = useState(0); // for display

//   const [canSubmit, setCanSubmit] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [submitErr, setSubmitErr] = useState<string | null>(null);
//   const [submitOk, setSubmitOk] = useState(false);

//   // token
//   const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('spotify_access_token') || '' : ''), []);

//   // fetch job
//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       try {
//         setLoading(true);
//         const data = await fetchJSON(`${API_BASE}/jobs/${jobId}`, { cache: 'no-store' });
//         if (!alive) return;
//         setJob(data);
//       } catch (e: any) {
//         if (!alive) return;
//         setErr(e.message || 'Failed to load job');
//       } finally {
//         if (!alive) return;
//         setLoading(false);
//       }
//     })();
//     return () => { alive = false; };
//   }, [jobId]);

//   const { uri, embedSrc } = useMemo(() => parseSpotifyUriFromLink(job?.link), [job?.link]);

//   // SDK
//   const sdkReady = useSpotifySdkScript();
//   const playerRef = useRef<Spotify.Player | null>(null);
//   const progressTimerRef = useRef<number | null>(null);
//   const tickTimerRef = useRef<number | null>(null);
//   const currentTrackUriRef = useRef<string | undefined>(undefined);

//   // init player
//   useEffect(() => {
//     if (!sdkReady || !token) return;
//     if (playerRef.current) return;

//     const player = new (window as any).Spotify.Player({
//       name: 'SmashHaus In‑Page Player',
//       getOAuthToken: (cb: (t: string) => void) => cb(token),
//       volume: 0.8,
//     });

//     // device ready
//     player.addListener('ready', ({ device_id }: any) => {
//       setDeviceId(device_id);
//     });

//     // state changes
//     player.addListener('player_state_changed', (state: any) => {
//       if (!state) return;
//       setIsPlaying(!state.paused);
//       setPositionMs(state.position || 0);
//       setDurationMs(state.duration || 0);

//       const currentUri: string | undefined = state.track_window?.current_track?.uri;
//       currentTrackUriRef.current = currentUri;
//     });

//     player.addListener('initialization_error', ({ message }: any) => console.error('init_error', message));
//     player.addListener('authentication_error', ({ message }: any) => console.error('auth_error', message));
//     player.addListener('account_error', ({ message }: any) => console.error('account_error', message));
//     player.addListener('playback_error', ({ message }: any) => console.error('playback_error', message));

//     player.connect().then((ok: boolean) => {
//       if (!ok) console.error('Failed to connect player');
//     });

//     playerRef.current = player;
//     return () => {
//       player.removeListener('player_state_changed');
//       player.disconnect();
//       playerRef.current = null;
//     };
//   }, [sdkReady, token]);

//   // transfer playback & start the requested track once we have device + uri
//   const transferAndPlay = useCallback(async () => {
//     if (!deviceId || !uri || !token) return;
//     // transfer
//     await fetch('https://api.spotify.com/v1/me/player', {
//       method: 'PUT',
//       headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
//       body: JSON.stringify({ device_ids: [deviceId], play: false }),
//     });

//     // start track
//     const [_, type, id] = uri.split(':'); // spotify:track:ID
//     const apiPath = type === 'track'
//       ? `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`
//       : `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`;

//     const body =
//       type === 'track'
//         ? { uris: [uri] }
//         : { context_uri: uri }; // album/playlist

//     await fetch(apiPath, {
//       method: 'PUT',
//       headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
//       body: JSON.stringify(body),
//     });
//   }, [deviceId, uri, token]);

//   // attempt to transfer-and-play once all is ready
//   useEffect(() => {
//     if (deviceId && uri && token) {
//       transferAndPlay().catch((e) => console.error('transfer/play failed', e));
//     }
//   }, [deviceId, uri, token, transferAndPlay]);

//   // count "actual" listened time based on real playback state
//   useEffect(() => {
//     // UI progress (position) updater
//     if (progressTimerRef.current) {
//       clearInterval(progressTimerRef.current);
//       progressTimerRef.current = null;
//     }
//     if (isPlaying) {
//       progressTimerRef.current = window.setInterval(() => {
//         setPositionMs((p) => Math.min(p + 1000, durationMs || p + 1000));
//       }, 1000) as unknown as number;
//     }

//     // listened time counter (only when our requested track is playing)
//     if (tickTimerRef.current) {
//       clearInterval(tickTimerRef.current);
//       tickTimerRef.current = null;
//     }
//     if (isPlaying && currentTrackUriRef.current && uri && currentTrackUriRef.current.startsWith('spotify:')) {
//       tickTimerRef.current = window.setInterval(() => {
//         listenedMsRef.current += 1000;
//         setListenedMsUi(listenedMsRef.current);
//         if (listenedMsRef.current >= requiredMs) {
//           setCanSubmit(true);
//           clearInterval(tickTimerRef.current!);
//           tickTimerRef.current = null;
//         }
//       }, 1000) as unknown as number;
//     }

//     return () => {
//       if (progressTimerRef.current) clearInterval(progressTimerRef.current);
//       if (tickTimerRef.current) clearInterval(tickTimerRef.current);
//     };
//   }, [isPlaying, durationMs, uri]);

//   // controls
//   const togglePlay = async () => {
//     if (!playerRef.current) return;
//     await playerRef.current.togglePlay();
//   };
//   const next = async () => playerRef.current?.nextTrack();
//   const prev = async () => playerRef.current?.previousTrack();

//   const timeFmt = (ms: number) => {
//     const s = Math.max(0, Math.floor(ms / 1000));
//     const m = Math.floor(s / 60);
//     const rs = s % 60;
//     return `${m}:${rs.toString().padStart(2, '0')}`;
//     };

//   // submit (hit your backend review route)
//   const onSubmit = async () => {
//     if (!canSubmit || !jobId) return;
//     try {
//       setSubmitting(true);
//       setSubmitErr(null);

//       // Example: worker submit review (you said your route is /review, not /reviews)
//       const tokenApi = localStorage.getItem('token') || ''; // your app’s auth token for backend
//       const rating = 5; // replace with real form input
//       const feedback = 'Great track!'; // replace with real form input

//       const res = await fetch(`${API_BASE}/jobs/${jobId}/review`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           ...(tokenApi ? { Authorization: `Bearer ${tokenApi}` } : {}),
//         },
//         body: JSON.stringify({ rating, feedback }),
//       });

//       if (!res.ok) {
//         const text = await res.text();
//         throw new Error(text || 'Submit failed');
//       }

//       setSubmitOk(true);
//       // Optionally navigate worker away
//       // router.push('/worker/dashboard');
//     } catch (e: any) {
//       setSubmitErr(e.message || 'Submit failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // ---------------------- UI ----------------------
//   if (loading) return <div className="p-6">Loading job…</div>;
//   if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
//   if (!job) return <div className="p-6">Not found.</div>;

//   return (
//     <div className="max-w-4xl mx-auto px-4 pb-20">
//       <h1 className="text-2xl font-semibold mt-24 mb-2">{job.title}</h1>
//       <p className="text-sm text-gray-600 mb-6">{job.description}</p>

//       {/* Spotify embed for visuals/UX */}
//       {embedSrc ? (
//         <div className="w-full max-w-2xl">
//           <iframe
//             title="Spotify embed"
//             className="w-full rounded-lg"
//             style={{ height: 152, border: 0 }}
//             allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
//             loading="lazy"
//             src={`${embedSrc}?utm_source=generator`}
//           />
//         </div>
//       ) : (
//         <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
//           This job link isn’t a Spotify link—embed not available.
//         </div>
//       )}

//       {/* Transport & status (from SDK) */}
//       <div className="mt-6 flex items-center gap-3">
//         <button
//           onClick={prev}
//           className="px-3 py-2 rounded border hover:bg-gray-50"
//           disabled={!deviceId}
//         >
//           ◀︎ Prev
//         </button>
//         <button
//           onClick={togglePlay}
//           className="px-4 py-2 rounded border hover:bg-gray-50"
//           disabled={!deviceId}
//         >
//           {isPlaying ? 'Pause' : 'Play'}
//         </button>
//         <button
//           onClick={next}
//           className="px-3 py-2 rounded border hover:bg-gray-50"
//           disabled={!deviceId}
//         >
//           Next ▶︎
//         </button>

//         <div className="ml-4 text-sm text-gray-700">
//           {timeFmt(positionMs)} / {timeFmt(durationMs || 0)}
//         </div>
//         <div className="ml-auto text-xs text-gray-500">
//           Device: {deviceId ? deviceId.slice(0, 10) + '…' : '—'}
//         </div>
//       </div>

//       {/* Listening requirement */}
//       <div className="mt-6 p-4 rounded border bg-gray-50">
//         <div className="flex items-center justify-between">
//           <div>
//             <div className="text-sm font-medium">Listening requirement</div>
//             <div className="text-xs text-gray-600">
//               You must listen for at least 30 seconds on this page. Timer runs only while the in‑page player is actually playing the requested track.
//             </div>
//           </div>
//           <div className="text-right">
//             <div className="text-lg font-semibold">
//               {Math.ceil(Math.max(0, (requiredMs - listenedMsUi)) / 1000)}s left
//             </div>
//             <div className="text-xs text-gray-500">{Math.min(requiredMs, listenedMsUi) / 1000}s / 30s</div>
//           </div>
//         </div>

//         {/* progress bar */}
//         <div className="mt-4 h-2 w-full bg-gray-200 rounded">
//           <div
//             className="h-2 bg-blue-600 rounded"
//             style={{ width: `${Math.min(100, (listenedMsUi / requiredMs) * 100)}%` }}
//           />
//         </div>
//       </div>

//       {/* Submit */}
//       <div className="mt-6 flex gap-3">
//         <button
//           onClick={onSubmit}
//           disabled={!canSubmit || submitting}
//           className={`px-5 py-2 rounded text-white ${canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'} `}
//         >
//           {submitting ? 'Submitting…' : 'Submit Review'}
//         </button>
//         {submitErr && <div className="text-sm text-red-600">{submitErr}</div>}
//         {submitOk && <div className="text-sm text-green-600">Submitted!</div>}
//       </div>

//       {/* Debug (optional) */}
//       <details className="mt-6 text-xs text-gray-500">
//         <summary>Debug</summary>
//         <pre className="whitespace-pre-wrap text-[11px]">
// {JSON.stringify({ deviceId, isPlaying, positionMs, durationMs, requiredMs, listenedMs: listenedMsUi, uri, embedSrc }, null, 2)}
//         </pre>
//       </details>
//     </div>
//   );
// }

// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import { useParams } from 'next/navigation';
// import { api } from '@/lib/api';
// import { useAuth } from '@/lib/auth';
// import EmbedPlayerWithTimer from '@/components/EmbedPlayerWithTimer';
// import ReviewForm from '@/components/ReviewForm';

// type Job = {
//   _id: string;
//   title: string;
//   description?: string;
//   link: string;           // spotify track or open URL
//   tags?: string[];
//   payoutPerReview?: number;
// };

// const REQUIRED_SECONDS = 30;

// /**
//  * Normalizes a job.link to an embed src for a Spotify track.
//  * Accepts either a Spotify URL or a spotify:track:ID or raw track ID.
//  */
// function toSpotifyEmbedSrc(link: string): string | null {
//   if (!link) return null;

//   // If you already store spotify track uri in DB, prefer that.
//   // Try to extract a track ID:
//   // - spotify:track:ID
//   // - https://open.spotify.com/track/ID?...
//   const uriMatch = link.match(/spotify:track:([A-Za-z0-9]+)/);
//   const urlMatch = link.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);

//   const id = uriMatch?.[1] || urlMatch?.[1] || (/^[A-Za-z0-9]+$/.test(link) ? link : null);
//   return id ? `https://open.spotify.com/embed/track/${id}` : null;
// }

// export default function WorkerJobPage() {
//   const { token } = useAuth();
//   const params = useParams<{ jobId: string }>();
//   const jobId = params?.jobId as string;

//   const [job, setJob] = useState<Job | null>(null);
//   const [listenedMs, setListenedMs] = useState(0);
//   const [submitting, setSubmitting] = useState(false);
//   const [err, setErr] = useState<string|null>(null);

//   const embedSrc = useMemo(() => toSpotifyEmbedSrc(job?.link || ''), [job]);

//   useEffect(() => {
//     (async () => {
//       try {
//         const data = await api<Job>(`/jobs/${jobId}`);
//         setJob(data);
//       } catch (e:any) {
//         setErr(e.message);
//       }
//     })();
//   }, [jobId]);

//   async function onSubmitReview(payload: { rating: number; feedback?: string }) {
//     if (!token) return alert('Please log in again.');
//     if (listenedMs < REQUIRED_SECONDS * 1000) {
//       return alert(`Please listen at least ${REQUIRED_SECONDS}s before submitting.`);
//     }
//     try {
//       setSubmitting(true);
//       await api(`/jobs/${jobId}/review`, { method: 'POST', body: payload, token });
//       alert('Review submitted. Thanks!');
//       // Simple redirect to dashboard
//       window.location.href = '/worker/dashboard';
//     } catch (e:any) {
//       alert(e.message || 'Failed to submit review');
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <div className="max-w-4xl mx-auto p-6 space-y-6">
//       {!job ? (
//         <p>{err ? <span className="text-red-600">{err}</span> : 'Loading…'}</p>
//       ) : (
//         <>
//           <header className="space-y-1">
//             <h1 className="text-2xl font-semibold">{job.title}</h1>
//             <p className="text-gray-600">{job.description}</p>
//             <div className="text-xs text-gray-500">{job.tags?.join(' • ')}</div>
//           </header>

//           {embedSrc ? (
//             <EmbedPlayerWithTimer
//               trackId={jobId}
//             //   embedSrc={embedSrc}
//               requiredMs={REQUIRED_SECONDS * 1000}
//               onTick={(ms) => setListenedMs(ms)}
//             />
//           ) : (
//             <div className="p-4 border rounded bg-yellow-50">
//               We couldn’t detect a Spotify track for this job. Please contact support.
//             </div>
//           )}

//           <section className="pt-2">
//             <h2 className="font-medium mb-2">Submit review</h2>
//             <ReviewForm
//               disabled={submitting || listenedMs < REQUIRED_SECONDS * 1000}
//               onSubmit={onSubmitReview}
//               minSeconds={REQUIRED_SECONDS}
//               listenedMs={listenedMs}
//             />
//           </section>

//           <details className="mt-4">
//             <summary className="cursor-pointer text-sm text-gray-600">Debug</summary>
//             <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto">
// {JSON.stringify({ jobId, embedSrc, listenedMs }, null, 2)}
//             </pre>
//           </details>
//         </>
//       )}
//     </div>
//   );
// }


'use client';

import { useEffect, useMemo, useState } from 'react';
import EmbedPlayerWithTimer from '@/components/EmbedPlayerWithTimer';
import ReviewForm from '@/components/ReviewForm';

type Job = {
  _id: string;
  title: string;
  description?: string;
  link: string;          // should be a Spotify track link/URI/id
  tags?: string[];
  payoutPerReview?: number;
  maxListeners?: number;
  status: 'open' | 'full' | 'closed' | 'expired';
  payerId: string;
};

const API_BASE = 'http://localhost:5000/api';

export default function WorkerJobPage({ params }: { params: { jobId: string } }) {
  const { jobId } = params;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlock, setUnlock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch job details
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/jobs/${jobId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Job = await res.json();
        if (mounted) setJob(data);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load job');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [jobId]);

  const spotifyRef = useMemo(() => job?.link || '', [job]);

  if (loading) {
    return <div className="p-6">Loading job…</div>;
  }
  if (error || !job) {
    return (
      <div className="p-6 text-red-700">
        {error || 'Job not found.'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
      {/* Job Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{job.title}</h1>
          {job.tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {job.tags.map((t) => (
                <span key={t} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  #{t}
                </span>
              ))}
            </div>
          ) : null}
          {job.description ? (
            <p className="mt-3 text-sm text-gray-700">{job.description}</p>
          ) : null}
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm">Payout</div>
          <div className="text-lg font-semibold">
            {job.payoutPerReview ? `$${job.payoutPerReview.toFixed(2)}` : 'Free / Beta'}
          </div>
          <div className="mt-1 text-xs text-gray-500">Max listeners: {job.maxListeners ?? '—'}</div>
          <div className="mt-1 text-xs">Status: <span className="font-medium">{job.status}</span></div>
        </div>
      </div>

      {/* Player + Timer */}
      <EmbedPlayerWithTimer
        jobId={job._id}
        spotifyTrackRef={spotifyRef}
        minSeconds={30}
        onUnlocked={() => setUnlock(true)}
        height={200}
      />

      {/* Review */}
      <ReviewForm jobId={job._id} canSubmit={unlock} apiBase={API_BASE} onSubmitted={() => {
        // Optional: navigate to dashboard or show toast
      }} />
    </div>
  );
}
