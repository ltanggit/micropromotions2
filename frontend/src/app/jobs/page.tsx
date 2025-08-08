'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import JobCard from '@/components/JobCard';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [q, setQ] = useState('');

  async function load() {
    const data = await api<{ items: any[] }>('/jobs?status=open' + (q ? `&q=${encodeURIComponent(q)}` : ''));
    setJobs(data.items);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-4">
      <div className="flex gap-2">
        <input className="border rounded p-2 flex-1" placeholder="Search jobs" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="px-4 py-2 rounded bg-black text-white" onClick={load}>Search</button>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {jobs.map(j => <JobCard key={j._id} job={j} />)}
      </div>
    </div>
  );
}