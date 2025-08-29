// frontend/src/components/EmbedPlayerWithTimer.tsx
// 'use client';

// import React, { useEffect, useMemo, useRef, useState } from 'react';

// /** ---- Config ---- */
// const REQUIRED_MS = 30_000; // 30 seconds needed before submit unlocks

// /** Minimal types for the Spotify iFrame API */
// declare global {
//   interface Window {
//     onSpotifyIframeApiReady?: (IFrameAPI: any) => void;
//     SpotifyIframeApi?: any;
//   }
// }

// type Props = {
//   /** e.g. "3n3Ppam7vgaVa1iaRUc9Lp" */
//   trackId: string;

//   /** Called any time we update the earned play time (ms) */
//   onProgress?: (ms: number) => void;

//   /** Called once the listener crosses REQUIRED_MS */
//   onReadyToSubmit?: (ms: number) => void;

//   /** Optional: override required milliseconds (default 30s) */
//   requiredMs?: number;

//   /** Styling */
//   className?: string;
// };

// /** Utility: load external script only once */
// function loadScript(src: string): Promise<void> {
//   return new Promise((resolve, reject) => {
//     if (document.querySelector(`script[src="${src}"]`)) {
//       resolve();
//       return;
//     }
//     const s = document.createElement('script');
//     s.src = src;
//     s.async = true;
//     s.onload = () => resolve();
//     s.onerror = () => reject(new Error(`Failed to load ${src}`));
//     document.head.appendChild(s);
//   });
// }

// function msToClock(ms: number) {
//   const s = Math.max(0, Math.floor(ms / 1000));
//   const m = Math.floor(s / 60);
//   const sec = s % 60;
//   return `${m}:${String(sec).padStart(2, '0')}`;
// }

// export default function EmbedPlayerWithTimer({
//   trackId,
//   onProgress,
//   onReadyToSubmit,
//   requiredMs = REQUIRED_MS,
//   className,
// }: Props) {
//   const mountRef = useRef<HTMLDivElement | null>(null);
//   const controllerRef = useRef<any>(null);

//   // live state from embed
//   const [isPaused, setIsPaused] = useState(true);
//   const [position, setPosition] = useState(0); // ms into track
//   const [duration, setDuration] = useState(0); // ms

//   // earned listening (only while really playing)
//   const [earnedMs, setEarnedMs] = useState(0);

//   // refs to safely compute deltas across callback calls
//   const lastPosRef = useRef<number>(0);
//   const lastTickAtRef = useRef<number>(Date.now());

//   // derived
//   const canSubmit = earnedMs >= requiredMs;
//   const remainingMs = Math.max(0, requiredMs - earnedMs);
//   const progressPct = Math.min(100, Math.round((earnedMs / requiredMs) * 100));

//   const uri = useMemo(() => `spotify:track:${trackId}`, [trackId]);

//   // Load iFrame API + create controller
//   useEffect(() => {
//     let destroyed = false;

//     async function init() {
//       // Load the Spotify iFrame API
//       await loadScript('https://open.spotify.com/embed/iframe-api/v1');

//       // The API sets window.onSpotifyIframeApiReady
//       await new Promise<void>((resolve) => {
//         if (window.SpotifyIframeApi) return resolve();
//         window.onSpotifyIframeApiReady = () => resolve();
//       });

//       if (destroyed) return;
//       const IFrameAPI = window.SpotifyIframeApi;

//       // Create controller inside our mount element
//       IFrameAPI.createController(
//         mountRef.current,
//         {
//           uri,                // e.g. spotify:track:ID
//           width: '100%',
//           height: 152,        // Spotify’s standard small player
//           theme: 'dark',
//         },
//         (controller: any) => {
//           controllerRef.current = controller;

//           // Listeners: ready & playback updates
//           controller.addListener('ready', (e: any) => {
//             // duration in ms is available on some builds via e.data.duration
//             if (e?.data?.duration) setDuration(e.data.duration);
//           });

