// frontend/src/components/JobItem.tsx
'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
  expireAt?: string
  assignments?: Array<{ workerId: string; status: 'accepted'|'completed'|'expired'|'rejected' }>
}

export default function JobItem({
  job, role, apiBase, token, onAccepted
}: {
  job: Job
  role: 'worker'|'payer'|'guest'
  apiBase: string
  token?: string | null
  onAccepted?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const assigned = Array.isArray(job.assignments)
    ? job.assignments.filter(a => a.status==='accepted' || a.status==='completed').length
    : 0
  const progress = job.maxListeners
    ? Math.min(100, Math.round((assigned / job.maxListeners) * 100))
    : 0

//   async function accept() {
//     if (role !== 'worker') return
//     try {
//       // Try /assign; fallback to /accept
//       let res = await fetch(`${apiBase}/jobs/${job._id}/assign`, {
//         method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }
//       })
//       if (res.status === 404) {
//         res = await fetch(`${apiBase}/jobs/${job._id}/accept`, {
//           method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }
//         })
//       }
//       if (!res.ok) throw new Error(await res.text())
//       onAccepted?.()
//       setOpen(false)
//     } catch (e:any) {
//       alert('Error: ' + (e?.message ?? e))
//     }
//   }

  async function accept() {
    if (!token) { window.location.href = '/login'; return } // must be signed in
    setSubmitting(true); setError(null)
    try {
      const res = await fetch(`${apiBase}/jobs/${job._id}/accept`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,        // <-- important
        },
        body: JSON.stringify({ dueMinutes: 60 }),   // backend supports this
      })
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login'
        return
      }
      if (!res.ok) throw new Error(await res.text())
      onAccepted?.()
      setOpen(false)
    } catch (e:any) {
      setError(e?.message || 'Failed to accept')
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div
      className="group rounded-xl border border-[var(--border)] bg-[var(--card)]/90 card-sheen
                 transition transform hover:-translate-y-[1px]
                 hover:shadow-xl hover:shadow-[color:color-mix(in_oklab,var(--brand-200)_25%,transparent)]
                 hover:border-[color:color-mix(in_oklab,var(--brand-200)_40%,transparent)]"
    >
      {/* Summary row */}
      <button
        onClick={()=>setOpen(v=>!v)}
        className="w-full flex justify-between items-center px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{job.title}</h3>
          <p className="text-xs opacity-70 truncate">
            {job.payer?.name ?? 'Unknown'} — {job.status ?? 'open'}
          </p>
        </div>
        {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
      </button>

      {/* Details: left = job info (card style), right = actions */}
      {open && (
        <div className="px-4 pb-4">
          <div className="grid gap-4 md:grid-cols-[1fr,260px]">
            {/* LEFT (Job card info) */}
            <div className="space-y-3">
              {job.description && (
                <p className="text-sm opacity-90">{job.description}</p>
              )}

              {!!job.tags?.length && (
                <div className="flex flex-wrap gap-1.5 text-[11px] opacity-90">
                  {job.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-[color:var(--muted)]">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {typeof job.maxListeners === 'number' && (
                <div className="mt-1 h-2 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--brand-100), var(--brand-200))' }}
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 text-xs opacity-90">
                <div>💵 {(job.payoutPerReview ?? 0).toFixed(2)}</div>
                <div>🎧 {assigned}/{job.maxListeners ?? '-'}</div>
                {job.expireAt && <div>⏳ {new Date(job.expireAt).toLocaleDateString()}</div>}
              </div>

              {job.link && (
                <a className="text-xs underline opacity-80 hover:opacity-100" href={job.link} target="_blank">Preview track</a>
              )}
            </div>

            {/* RIGHT (Action panel) */}
            <aside className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 flex flex-col gap-2 md:sticky md:top-2">
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span>Pay / review</span><strong>${(job.payoutPerReview ?? 0).toFixed(2)}</strong>
                </div>
                <div className="flex items-center justify-between opacity-80 text-xs mt-1">
                  <span>Capacity</span><span>{assigned}/{job.maxListeners ?? '-'}</span>
                </div>
                {job.expireAt && (
                  <div className="flex items-center justify-between opacity-80 text-xs">
                    <span>Expires</span><span>{new Date(job.expireAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="h-px bg-[var(--border)] my-1" />
              <div className="flex gap-2">
                <a className="btn-ghost flex-1 text-xs" href={`/jobs/${job._id}`}>View</a>
                {role==='worker'
                  ? <button className="btn-primary flex-1 text-xs" onClick={accept}>Accept</button>
                  : <a className="btn-primary flex-1 text-xs" href="/login">Accept (Must Login As A Worker)</a>
                }
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  )
}
