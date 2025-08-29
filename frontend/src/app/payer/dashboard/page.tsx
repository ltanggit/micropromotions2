// frontend/src/app/payer/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import JobCard from '@/components/JobCard';
import Link from 'next/link';

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
      {err && <p className="text-[#FFAF47] text-sm">{err}</p>}
      <Link href="/payer/jobs/new" className="btn-primary">Post A New Job</Link>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(j => <JobCard key={j._id} job={j} />)}
      </div>
    </div>
  );
}