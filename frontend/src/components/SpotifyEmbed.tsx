//src/components/SpotifyEmbed.tsx
'use client';

import { useEffect, useState } from 'react';

type Props = {
  /** A 22-char track id like '4uLU6hMCjMI75M1A2tKUQC' */
  trackId?: string | null;
  /** Height in px; 152 (compact) or ~352 (tall) both look good */
  height?: number;
  /** 'black' or 'white' theme */
  theme?: 'black' | 'white';
};

export default function SpotifyEmbed({ trackId, height = 352, theme = 'black' }: Props) {
  // Avoid hydration warnings from extensions mutating <body> attrs:
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ height }} className="w-full rounded bg-gray-100" />;

  if (!trackId) return <p className="text-sm text-red-600">No Spotify track provided.</p>;

  const src = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=${theme}`;

  return (
    <iframe
      title="Spotify Player"
      src={src}
      width="100%"
      height={height}
      style={{ borderRadius: 12 }}
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}
