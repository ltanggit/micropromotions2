// src/lib/useSpotifyPlayer.ts
'use client';

import { useEffect, useRef, useState } from 'react';

export type UseSpotifyPlayerOptions = {
  /** Seconds of active listening required before submit is allowed. */
  minSeconds?: number;
};

export type UseSpotifyPlayerReturn = {
  /** Elapsed "active listening" seconds. */
  elapsed: number;
  /** Is the timer counting right now? */
  running: boolean;
  /** Start/resume counting. */
  start: () => void;
  /** Pause counting. */
  pause: () => void;
  /** Reset the count back to 0. */
  reset: () => void;
  /** True once elapsed >= minSeconds. */
  canSubmit: boolean;
  /** How many seconds remain to unlock submit. */
  remaining: number;
};

/**
 * Lightweight "listening timer" — decoupled from Spotify SDK to avoid readiness/type issues.
 * You drive this via UI buttons (Play/Pause). When `elapsed >= minSeconds`, canSubmit becomes true.
 */
export function useSpotifyPlayer(
  opts: UseSpotifyPlayerOptions = {}
): UseSpotifyPlayerReturn {
  const min = Math.max(1, opts.minSeconds ?? 30);

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setElapsed(0);
  };

  return {
    elapsed,
    running,
    start,
    pause,
    reset,
    canSubmit: elapsed >= min,
    remaining: Math.max(0, min - elapsed),
  };
}