//           controller.addListener('playback_update', (e: any) => {
//             // Typical payload: { data: { isPaused, position, duration, ... } }
//             const d = e?.data || {};
//             const paused = !!d.isPaused;
//             const pos = Number(d.position ?? 0);
//             const dur = Number(d.duration ?? duration);

//             setIsPaused(paused);
//             setPosition(pos);
//             if (dur && dur !== duration) setDuration(dur);

//             // Earned listening time:
//             // We accumulate only if we are not paused and position increased.
//             const now = Date.now();
//             const lastPos = lastPosRef.current;

//             if (!paused && pos > lastPos) {
//               // Positional delta (covers seeks/buffering gracefully)
//               const delta = pos - lastPos; // ms advanced since last update
//               if (delta > 0) {
//                 setEarnedMs((prev) => {
//                   const next = Math.min(requiredMs, prev + delta);
//                   onProgress?.(next);
//                   if (prev < requiredMs && next >= requiredMs) {
//                     onReadyToSubmit?.(next);
//                   }
//                   return next;
//                 });
//               }
//             }

//             lastPosRef.current = pos;
//             lastTickAtRef.current = now;
//           });
//         }
//       );
//     }

//     init();

//     return () => {
//       destroyed = true;
//       try {
//         controllerRef.current?.destroy?.();
//       } catch {}
//       controllerRef.current = null;
//     };
//   }, [uri, requiredMs, onProgress, onReadyToSubmit, duration]);

//   // Reset earned time if trackId changes
//   useEffect(() => {
//     setEarnedMs(0);
//     lastPosRef.current = 0;
//   }, [trackId]);

//   // Optional control actions
//   const togglePlay = async () => {
//     const c = controllerRef.current;
//     if (!c) return;
//     try {
//       if (isPaused) {
//         c.resume?.() || c.play?.();
//       } else {
//         c.pause?.();
//       }
//     } catch {
//       // Some iFrame builds expose only play(); let UI use built-in controls too.
//     }
//   };

//   const seekTo = (ms: number) => {
//     const c = controllerRef.current;
//     // loadUri with start-time can be used if seek() not exposed
//     if (c?.seek) {
//       c.seek(ms);
//     } else if (c?.loadUri) {
//       c.loadUri(uri, { timestamp: ms });
//     }
//   };

//   return (
//     <div className={className}>
//       {/* Player shell */}
//       <div
//         ref={mountRef}
//         className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm"
//       />

//       {/* Controls + Timer */}
//       <div className="mt-3 flex items-center justify-between gap-4">
//         <button
//           onClick={togglePlay}
//           className="rounded-lg border px-3 py-1 text-sm shadow-sm hover:bg-gray-50"
//         >
//           {isPaused ? 'Play' : 'Pause'}
//         </button>

//         <div className="flex-1">
//           <div className="flex items-center justify-between text-xs text-gray-500">
//             <span>Earned: {msToClock(earnedMs)}</span>
//             <span>Need: {msToClock(remainingMs)}</span>
//           </div>
//           <div className="mt-1 h-2 w-full overflow-hidden rounded bg-gray-200">
//             <div
//               className="h-full bg-green-500 transition-[width] duration-200"
//               style={{ width: `${progressPct}%` }}
//             />
//           </div>
//         </div>

//         <div className="text-xs text-gray-500 w-[92px] text-right">
//           Track: {msToClock(position)} / {msToClock(duration || 0)}
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  jobId: string;
  /** Any of:
   *  - full Spotify track URL (https://open.spotify.com/track/XXXX?si=...)
   *  - spotify:track:XXXX
   *  - raw track id "XXXX"
   */
  spotifyTrackRef: string;
  /** seconds required to listen before unlocking review */
  minSeconds?: number;
  /** called once when timer reaches 0 */
  onUnlocked?: () => void;
  /** optional height of the embed (default 352) */
  height?: number;
};

