// frontend/src/app/jobs/page.tsx
// 'use client';
// import { useEffect, useState } from 'react';
// import { api } from '@/lib/api';
// import JobCard from '@/components/JobCard';

// export default function JobsPage() {
//   const [jobs, setJobs] = useState<any[]>([]);
//   const [q, setQ] = useState('');

//   async function load() {
//     const data = await api<{ items: any[] }>('/jobs?status=open' + (q ? `&q=${encodeURIComponent(q)}` : ''));
//     setJobs(data.items);
//   }

//   useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

//   return (
//     <div className="mx-auto max-w-5xl p-4 space-y-4">
//       <div className="flex gap-2">
//         <input className="border rounded p-2 flex-1" placeholder="Search jobs" value={q} onChange={e=>setQ(e.target.value)} />
//         <button className="px-4 py-2 rounded bg-black text-white" onClick={load}>Search</button>
//       </div>
//       <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
//         {jobs.map(j => <JobCard key={j._id} job={j} />)}
//       </div>
//     </div>
//   );
// }

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Job = {
  _id: string;
  title: string;
  description?: string;
  tags?: string[];
  status: 'open'|'full'|'closed'|'expired';
  payoutPerReview?: number;
  maxListeners: number;
  ratingAvg?: number;
  publishedAt?: string;
};

export default function JobsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Job[]>([]);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (tag) p.set('tag', tag);
    p.set('status', 'open');
    p.set('limit', '30');
    return p.toString();
  }, [q, tag]);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const data = await api<{ items: Job[] }>(`/jobs?${params}`);
      setItems(data.items);
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [params]);

  async function accept(jobId: string) {
    if (!token) return alert('Please log in first.');
    try {
      await api(`/jobs/${jobId}/accept`, {
        method: 'POST',
        body: { dueMinutes: 60 },
        token
      });
      alert('Accepted! Find it in your Worker Dashboard.');
      load();
    } catch (e:any) {
      alert(e.message || 'Failed to accept job');
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <h1 className="text-2xl font-semibold">Job board</h1>
        <div className="flex gap-2">
          <input
            className="border rounded px-3 py-2"
            placeholder="Search title/desc/tags…"
            value={q}
            onChange={e=>setQ(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Tag (e.g. pop)"
            value={tag}
            onChange={e=>setTag(e.target.value)}
          />
        </div>
      </header>

      {err && <p className="text-red-600">{err}</p>}
      {loading && <p>Loading…</p>}

      <ul className="grid gap-4">
        {items.map(j => (
          <li key={j._id} className="border rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-medium">{j.title}</h2>
              <p className="text-sm text-gray-600">{j.description}</p>
              <div className="text-xs text-gray-500 mt-1">
                <span>{j.tags?.join(' • ')}</span>
                {j.payoutPerReview ? <span className="ml-2">• ${j.payoutPerReview.toFixed(2)}/review</span> : null}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/jobs/${j._id}`} className="px-3 py-2 border rounded">
                View
              </Link>
              <button
                onClick={() => accept(j._id)}
                className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
                disabled={!token || j.status !== 'open'}
                title={!token ? 'Login required' : ''}
              >
                Accept
              </button>
            </div>
          </li>
        ))}
      </ul>

      <footer className="text-sm text-gray-500">
        {user ? `Logged in as ${user?.email}` : 'Not logged in'}
      </footer>
    </div>
  );
}