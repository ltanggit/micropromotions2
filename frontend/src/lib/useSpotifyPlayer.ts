//src/lib/useSpotifyPlayer.ts
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type SDKState = Spotify.PlaybackState | null; // if you installed @types/spotify-web-playback-sdk, otherwise `any`

type UseSpotifyPlayerArgs = {
  token?: string | null;      // allow string | null
  initialVolume?: number;     // 0..1
};

export function useSpotifyPlayer({ token, initialVolume = 0.5 }: UseSpotifyPlayerArgs) {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [state, setState]   = useState<SDKState>(null);
  const [deviceId, setDeviceId] = useState<string | undefined>();
  const [isReady, setIsReady]   = useState(false);

  // Load the SDK script once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.Spotify) return; // already loaded

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // keep the script; removing can trigger re-download on other pages
    };
  }, []);

  // Initialize the player once the SDK is ready AND you have a token
  useEffect(() => {
    if (!token) return;                // need a Spotify access token (NOT your JWT)
    if (typeof window === 'undefined') return;

    // The global callback (declared once in src/types/spotify.d.ts)
    window.onSpotifyWebPlaybackSDKReady = () => {
      const p = new window.Spotify.Player({
        name: 'Micropromotions Web Player',
        getOAuthToken: (cb: (t: string) => void) => cb(token),
        volume: initialVolume,
      });

      // When ready, Spotify gives you a device_id
      p.addListener('ready', ({ device_id }: { device_id: string }) => {
        setDeviceId(device_id);
        setIsReady(true);
      });

      p.addListener('not_ready', () => setIsReady(false));
      p.addListener('player_state_changed', (s: SDKState) => setState(s));

      p.connect().then(ok => {
        if (ok) setPlayer(p);
      });
    };

    // If the SDK already loaded before this effect
    if (window.Spotify && !player) {
      window.onSpotifyWebPlaybackSDKReady?.();
    }

    return () => {
      // optional: disconnect when unmounting
      // player?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, initialVolume]);

  // Helper to transfer playback to this device using the Web API
  async function transferToThisDevice() {
    if (!token || !deviceId) return;
    await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_ids: [deviceId], play: false }),
    });
  }

  return {
    player,
    state,
    deviceId,
    isReady,
    transferToThisDevice,
  };
}