// frontend/src/components/ReviewForm.tsx
// 'use client';
// import { useState } from 'react';
// import { api } from '@/lib/api';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/lib/auth';

// export default function ReviewForm({ jobId, onDone }: { jobId: string; onDone: () => void }) {
//   const { token } = useAuth();
//   const [rating, setRating] = useState(5);
//   const [feedback, setFeedback] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState<string|null>(null);
//   const [ok, setOk] = useState<string|null>(null);
//   const router = useRouter();
  

//   async function submit() {
//     if (!jobId) { setErr('Missing job id'); return; }
//     setErr(null); setOk(null); setLoading(true);
//     try {
//       await api(`/jobs/${jobId}/review`, { // <-- singular
//         method: 'POST',
//         token,
//         body: { rating, feedback }
//       });
//       setOk('Review submitted!');
//       setFeedback('');
//       setRating(5);
//       onDone();
//       // small pause then go to dashboard
//       setTimeout(() => router.push(`/worker/dashboard`), 600);
//     } catch (e:any) {
//       setErr(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="border rounded p-4 space-y-3">
//       <h4 className="font-semibold">Submit Review</h4>
//       <div className="flex items-center gap-3">
//         <label className="text-sm">Rating (0-5)</label>
//         <input
//           type="number"
//           min={0}
//           max={5}
//           className="border p-2 rounded w-24"
//           value={rating}
//           onChange={e=>setRating(Number(e.target.value))}
//         />
//       </div>
//       <textarea
//         className="w-full border p-2 rounded"
//         rows={4}
//         placeholder="Your feedback"
//         value={feedback}
//         onChange={e=>setFeedback(e.target.value)}
//       />
//       {err && <p className="text-red-600 text-sm">{err}</p>}
//       {ok && <p className="text-green-600 text-sm">{ok}</p>}
//       <button disabled={loading} onClick={submit} className="px-4 py-2 rounded bg-black text-white hover:bg-white hover:text-black">
//         {loading ? 'Submitting...' : 'Submit'}
//       </button>
//     </div>
//   );
// }

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  jobId: string;
  canSubmit: boolean; // parent controls unlock
  apiBase?: string;   // defaults to http://localhost:5000/api
  onSubmitted?: () => void;
};

export default function ReviewForm({
  jobId,
  canSubmit,
  apiBase = 'http://localhost:5000/api',
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || busy) return;

    try {
      setBusy(true);
      setError(null);
      setOk(false);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${apiBase}/jobs/${jobId}/review`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, feedback }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setOk(true);
      onSubmitted?.();
      router.push('/jobs');
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 p-4 border rounded-md bg-black flex flex-col gap-3">
      <div className="text-base font-semibold">Your Review</div>

      <label className="text-sm">
        Rating
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="ml-2 border rounded px-2 py-1"
        >
          {[5, 4, 3, 2, 1, 0].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        Feedback
        <textarea
          className="mt-1 w-full border rounded p-2 min-h-[100px]"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share helpful, specific feedback…"
        />
      </label>

      {!canSubmit && (
        <div className="text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1">
          You’ll be able to submit after the listening timer completes.
        </div>
      )}

      {error && <div className="text-sm text-[#FFAF47]">{error}</div>}
      {ok && (
        <div className="text-sm text-green-700 bg-green-50 rounded px-2 py-1">
          Thank you! Your review was submitted.
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={!canSubmit || busy}
          className={`px-4 py-2 rounded text-[#140C00] ${
            !canSubmit || busy ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FFAF47] hover:bg-[#F58B00]'
          }`}
        >
          {busy ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}
