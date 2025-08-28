// frontend/src/components/PostJobModal.tsx
'use client'
import { useState } from 'react'
import { X } from 'lucide-react'

export function PostJobModal({ onClose, onSuccess }:{ onClose:()=>void, onSuccess:()=>void }){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [payoutPerReview, setPayoutPerReview] = useState(0)
  const [maxListeners, setMaxListeners] = useState(10)
  const [expireAt, setExpireAt] = useState<string>('')
  const [link, setLink] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(){
    setSubmitting(true)
    try{
      const res = await fetch('/api/jobs', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({
        title, description, tags: tags.split(',').map(s=>s.trim()).filter(Boolean), payoutPerReview, maxListeners, expireAt: expireAt || undefined, link
      }) })
      if(!res.ok) throw new Error('Failed to create job')
      onSuccess()
    }catch(err){ console.error(err) }
    finally{ setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-6" role="dialog" aria-modal>
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] card-sheen">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold">Post a new job</h2>
          <button onClick={onClose} className="btn-ghost"><X size={16}/></button>
        </div>

        <div className="p-4 grid gap-4">
          <label className="grid gap-1 text-sm">
            <span>Title</span>
            <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., Honest review for indie pop single"/>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Track link</span>
            <input className="input" value={link} onChange={e=>setLink(e.target.value)} placeholder="https://open.spotify.com/track/..."/>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Description</span>
            <textarea className="input min-h-28" value={description} onChange={e=>setDescription(e.target.value)} placeholder="What should listeners focus on? Vocal mix, lyrics, arrangement…"/>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1 text-sm">
              <span>Payout per review ($)</span>
              <input type="number" className="input" min={0} step={0.5} value={payoutPerReview} onChange={e=>setPayoutPerReview(Number(e.target.value))}/>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Max listeners</span>
              <input type="number" className="input" min={1} value={maxListeners} onChange={e=>setMaxListeners(Number(e.target.value))}/>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1 text-sm">
              <span>Optional expire date</span>
              <input type="datetime-local" className="input" value={expireAt} onChange={e=>setExpireAt(e.target.value)}/>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Tags (comma separated)</span>
              <input className="input" value={tags} onChange={e=>setTags(e.target.value)} placeholder="pop, vocal, mastering"/>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary disabled:opacity-60" disabled={submitting || !title || !link} onClick={submit}>{submitting ? 'Posting…' : 'Post job'}</button>
        </div>
      </div>
    </div>
  )
}
