'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import JobCard from '@/components/JobCard';

export default function PayerDashboard() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ items?: any[] }|any>('/jobs/mine/posted', { token });
        setItems(Array.isArray(data) ? data : (data.items || []));
      } catch (e:any) { setErr(e.message); }
    })();
  }, [token]);

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">My Posted Jobs</h1>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <a href="/payer/jobs/new" className="text-sm underline">Post a New Job HERE</a>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(j => <JobCard key={j._id} job={j} />)}
      </div>
    </div>
  );
}

// export default function PayerDashboard() {
//   return (
//     <main className="p-6">
//       <h1 className="text-2xl font-bold">Payer Dashboard</h1>
//       <p className="text-gray-500">Upload tracks, set job limits, and view results.</p>
//       <img src="/assets/SignUp.svg" alt="SmashHaus" className="" />
//     </main>
//   );
// }