'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ReviewForm({ jobId, onDone }: { jobId: string; onDone: () => void }) {
      console.log('ReviewForm jobId =', jobId);

  const { token } = useAuth();
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  async function submit() {
    setErr(null); setLoading(true);
    try {
      await api(`/jobs/${jobId}/review`, {
        method: 'POST',
        token,
        body: { rating, feedback }
      });
      onDone();
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded p-4 space-y-3">
      <h4 className="font-semibold">Submit Review</h4>
      <input type="number" min={0} max={5} className="border p-2 rounded w-24" value={rating} onChange={e=>setRating(Number(e.target.value))} />
      <textarea className="w-full border p-2 rounded" rows={4} placeholder="Your feedback" value={feedback} onChange={e=>setFeedback(e.target.value)} />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button disabled={loading} onClick={submit} className="px-4 py-2 rounded bg-black text-white">
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
}