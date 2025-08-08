'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import ReviewForm from '@/components/ReviewForm';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, hasRole } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const data = await api(`/jobs/${id}`);
    setJob(data);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function accept() {
    setErr(null); setLoading(true);
    try {
      await api(`/jobs/${id}/accept`, { method: 'POST', token, body: { dueMinutes: 60 } });
      await load();
    } catch (e:any) { setErr(e.message); } finally { setLoading(false); }
  }

  async function release() {
    setErr(null); setLoading(true);
    try {
      await api(`/jobs/${id}/release`, { method: 'POST', token });
      await load();
    } catch (e:any) { setErr(e.message); } finally { setLoading(false); }
  }

  if (!job) return <div className="p-4">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{job.title}</h1>
        <span className="text-xs px-2 py-1 rounded bg-black-100 border">{job.status}</span>
      </div>

      {job.link && <a href={job.link} target="_blank" className="underline text-sm break-all">{job.link}</a>}
      {job.description && <p className="text-gray-700">{job.description}</p>}
      <div className="flex flex-wrap gap-2">
        {(job.tags || []).map((t:string) => <span key={t} className="text-xs bg-black-100 px-2 py-1 rounded border">{t}</span>)}
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      {hasRole('worker') && (
        <div className="flex gap-2">
          <button disabled={loading} onClick={accept} className="px-4 py-2 rounded bg-black text-white">Accept</button>
          <button disabled={loading} onClick={release} className="px-4 py-2 rounded border">Release</button>
        </div>
      )}

      {hasRole('worker') && (
        <ReviewForm jobId={typeof id==='string'? id : (Array.isArray(id)? id[0] : '')} onDone={load} />
      )}

      {hasRole('payer') && job.payerId && (
        <button
          className="px-4 py-2 rounded border"
          onClick={async () => {
            try {
              await api(`/jobs/${id}/close`, { method: 'PATCH', token });
              await load();
              router.refresh();
            } catch (e:any) { setErr(e.message); }
          }}
        >
          Close Job
        </button>
      )}
    </div>
  );
}
