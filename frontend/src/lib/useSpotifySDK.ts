'use client';

import { useEffect, useState } from 'react';

export function useSpotifySDK() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Already loaded?
    if (typeof window !== 'undefined' && (window as any).Spotify) {
      setReady(true);
      return;
    }

    // If script tag already exists, wait for it
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://sdk.scdn.co/spotify-player.js"]');
    if (existing) {
      const check = () => {
        if ((window as any).Spotify) setReady(true);
      };
      const i = window.setInterval(check, 100);
      setTimeout(() => clearInterval(i), 5000);
      return;
    }

    // Inject script
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    window.onSpotifyWebPlaybackSDKReady = () => {
      setReady(true);
    };

    script.onerror = () => setError('Failed to load Spotify SDK');
    document.body.appendChild(script);

    return () => {
      script.onerror = null;
    };
  }, []);

  return { ready, error };
}