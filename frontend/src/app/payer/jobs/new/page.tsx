'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function NewJobPage() {
  const { token, hasRole } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string>(''); // comma-separated
  const [maxListeners, setMaxListeners] = useState<number>(3);
  const [payoutPerReview, setPayout] = useState<number>(0);
  const [isBetaFree, setBeta] = useState<boolean>(true);

  const [err, setErr] = useState<string|null>(null);
  const [ok, setOk] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  if (!hasRole('payer')) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold mb-2">Payer access only</h1>
        <p className="text-sm text-gray-600">Your account doesn’t have the payer role.</p>
      </div>
    );
  }

  async function createJob(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setOk(null); setLoading(true);
    try {
      const body = {
        title,
        link,
        description,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        maxListeners,
        payoutPerReview,
        isBetaFree
      };
      const job = await api('/jobs', { method: 'POST', token, body });
      setOk('Job created!');
      // small pause then go to dashboard
      setTimeout(() => router.push(`/payer/dashboard`), 600);
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create a Job</h1>
      <form onSubmit={createJob} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input className="w-full border p-2 rounded" value={title} onChange={e=>setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Link (song/video)</label>
          <input className="w-full border p-2 rounded" value={link} onChange={e=>setLink(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea className="w-full border p-2 rounded" rows={4} value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Tags (comma separated)</label>
            <input className="w-full border p-2 rounded" value={tags} onChange={e=>setTags(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Max Listeners</label>
            <input type="number" min={1} className="w-full border p-2 rounded" value={maxListeners} onChange={e=>setMaxListeners(Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Payout per Review</label>
            <input type="number" min={0} step="0.01" className="w-full border p-2 rounded" value={payoutPerReview} onChange={e=>setPayout(Number(e.target.value))} />
          </div>
          <label className="flex items-center gap-2 mt-6">
            <input type="checkbox" checked={isBetaFree} onChange={e=>setBeta(e.target.checked)} />
            Beta (free)
          </label>
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}
        {ok && <p className="text-green-600 text-sm">{ok}</p>}

        <button disabled={loading} className="px-4 py-2 rounded bg-black text-white">
          {loading ? 'Creating...' : 'Create Job'}
        </button>
      </form>
    </div>
  );
}
