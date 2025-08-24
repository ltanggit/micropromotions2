// src/components/SpotifyPlayer.tsx
'use client';

import React from 'react';

type Props = {
  /** Full Spotify track URL or URI. Examples:
   *  - https://open.spotify.com/track/1hKdDCpiI9mqz1jVHRKG0E
   *  - spotify:track:1hKdDCpiI9mqz1jVHRKG0E
   */
  trackUrl: string;
  /** Height in pixels (defaults 152 like Spotify's compact embed). */
  height?: number;
  /** Called when user hits local "Play (start timer)" button. */
  onStart?: () => void;
  /** Called when user hits local "Pause (pause timer)" button. */
  onPause?: () => void;
  /** Show local overlay controls (recommended). */
  showControls?: boolean;
  /** Whether to allow the embed's native play controls. */
  allowNativeControls?: boolean;
};

function toEmbedSrc(input: string): string {
  // Normalize spotify URI vs URL to an embed URL.
  const uriMatch = input.match(/spotify:track:([A-Za-z0-9]+)/);
  const id =
    uriMatch?.[1] ??
    input.split('/track/')[1]?.split('?')[0] ??
    input; // last resort, pass through
  return `https://open.spotify.com/embed/track/${id}`;
}

export default function SpotifyPlayer({
  trackUrl,
  height = 152,
  onStart,
  onPause,
  showControls = true,
  allowNativeControls = true,
}: Props) {
  const src = toEmbedSrc(trackUrl);

  return (
    <div className="w-full">
      <iframe
        title="Spotify Player"
        className="w-full rounded-lg border"
        style={{ height }}
        src={src}
        loading="lazy"
        frameBorder="0"
        allow={`${allowNativeControls ? 'autoplay; ' : ''}clipboard-write; encrypted-media; fullscreen; picture-in-picture`}
      />
      {showControls && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="px-3 py-1.5 rounded bg-green-600 text-white text-sm hover:bg-green-700"
          >
            ▶︎ Start Timer
          </button>
          <button
            type="button"
            onClick={onPause}
            className="px-3 py-1.5 rounded bg-gray-200 text-gray-900 text-sm hover:bg-gray-300"
          >
            ⏸ Pause Timer
          </button>
          <a
            href={trackUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs underline text-gray-600"
          >
            Open in Spotify
          </a>
        </div>
      )}
    </div>
  );
}