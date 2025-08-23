//src/components/SpotifyPlayer.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  /** A valid Spotify user access token (Premium) */
  token?: string;
  /** Track URI or URL. Accepts "spotify:track:ID" or "https://open.spotify.com/track/ID" */
  track: string;
  /** Minimum listen time (ms) before enabling submit. Default: 30000 */
  minListenMs?: number;
  /** Called when the user clicks Submit (and threshold is satisfied) */
  onSubmit?: () => void;
  /** Optional: custom label for the submit button */
  submitLabel?: string;
  /** Optional: className wrapper */
  className?: string;
};

/** Utility: extract trackId from URI/URL */
function parseTrackId(input: string): string | null {
  if (!input) return null;
  // spotify:track:ID
  const m1 = input.match(/spotify:track:([A-Za-z0-9]+)/i);
  if (m1) return m1[1];
  // https://open.spotify.com/track/ID
  const m2 = input.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/i);
  if (m2) return m2[1];
  // maybe it's already an ID
  if (/^[A-Za-z0-9]+$/.test(input)) return input;
  return null;
}

/** Dynamically load the Spotify Web Playback SDK script once */
function useLoadSpotifySDK() {
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already present?
    if (document.getElementById('spotify-web-playback')) {
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'spotify-web-playback';
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    // The SDK sets this global when ready
    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      setLoaded(true);
    };

    return () => {
      // Do not remove the script to avoid re-loading on route change
    };
  }, []);

  return loaded;
}

/**
 * In-page Spotify player + 30s verification.
 * Requires a Premium user token to actually verify time via the Web Playback SDK.
 */
