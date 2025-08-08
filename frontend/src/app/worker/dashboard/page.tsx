'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import JobCard from '@/components/JobCard';

export default function WorkerDashboard() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ items?: any[] }|any>('/jobs/mine/accepted', { token });
        setItems(Array.isArray(data) ? data : (data.items || []));
      } catch (e:any) { setErr(e.message); }
    })();
  }, [token]);

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">My Accepted Jobs</h1>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(j => <JobCard key={j._id} job={j} />)}
      </div>
    </div>
  );
}

// export default function WorkerDashboard() {
//   return (
//     <main className="p-6">
//       <h1 className="text-2xl font-bold">Worker Dashboard</h1>
//       <p className="text-gray-500">Browse tasks, listen to tracks, and leave reviews.</p>
//       <img src="/assets/WorkerPage.svg" alt="SmashHaus" className="" />
//     </main>
//   );
// }