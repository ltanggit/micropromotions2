// src/app/worker/jobs/[jobId]/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SpotifyPlayer from '@/components/SpotifyPlayer';
import { useSpotifyPlayer } from '@/lib/useSpotifyPlayer';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

type Job = {
  _id: string;
  title: string;
  link: string;        // song link (Spotify URL/URI expected)
  description?: string;
  tags?: string[];
  payoutPerReview?: number;
  status: 'open' | 'full' | 'closed' | 'expired';
};

export default function WorkerJobPage() {
  const router = useRouter();
  const { jobId } = useParams() as { jobId: string };

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');

  // 30‑second requirement — adjust if needed
  const listen = useSpotifyPlayer({ minSeconds: 30 });

  const token = useMemo(
    () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null),
    []
  );

  // Load job
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        if (alive) setJob(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [jobId, token]);

  // Submit review (backend route expects singular `/review`)
  async function submitReview() {
    if (!token) return alert('Please log in first.');
    if (!job) return;
    if (!listen.canSubmit) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/jobs/${job._id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, feedback }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || `Failed: ${res.status}`);
      }
      // Success → navigate to dashboard or “Thanks” page
      router.push('/worker/dashboard');
    } catch (e: any) {
      alert(e.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse text-gray-500">Loading job…</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-red-600">Job not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{job.title}</h1>
          {job.tags?.length ? (
            <div className="mt-1 text-sm text-gray-600">
              {job.tags.map((t) => (
                <span key={t} className="mr-2">#{t}</span>
              ))}
            </div>
          ) : null}
          {job.payoutPerReview != null && (
            <div className="mt-1 text-sm text-gray-700">
              Payout per review: <b>${job.payoutPerReview.toFixed(2)}</b>
            </div>
          )}
        </div>
        <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
          Status: {job.status}
        </div>
      </header>

      {job.description && (
        <p className="text-gray-800">{job.description}</p>
      )}

      {/* Spotify Embed + local timer controls */}
      <section className="border rounded-lg p-4">
        <SpotifyPlayer
          trackUrl={job.link}
          onStart={listen.start}
          onPause={listen.pause}
          showControls
          allowNativeControls
        />

        {/* Visual countdown */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              Listening progress
            </span>
            <span className="text-sm text-gray-600">
              {listen.elapsed}s / 30s
            </span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded">
            <div
              className="h-2 bg-green-600 rounded transition-all"
              style={{
                width: `${Math.min(100, (listen.elapsed / 30) * 100)}%`,
              }}
            />
          </div>
          {!listen.canSubmit ? (
            <p className="mt-2 text-xs text-gray-600">
              Keep listening… <b>{listen.remaining}</b>s to unlock Submit.
            </p>
          ) : (
            <p className="mt-2 text-xs text-green-700 font-medium">
              You can submit your review now.
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            {!listen.running ? (
              <button
                type="button"
                onClick={listen.start}
                className="px-3 py-1.5 rounded bg-green-600 text-white text-sm hover:bg-green-700"
              >
                ▶︎ Start Timer
              </button>
            ) : (
              <button
                type="button"
                onClick={listen.pause}
                className="px-3 py-1.5 rounded bg-gray-200 text-gray-900 text-sm hover:bg-gray-300"
              >
                ⏸ Pause Timer
              </button>
            )}
            <button
              type="button"
              onClick={listen.reset}
              className="px-3 py-1.5 rounded bg-gray-100 text-gray-800 text-sm hover:bg-gray-200"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </section>

      {/* Review form */}
      <section className="border rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Rating
          </label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="mt-1 block w-32 rounded border-gray-300"
          >
            {[5, 4, 3, 2, 1, 0].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded border-gray-300"
            placeholder="Share your thoughts…"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!listen.canSubmit || submitting}
            onClick={submitReview}
            className={`px-4 py-2 rounded text-white text-sm ${
              !listen.canSubmit || submitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-black hover:bg-gray-800'
            }`}
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>

          {!listen.canSubmit && (
            <span className="text-xs text-gray-600">
              Listen for at least <b>30 seconds</b> to enable submit.
            </span>
          )}
        </div>
      </section>
    </div>
  );
}