// // frontend/src/components/JobCard.tsx
// import Link from 'next/link';

// type Job = {
//   _id: string;
//   title: string;
//   description?: string;
//   tags?: string[];
//   status: 'open'|'full'|'closed'|'expired';
//   publishedAt?: string;
//   payoutPerReview?: number;
//   ratingAvg?: number;
//   ratingCount?: number;
// };

// export default function JobCard({ job }: { job: Job }) {
//   return (
//     <div className="border rounded p-4 hover:shadow-sm transition">
//       <div className="flex items-center justify-between">
//         <h3 className="text-lg font-semibold">{job.title}</h3>
//         <span className="text-xs px-2 py-1 rounded border bg-black-100">{job.status}</span>
//       </div>
//       {job.description && <p className="mt-2 text-sm text-white-700 line-clamp-2">{job.description}</p>}
//       <div className="mt-2 flex flex-wrap gap-2">
//         {(job.tags || []).map(t => (
//           <span key={t} className="text-xs bg-black-100 px-2 py-1 rounded border">{t}</span>
//         ))}
//       </div>
//       <div className="mt-3 flex items-center justify-between">
//         <div className="text-sm text-gray-600">
//           {job.ratingAvg?.toFixed?.(1) ?? '—'} ★ ({job.ratingCount ?? 0})
//         </div>
//         <Link href={`/jobs/${job._id}`} className="text-sm underline">View</Link>
//       </div>
//     </div>
//   );
// }

'use client'
import { Clock, DollarSign, Headphones, Tag } from 'lucide-react'

export type Job = {
  _id: string
  title: string
  description?: string
  tags?: string[]
  link?: string
  payer?: { name?: string }
  maxListeners?: number
  payoutPerReview?: number
  status?: 'open'|'full'|'closed'|'expired'
  publishedAt?: string
  expireAt?: string
  assignments?: Array<{ workerId: string; status: 'accepted'|'completed'|'expired'|'rejected' }>
  ratingCount?: number
  ratingAvg?: number
}

export default function JobCard({ job, role }:{ job:Job, role:'worker'|'payer'|'guest' }){
  const assigned = Array.isArray(job.assignments) ? job.assignments.filter(a=>a.status==='accepted' || a.status==='completed').length : 0
  const progress = job.maxListeners ? Math.min(100, Math.round((assigned/(job.maxListeners))*100)) : 0
  const soon = job.expireAt ? daysLeft(job.expireAt) <= 2 : false

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 card-sheen p-4 flex flex-col gap-3 shadow-sm hover:shadow-xl transition-shadow">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold leading-tight line-clamp-2">{job.title}</h3>
          <p className="mt-1 text-xs opacity-70">by {job.payer?.name ?? 'Unknown'}</p>
        </div>
        <span className="badge">{job.status ?? 'open'}</span>
      </header>

      {job.description && <p className="text-sm opacity-90 line-clamp-3">{job.description}</p>}

      {!!job.tags?.length && (
        <div className="flex flex-wrap gap-1.5 text-[11px] opacity-90">
          {job.tags.slice(0,4).map(t => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-[color:var(--muted)]"><Tag size={10}/> {t}</span>
          ))}
          {job.tags.length>4 && <span className="opacity-70">+{job.tags.length-4} more</span>}
        </div>
      )}

      <div className="mt-1 grid grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-1.5 opacity-90"><DollarSign size={14}/> ${(job.payoutPerReview ?? 0).toFixed(2)}</div>
        <div className="flex items-center gap-1.5 opacity-90"><Headphones size={14}/> {assigned}/{job.maxListeners ?? '-'} taken</div>
        {job.expireAt && (
          <div className={`flex items-center gap-1.5 ${soon? 'text-[color:var(--brand-100)]' : 'opacity-90'}`}>
            <Clock size={14}/> {daysLeft(job.expireAt)}d left
          </div>
        )}
      </div>

      {typeof job.maxListeners === 'number' && (
        <div className="mt-1 h-2 rounded-full bg-black/40 overflow-hidden">
          <div className="h-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--brand-100), var(--brand-200))' }} />
        </div>
      )}

      <footer className="mt-2 flex items-center justify-between">
        {job.link ? (
          <a className="text-xs underline opacity-80 hover:opacity-100" href={job.link} target="_blank">Preview track</a>
        ) : <span/>}
        {role==='worker' ? (
          <button className="btn-primary text-xs">Apply / Take job</button>
        ) : role==='payer' ? (
          <button className="btn-ghost text-xs">Manage</button>
        ) : (
          <a className="btn-primary text-xs" href="/login">Sign in to apply</a>
        )}
      </footer>
    </article>
  )
}

function daysLeft(iso:string){
  const end = new Date(iso).getTime(); const now = Date.now();
  return Math.max(0, Math.ceil((end-now)/ (1000*60*60*24)))
}
