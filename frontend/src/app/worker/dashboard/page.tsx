// frontend/src/app/worker/dashboard/page.tsx
// 'use client';
// import { useEffect, useState } from 'react';
// import { useAuth } from '@/lib/auth';
// import { api } from '@/lib/api';
// import JobCard from '@/components/JobCard';

// export default function WorkerDashboard() {
//   const { token } = useAuth();
//   const [items, setItems] = useState<any[]>([]);
//   const [err, setErr] = useState<string|null>(null);

//   useEffect(() => {
//     (async () => {
//       try {
//         const data = await api<{ items?: any[] }|any>('/jobs/mine/accepted', { token });
//         setItems(Array.isArray(data) ? data : (data.items || []));
//       } catch (e:any) { setErr(e.message); }
//     })();
//   }, [token]);

//   return (
//     <div className="mx-auto max-w-5xl p-4 space-y-4">
//       <h1 className="text-2xl font-semibold">My Accepted Jobs</h1>
//       {err && <p className="text-red-600 text-sm">{err}</p>}
//       <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
//         {items.map(j => <JobCard key={j._id} job={j} />)}
//       </div>
//     </div>
//   );
// }

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Job = {
  _id: string;
  title: string;
  status: string;
  assignments?: Array<{ status: string; workerId: string; dueAt?: string }>;
};

export default function WorkerDashboard() {
  const { token } = useAuth();
  const [accepted, setAccepted] = useState<Job[]>([]);
  const [past, setPast] = useState<Job[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true); setErr(null);
      try {
        // current jobs (accepted)
        const cur = await api<Job[]>('/jobs/mine/accepted', { token });
        setAccepted(cur);

        // past jobs — simple heuristic: completed or closed where this worker has a completed assignment
        // (if you added a dedicated endpoint, swap it in here)
        const all = await api<{ items: Job[] }>('/jobs/mine/history', { token });
        // const all = await api<{ items: Job[] }>('/jobs?status=closed&limit=100');
        // if there are jobs, filter to those where this worker has a completed assignment:
        if (all.items) {
          const me = all.items.filter(j =>
            j.assignments?.some(a => a.status === 'completed')
          );
          setPast(me);
        }
      } catch (e:any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (!token) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Worker Dashboard</h1>
        <p>Please <a className="underline" href="/login">log in</a> to view your jobs.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Worker Dashboard</h1>
      {err && <p className="text-red-600">{err}</p>}
      {loading && <p>Loading…</p>}

      <section>
        <h2 className="font-medium mb-3">Current jobs</h2>
        {accepted.length === 0 ? (
          <p className="text-sm text-gray-500">
            No current jobs. <a className="underline" href="/jobs">Browse the job board</a>.
          </p>
        ) : (
          <ul className="grid gap-3">
            {accepted.map(j => (
              <li key={j._id} className="border rounded p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{j.title}</div>
                  <div className="text-xs text-gray-500">status: {j.status}</div>
                </div>
                <Link className="px-3 py-2 border rounded" href={`/worker/job/${j._id}`}>
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-medium mb-3">Past jobs</h2>
        {past.length === 0 ? (
          <p className="text-sm text-gray-500">No past jobs yet.</p>
        ) : (
          <ul className="grid gap-3">
            {past.map(j => (
              <li key={j._id} className="border rounded p-4">
                <div className="font-medium">{j.title}</div>
                <div className="text-xs text-gray-500">status: {j.status}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}