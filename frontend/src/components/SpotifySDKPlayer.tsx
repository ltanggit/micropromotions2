'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSpotifySDK } from '@/lib/useSpotifySDK';

type Props = {
  jobId: string;
  spotifyTrackRef: string;         // URL/URI/or raw ID
  minSeconds?: number;             // default 30
  onUnlocked?: () => void;
  height?: number;                 // UI height (visual only)
  dark?: boolean;                  // light/dark styling
  clientName?: string;             // Optional name shown in Spotify Connect
};

function parseTrackId(input: string) {
  if (!input) return '';
  const urlMatch = input.match(/\/track\/([A-Za-z0-9]+)(\?|$|\/)/);
  if (urlMatch) return urlMatch[1];
  const uriMatch = input.match(/spotify:track:([A-Za-z0-9]+)/);
  if (uriMatch) return uriMatch[1];
  if (/^[A-Za-z0-9]{10,50}$/.test(input)) return input;
  return '';
}

export default function SpotifySDKPlayer({
  jobId,
  spotifyTrackRef,
  minSeconds = 30,
  onUnlocked,
  height = 140,
  dark = false,
  clientName = 'Micropromotions Player',
}: Props) {
  const { ready, error: sdkError } = useSpotifySDK();
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);

  const listenedRef = useRef(0);
  const tickerRef = useRef<number | null>(null);
  const playerRef = useRef<any>(null);

  const storageKey = `sdkTimer:${jobId}`;
  const accessToken =
    typeof window !== 'undefined' ? localStorage.getItem('spotifyAccessToken') : null;


  const trackId = useMemo(() => parseTrackId(spotifyTrackRef), [spotifyTrackRef]);
  const trackURI = useMemo(() => (trackId ? `spotify:track:${trackId}` : null), [trackId]);

  // Load saved listened seconds
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const { listened, unlocked: wasUnlocked } = JSON.parse(raw);
        if (typeof listened === 'number') listenedRef.current = listened;
        if (wasUnlocked) setUnlocked(true);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist on changes
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ listened: listenedRef.current, unlocked })
      );
    } catch {
      // ignore
    }
  }, [unlocked, storageKey]);

  // Init Player
  useEffect(() => {
    if (!ready) return;
    if (!accessToken) {
      setError('Missing Spotify user access token (spotifyAccessToken).');
      return;
    }
    if (!window.Spotify) return;

    const player = new window.Spotify.Player({
      name: clientName,
      getOAuthToken: (cb: (token: string) => void) => cb(accessToken),
      volume: 0.8,
    });

    playerRef.current = player;

    player.addListener('ready', ({ device_id }: any) => {
      setDeviceId(device_id);
    });

    player.addListener('not_ready', ({ device_id }: any) => {
      // Device went offline
      if (deviceId === device_id) setDeviceId(null);
    });

    player.addListener('initialization_error', ({ message }: any) => setError(message));
    player.addListener('authentication_error', ({ message }: any) => setError(message));
    player.addListener('account_error', ({ message }: any) =>
      setError(`${message} (Premium is required for playback)`)
    );

    // Update UI with state changes
    player.addListener('player_state_changed', (state: any) => {
      if (!state) return;
      const t = state.track_window?.current_track;
      const idFromURI = t?.uri?.split(':').pop() ?? null;
      setCurrentTrackId(idFromURI);
      setIsPlaying(!state.paused);
      setPosition(state.position || 0);
      setDuration(state.duration || 0);
    });

    player.connect();

    return () => {
      player.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, accessToken, clientName]);

  // Once we have deviceId, transfer playback and start the track
  useEffect(() => {
    if (!deviceId || !trackURI || !accessToken) return;

    const transferAndPlay = async () => {
      try {
        // 1) Transfer playback to our Web Playback SDK device
        await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ device_ids: [deviceId], play: true }),
        });

        // 2) Start the specific track
        await fetch('https://api.spotify.com/v1/me/player/play', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris: [trackURI] }),
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to start playback on device');
      }
    };

    transferAndPlay();
  }, [deviceId, trackURI, accessToken]);

  // Accumulate REAL listening time only while our track is playing
  useEffect(() => {
    const tick = () => {
      const onOurTrack = currentTrackId === trackId;
      if (onOurTrack && isPlaying && !unlocked) {
        listenedRef.current += 1;
        if (listenedRef.current >= minSeconds) {
          setUnlocked(true);
          onUnlocked?.();
        }
      }
      tickerRef.current = window.setTimeout(tick, 1000) as unknown as number;
    };

    // start
    if (tickerRef.current == null) {
      tickerRef.current = window.setTimeout(tick, 1000) as unknown as number;
    }
    return () => {
      if (tickerRef.current != null) {
        clearTimeout(tickerRef.current);
        tickerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentTrackId, trackId, unlocked, minSeconds]);

  const togglePlay = async () => {
    try {
      await playerRef.current?.togglePlay();
    } catch (e: any) {
      setError(e?.message || 'toggle failed');
    }
  };

  const pct =
    duration > 0 ? Math.min(100, Math.max(0, Math.round((position / duration) * 100))) : 0;
  const remain = Math.max(minSeconds - listenedRef.current, 0);
  const mm = Math.floor(remain / 60).toString();
  const ss = (remain % 60).toString().padStart(2, '0');

  return (
    <div
      className={`w-full rounded-md border p-3 ${dark ? 'bg-neutral-900 text-white' : 'bg-white'}`}
      style={{ minHeight: height }}
    >
      {/* Status / Errors */}
      {sdkError && <div className="text-sm text-red-600">{sdkError}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      if (!accessToken) {
        <div className="p-3 border rounded bg-yellow-50 text-yellow-800">
        Missing Spotify user access token.{' '}
        <a className="underline" href="/spotify/connect">Connect Spotify</a>
        </div>
        }


      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          disabled={!deviceId}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <div className="flex-1">
          <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
            <div
              className="h-full bg-blue-600"
              style={{ width: `${pct}%`, transition: 'width .25s linear' }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-600">
            {Math.floor(position / 1000)}s / {Math.floor(duration / 1000)}s
          </div>
        </div>

        <div
          className={`text-xs px-2 py-1 rounded ${
            unlocked ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {unlocked ? 'Requirement met' : `Listen: ${mm}:${ss}`}
        </div>
      </div>
    </div>
  );
}