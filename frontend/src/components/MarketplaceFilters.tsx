// frontend/src/components/MarketplaceFilters.tsx
'use client'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export type FilterState = {
  q: string
  tags: string[]
  sort: 'new'|'payout'|'ending'
  payoutMin: number
  onlyOpen: boolean
}

export default function MarketplaceFilters({ initial, onApply, onClose }:{ initial: FilterState, onApply:(f:FilterState)=>void, onClose:()=>void }){
  const [state, setState] = useState<FilterState>(initial)
  useEffect(()=> setState(initial), [initial])

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/60 backdrop-blur-sm p-0 sm:p-6" role="dialog" aria-modal>
      <div className="w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] card-sheen">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold">Filters</h2>
          <button onClick={onClose} className="btn-ghost"><X size={16}/></button>
        </div>

        <div className="p-4 grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="grid gap-1 text-sm">
              <span>Minimum payout ($)</span>
              <input type="number" className="input" min={0} value={state.payoutMin} onChange={e=>setState(s=>({...s, payoutMin:Number(e.target.value)}))}/>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Sort by</span>
              <select className="select" value={state.sort} onChange={e=>setState(s=>({...s, sort:e.target.value as any}))}>
                <option value="new">Newest</option>
                <option value="payout">Highest payout</option>
                <option value="ending">Ending soon</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span>Tags (comma separated)</span>
            <input className="input" placeholder="pop, hip-hop, vocal, mixing" value={state.tags.join(', ')} onChange={(e)=>{
              const raw = e.target.value.split(',').map(s=>s.trim()).filter(Boolean)
              setState(s=>({...s, tags: raw}))
            }}/>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={state.onlyOpen} onChange={(e)=>setState(s=>({...s, onlyOpen:e.target.checked}))}/>
            <span>Only show open jobs</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={()=>onApply(state)}>Apply</button>
        </div>
      </div>
    </div>
  )
}
