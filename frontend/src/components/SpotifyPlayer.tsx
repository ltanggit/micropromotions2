'use client';

import { useEffect, useMemo } from 'react';
import { useSpotifyPlayer } from '@/lib/useSpotifyPlayer';

type SpotifyPlayerProps = {
  token?: string;                           // OAuth access token
  trackId?: string;                         // e.g. "3n3Ppam7vgaVa1iaRUc9Lp"
  trackUri?: string;                        // e.g. "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp"
  initialVolume?: number;                   // 0..1
  className?: string;
  onProgress?: (currentMs: number, durationMs: number, paused: boolean) => void;
  onStateChange?: (state: Spotify.PlaybackState | null) => void;
};

export default function SpotifyPlayer({
  token,
  trackId,
  trackUri,
  initialVolume = 0.7,
  className,
  onProgress,
  onStateChange,
}: SpotifyPlayerProps) {
  // Prefer explicit URI, else build from trackId
  const uri = useMemo(
    () => trackUri ?? (trackId ? `spotify:track:${trackId}` : undefined),
    [trackUri, trackId]
  );

  // Your hook that loads the Web Playback SDK and returns a ready device/player
  const { player, state, isReady, deviceId, transferToThisDevice } = useSpotifyPlayer({ token, initialVolume });
//   const { deviceId, player, state } = useSpotifyPlayer({ token, initialVolume });

  // Optional: bubble raw state out
  useEffect(() => {
    if (onStateChange) onStateChange(state ?? null);
  }, [state, onStateChange]);

  // When device and token are ready, start playing the requested track
  useEffect(() => {
    if (!token || !deviceId || !uri) return;

    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: [uri] }),
    }).catch(() => {
      /* no-op; you can toast/log here */
    });
  }, [token, deviceId, uri]);

  // Simple progress ticker (1s)
  useEffect(() => {
    if (!player || !onProgress) return;

    const id = setInterval(async () => {
      try {
        const s = await player.getCurrentState();
        if (s) onProgress(s.position, s.duration, s.paused);
      } catch {
        /* ignore */
      }
    }, 1000);

    return () => clearInterval(id);
  }, [player, onProgress]);

  // This component doesn’t render a UI by itself (you can add controls if you like)
  return <div className={className} />;
}