export default function SpotifyPlayer({
  token,
  track,
  minListenMs = 30_000,
  onSubmit,
  submitLabel = 'Submit Review',
  className = '',
}: Props) {
  const sdkLoaded = useLoadSpotifySDK();
  const trackId = useMemo(() => parseTrackId(track), [track]);

  const [deviceId, setDeviceId] = useState<string>();
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [positionMs, setPositionMs] = useState<number>(0);

  // verified listen time (only counting while playing)
  const [playedMs, setPlayedMs] = useState<number>(0);

  // internal refs for accumulation
  const accRef = useRef<number>(0);          // accumulated ms
  const startedAtRef = useRef<number | null>(null); // timestamp when we last started/resumed playing
  const currentTrackUriRef = useRef<string | null>(null);

  // Player instance ref to disconnect on unmount
  const playerRef = useRef<any>(null);

  // Load & connect the Web Playback SDK player when token + sdk loaded
  useEffect(() => {
    if (!sdkLoaded || !token) return;
    if (playerRef.current) return;

    const Spotify = (window as any).Spotify;
    if (!Spotify || !Spotify.Player) return;

    const player = new Spotify.Player({
      name: 'Micropromotions Player',
      getOAuthToken: (cb: (t: string) => void) => cb(token),
      volume: 0.5,
    });

    // Player ready events
    player.addListener('ready', ({ device_id }: any) => {
      setDeviceId(device_id);
      setPlayerReady(true);
    });

    player.addListener('not_ready', ({ device_id }: any) => {
      // device went offline
      if (deviceId === device_id) setPlayerReady(false);
    });

    // Track state
    player.addListener('player_state_changed', (state: any) => {
      if (!state) return;
      // playing/paused
      const paused = state.paused;
      setIsPlaying(!paused);

      // duration & position (ms)
      if (typeof state.duration === 'number') setDurationMs(state.duration);
      if (typeof state.position === 'number') setPositionMs(state.position);

      // track uri (first in queue)
      const currentUri =
        state?.track_window?.current_track?.uri ?? null;

      // If track changed, reset accumulation for a clean slate
      if (currentTrackUriRef.current && currentUri && currentUri !== currentTrackUriRef.current) {
        accRef.current = 0;
        setPlayedMs(0);
        startedAtRef.current = null;
      }
      currentTrackUriRef.current = currentUri;

      // Accumulation bookkeeping
      const now = performance.now();
      if (!paused) {
        // started/resumed playing
        if (startedAtRef.current == null) {
          startedAtRef.current = now;
        }
      } else {
        // paused -> add chunk
        if (startedAtRef.current != null) {
          accRef.current += now - startedAtRef.current;
          setPlayedMs(Math.floor(accRef.current));
          startedAtRef.current = null;
        }
      }
    });

    player.connect();
    playerRef.current = player;

    return () => {
      try {
        player.disconnect();
      } catch {}
      playerRef.current = null;
    };
  }, [sdkLoaded, token, deviceId]);

  // Animation loop to continuously update while playing
  useEffect(() => {
    let raf: number | null = null;
    const tick = () => {
      if (isPlaying && startedAtRef.current != null) {
        const now = performance.now();
        const total = accRef.current + (now - startedAtRef.current);
        setPlayedMs(Math.floor(total));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isPlaying]);

  // When we have a device, transfer playback & set the track.
  useEffect(() => {
    if (!token || !deviceId || !playerReady || !trackId) return;

    const playOnDevice = async () => {
      try {
        // Transfer active device to this player
        await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            device_ids: [deviceId],
            play: true,
          }),
        });

        // Start playback with the requested track
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [`spotify:track:${trackId}`],
            position_ms: 0,
          }),
        });

        // reset counters
        accRef.current = 0;
        setPlayedMs(0);
        startedAtRef.current = performance.now();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Spotify play error', e);
      }
    };

    playOnDevice();
  }, [token, deviceId, playerReady, trackId]);

  // Derived UI values
  const needMs = Math.max(minListenMs - playedMs, 0);
  const needSec = Math.ceil(needMs / 1000);
  const pct = Math.min(playedMs / minListenMs, 1);

  const canSubmit = playedMs >= minListenMs;

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      <div className="rounded-xl border border-gray-200 bg-black shadow-sm p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">Track Player</h3>
            <p className="text-sm text-gray-500 truncate">
              {trackId ? `Track: ${trackId}` : 'Invalid track'}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              {token
                ? playerReady
                  ? isPlaying
                    ? 'Playing…'
                    : 'Paused'
                  : 'Connecting player…'
                : 'Missing Spotify user token (Premium required)'}
            </div>
          </div>

          {/* Countdown chip */}
          <div className="flex items-center gap-3">
            <div className="w-24">
              <div className="text-xs text-gray-600 mb-1">
                {canSubmit ? 'Ready to submit' : 'Time remaining'}
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-[width] duration-300"
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
              <div className="text-right text-xs mt-1 tabular-nums">
                {canSubmit ? '0s' : `${needSec}s`}
              </div>
            </div>

            {/* Big badge */}
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                canSubmit
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {canSubmit ? 'Verified 30s+' : 'Listening…'}
            </div>
          </div>
        </div>

        {/* Simple transport controls (optional) */}
        <div className="mt-4 flex items-center gap-3">
          <button
            className="px-3 py-1 rounded border text-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={() => playerRef.current?.previousTrack()}
            disabled={!playerReady}
          >
            ◀︎ Prev
          </button>
          <button
            className="px-3 py-1 rounded border text-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={() => playerRef.current?.togglePlay()}
            disabled={!playerReady}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            className="px-3 py-1 rounded border text-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={() => playerRef.current?.nextTrack()}
            disabled={!playerReady}
          >
            Next ▶︎
          </button>

          <div className="ml-auto text-xs text-gray-500 tabular-nums">
            {Math.floor(positionMs / 1000)}s / {Math.floor(durationMs / 1000)}s
          </div>
        </div>

        {/* Submit */}
        <div className="mt-4">
          <button
            className="w-full rounded-md px-4 py-2 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed
                       bg-indigo-600 hover:bg-indigo-700 transition-colors"
            onClick={() => canSubmit && onSubmit?.()}
            disabled={!canSubmit}
          >
            {canSubmit ? submitLabel : `Please listen ${needSec}s more`}
          </button>
        </div>
      </div>

      {/* Fallback embed (non-verifiable): only show when no token */}
      {!token && trackId && (
        <div className="mt-4">
          <iframe
            title="Spotify"
            className="w-full rounded-xl"
            style={{ height: 152, border: 'none' }}
            src={`https://open.spotify.com/embed/track/${trackId}`}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
            You are viewing the read-only embed. For **verified** listen time,
            the worker must connect a Spotify Premium account and use the in‑page
            player above.
          </p>
        </div>
      )}
    </div>
  );
}