/** Extract a Spotify track id from URL/URI/id */
function parseTrackId(input: string) {
  if (!input) return '';
  // spotify url
  const urlMatch = input.match(/\/track\/([A-Za-z0-9]+)(\?|$|\/)/);
  if (urlMatch) return urlMatch[1];
  // spotify uri
  const uriMatch = input.match(/spotify:track:([A-Za-z0-9]+)/);
  if (uriMatch) return uriMatch[1];
  // looks like plain id
  if (/^[A-Za-z0-9]{10,50}$/.test(input)) return input;
  return '';
}

export default function EmbedPlayerWithTimer({
  jobId,
  spotifyTrackRef,
  minSeconds = 30,
  onUnlocked,
  height = 352,
}: Props) {
  const trackId = useMemo(() => parseTrackId(spotifyTrackRef), [spotifyTrackRef]);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [remaining, setRemaining] = useState(minSeconds);
  const [unlocked, setUnlocked] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const tickerRef = useRef<number | null>(null);

  const storageKey = `jobTimer:${jobId}`;

  // Load persisted timer state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const { remaining: r, startedAt } = JSON.parse(raw);
        if (typeof r === 'number') setRemaining(r);
        if (startedAt) startedAtRef.current = startedAt;
        // if we had already finished, mark unlocked
        if (r !== undefined && r <= 0) {
          setUnlocked(true);
          setOverlayVisible(false);
        }
      }
    } catch {
      // ignore bad localStorage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          remaining,
          startedAt: startedAtRef.current,
        })
      );
    } catch {
      // ignore
    }
  }, [remaining, storageKey]);

  // Start timer on first overlay click
  const startTimer = () => {
    if (unlocked) {
      setOverlayVisible(false);
      return;
    }
    setOverlayVisible(false);
    // set an absolute start time if not set
    if (!startedAtRef.current) {
      startedAtRef.current = Date.now();
    }
    runTicker();
  };

  // Accurate ticker that accounts for tab being backgrounded
  const runTicker = () => {
    if (tickerRef.current != null) return; // already ticking
    const tick = () => {
      if (unlocked) {
        stopTicker();
        return;
      }
      const startedAt = startedAtRef.current || Date.now();
      const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(minSeconds - elapsedSec, 0);
      setRemaining(left);

      if (left <= 0) {
        setUnlocked(true);
        stopTicker();
        onUnlocked?.();
        return;
      }
      tickerRef.current = window.setTimeout(tick, 1000) as unknown as number;
    };
    tickerRef.current = window.setTimeout(tick, 300) as unknown as number;
  };

  const stopTicker = () => {
    if (tickerRef.current != null) {
      clearTimeout(tickerRef.current);
      tickerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopTicker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(1, '0');
  const seconds = (remaining % 60).toString().padStart(2, '0');

  if (!trackId) {
    return (
      <div className="p-4 border rounded bg-red-50 text-red-700">
        Invalid Spotify track link/ID provided.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="relative w-full flex justify-center items-center" style={{ height }}>
        {/* Spotify Embed */}
        <iframe
          className="rounded-md m-2"
          src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
          width="100%"
          height={height}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />

        {/* One-time overlay to capture the initial click reliably */}
        {overlayVisible && !unlocked && (
          <button
            onClick={startTimer}
            className="rounded-2xl absolute inset-0 flex items-center justify-center bg-[#FFF2DF]/30 text-white font-bold"
          >
            CLICK TO PLAY AND START TIMER
          </button>
        )}
      </div>

      {/* Timer / Status */}
      <div className="flex items-center gap-3">
        <div
          className={`text-sm px-2 py-1 rounded ${
            unlocked
              ? 'bg-green-100 text-green-700'
              : 'bg-[#FFCA85] text-[#140C00]'
          }`}
        >
          {unlocked ? 'Listening requirement met' : 'Listening… keep the tab open'}
        </div>

        {!unlocked && (
          <div className="ml-auto text-sm font-mono tabular-nums">
            {minutes}:{seconds}
          </div>
        )}
      </div>
    </div>
  );

}