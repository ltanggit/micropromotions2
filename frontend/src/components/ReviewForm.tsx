'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ReviewForm({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const [ok, setOk] = useState<string|null>(null);

  async function submit() {
    if (!jobId) { setErr('Missing job id'); return; }
    setErr(null); setOk(null); setLoading(true);
    try {
      await api(`/jobs/${jobId}/review`, { // <-- singular
        method: 'POST',
        token,
        body: { rating, feedback }
      });
      setOk('Review submitted!');
      setFeedback('');
      setRating(5);
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
      <div className="flex items-center gap-3">
        <label className="text-sm">Rating (0-5)</label>
        <input
          type="number"
          min={0}
          max={5}
          className="border p-2 rounded w-24"
          value={rating}
          onChange={e=>setRating(Number(e.target.value))}
        />
      </div>
      <textarea
        className="w-full border p-2 rounded"
        rows={4}
        placeholder="Your feedback"
        value={feedback}
        onChange={e=>setFeedback(e.target.value)}
      />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      {ok && <p className="text-green-600 text-sm">{ok}</p>}
      <button disabled={loading} onClick={submit} className="px-4 py-2 rounded bg-black text-white">
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
}
