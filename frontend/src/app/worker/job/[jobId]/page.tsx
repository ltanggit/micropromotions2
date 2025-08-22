'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import SpotifyPlayer from '@/components/SpotifyPlayer';
import { useSpotifyPlayer } from '@/lib/useSpotifyPlayer';

type Job = {
  _id: string;
  title: string;
  link: string;
  description?: string;
  tags?: string[];
  payoutPerReview?: number;
  assignments?: any[];
  status: 'open'|'full'|'closed'|'expired';
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';
const INITIAL_VOLUME = 0.7; // define your initial volume

// --- Utility: extract Spotify track ID from various URL formats ---
function getSpotifyTrackId(input: string): string | null {
  if (!input) return null;
  if (input.startsWith('spotify:track:')) return input.split(':')[2];
  try {
    const u = new URL(input);
    const parts = u.pathname.split('/').filter(Boolean);
    // /track/:id or /embed/track/:id
    const tIndex = parts.findIndex(p => p === 'track');
    if (tIndex >= 0 && parts[tIndex + 1]) return parts[tIndex + 1];
  } catch {}
  if (/^[0-9A-Za-z]{22}$/.test(input)) return input;
  return null;
}

export default function WorkerJobPlayerPage() {
  const router = useRouter();
  const { jobId } = useParams<{ jobId: string }>();
  const { user, token, hasRole } = useAuth();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Spotify: use token ?? undefined to satisfy the hook's typing
  const { player, state, isReady, transferToThisDevice } = useSpotifyPlayer({
    token: token ?? undefined,
    initialVolume: INITIAL_VOLUME,
  });

  const [hasPlayedEnough, setHasPlayedEnough] = useState(false);
  const listenedMsRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);

  // Gate: must be logged in & worker
  useEffect(() => {
    if (!user) return;
    if (!hasRole('worker')) {
      setError('Worker role required.');
    }
  }, [user, hasRole]);

  // Load job details
  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`);
        if (!res.ok) throw new Error(`Failed to load job (${res.status})`);
        const data = await res.json();
        if (active) setJob(data);
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load job');
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [jobId]);

  // Accept job (if not already)
  async function acceptJob() {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/jobs/${jobId}/accept`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ dueMinutes: 90 }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setJob(updated);
    } catch (e: any) {
      setError(e.message ?? 'Failed to accept job');
    }
  }

  // Release job
  async function releaseJob() {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/jobs/${jobId}/release`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setJob(updated);
    } catch (e: any) {
      setError(e.message ?? 'Failed to release job');
    }
  }

  // Submit review – NOTE: your route is singular: /review
  async function submitReview(rating: number, feedback: string) {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/jobs/${jobId}/review`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rating, feedback }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push('/worker/dashboard');
    } catch (e: any) {
      setError(e.message ?? 'Failed to submit review');
    }
  }

  // Determine the spotify track ID
  const trackId = useMemo(() => getSpotifyTrackId(job?.link ?? ''), [job?.link]);

  // Transfer playback to the in-page device when ready
  useEffect(() => {
    if (isReady) {
      // the hook encapsulates device handling
      transferToThisDevice().catch(() => {});
    }
  }, [isReady, transferToThisDevice]);

  // Listen tracking (simple heuristic ~30s)
  function handleProgress(currentMs: number, durationMs: number, paused: boolean) {
    const now = performance.now();
    if (paused) {
      lastTickRef.current = null;
      return;
    }
    if (lastTickRef.current != null) {
      listenedMsRef.current += now - lastTickRef.current;
      if (listenedMsRef.current >= 30000) {
        setHasPlayedEnough(true);
      }
    }
    lastTickRef.current = now;
  }

  // UI states
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <h1 className="text-xl font-semibold mb-2">Please log in</h1>
        <p className="text-sm">
          You must be logged in as a Worker to open & review this job.{' '}
          <Link href="/login" className="underline">Login</Link>
        </p>
      </div>
    );
  }

  if (loading) return <div className="max-w-3xl mx-auto py-10">Loading job…</div>;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <p className="text-red-600 text-sm">{String(error)}</p>
      </div>
    );
  }

  if (!job) return null;

  const acceptedByMe = job.assignments?.some(
    (a: any) => a.workerId === user.id && a.status === 'accepted'
  );

  return (
    <div className="max-w-4xl mx-auto py-6 px-3 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{job.title}</h1>
          {job.description && <p className="mt-1 text-sm text-gray-600">{job.description}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {job.tags?.map((t) => (
              <span key={t} className="text-xs bg-gray-100 px-2 py-1 rounded">{t}</span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-gray-500">Payout</div>
          <div className="text-lg font-bold">${job.payoutPerReview?.toFixed(2) ?? '0.00'}</div>
        </div>
      </div>

      {/* Accept / Release */}
      <div className="flex gap-3">
        {!acceptedByMe ? (
          <button
            onClick={acceptJob}
            className="px-4 py-2 rounded bg-black text-white text-sm hover:opacity-90"
            disabled={job.status === 'closed' || job.status === 'expired'}
          >
            Accept Job
          </button>
        ) : (
          <button
            onClick={releaseJob}
            className="px-4 py-2 rounded border text-sm hover:bg-gray-50"
          >
            Release Job
          </button>
        )}
      </div>

      {/* Spotify Player */}
      <div className="border rounded-lg p-4">
        {!trackId ? (
          <p className="text-sm text-red-600">
            This job’s link is not a Spotify track. Please contact support or try another job.
          </p>
        ) : (
          <SpotifyPlayer
            trackId={trackId}
            onProgress={handleProgress}
          />
        )}
        <p className="text-xs mt-2 text-gray-500">
          Tip: You’ll be able to submit a review after ~30 seconds of active listening.
        </p>
      </div>

      {/* Review box */}
      <ReviewBox disabled={!acceptedByMe || !hasPlayedEnough} onSubmit={submitReview} />

      <div className="pt-4">
        <Link href="/worker/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

/* ---------- Small local component for the review form ---------- */
function ReviewBox({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (rating: number, feedback: string) => Promise<void>;
}) {
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h2 className="font-medium">Submit your review</h2>
      <div className="flex items-center gap-3">
        <label className="text-sm">Rating</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          disabled={disabled || submitting}
        >
          {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className="w-full border rounded p-2 text-sm"
        rows={4}
        placeholder="Write a short, helpful review…"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        disabled={disabled || submitting}
      />
      <button
        onClick={async () => {
          setSubmitting(true);
          try {
            await onSubmit(rating, feedback);
          } finally {
            setSubmitting(false);
          }
        }}
        className={`px-4 py-2 rounded text-white text-sm ${
          disabled ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        disabled={disabled || submitting}
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
      {disabled && (
        <p className="text-xs text-gray-500">
          You must accept the job and listen for ~30s before submitting.
        </p>
      )}
    </div>
  );
}