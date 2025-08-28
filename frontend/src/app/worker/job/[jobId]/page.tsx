// frontend/src/app/worker/job/[jobId]/page.tsx

// =========BEST VERSION===================

'use client';

import { useEffect, useMemo, useState } from 'react';
import EmbedPlayerWithTimer from '@/components/EmbedPlayerWithTimer';
import ReviewForm from '@/components/ReviewForm';

type Job = {
  _id: string;
  title: string;
  description?: string;
  link: string;          // should be a Spotify track link/URI/id
  tags?: string[];
  payoutPerReview?: number;
  maxListeners?: number;
  status: 'open' | 'full' | 'closed' | 'expired';
  payerId: string;
};

const API_BASE = 'http://localhost:5000/api';

export default function WorkerJobPage({ params }: { params: { jobId: string } }) {
  const { jobId } = params;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlock, setUnlock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch job details
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/jobs/${jobId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Job = await res.json();
        if (mounted) setJob(data);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load job');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [jobId]);

  const spotifyRef = useMemo(() => job?.link || '', [job]);

  if (loading) {
    return <div className="p-6">Loading job…</div>;
  }
  if (error || !job) {
    return (
      <div className="p-6 text-red-700">
        {error || 'Job not found.'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
      {/* Job Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{job.title}</h1>
          {job.tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {job.tags.map((t) => (
                <span key={t} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  #{t}
                </span>
              ))}
            </div>
          ) : null}
          {job.description ? (
            <p className="mt-3 text-sm text-gray-700">{job.description}</p>
          ) : null}
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm">Payout</div>
          <div className="text-lg font-semibold">
            {job.payoutPerReview ? `$${job.payoutPerReview.toFixed(2)}` : 'Free / Beta'}
          </div>
          <div className="mt-1 text-xs text-gray-500">Max listeners: {job.maxListeners ?? '—'}</div>
          <div className="mt-1 text-xs">Status: <span className="font-medium">{job.status}</span></div>
        </div>
      </div>

      {/* Player + Timer */}
      <EmbedPlayerWithTimer
        jobId={job._id}
        spotifyTrackRef={spotifyRef}
        minSeconds={30}
        onUnlocked={() => setUnlock(true)}
        height={200}
      />

      {/* Review */}
      <ReviewForm jobId={job._id} canSubmit={unlock} apiBase={API_BASE} onSubmitted={() => {
        // Optional: navigate to dashboard or show toast
      }} />
    </div>
  );
}