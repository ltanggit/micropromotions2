// // frontend/src/app/jobs/page.tsx

// ================================
// Marketplace page — full-width list with collapsible items spanning page
// ================================

'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Briefcase, Filter, Plus, Search, X, ChevronDown, ChevronUp, Clock, DollarSign, Headphones } from 'lucide-react'
import { Job } from '@/components/JobCard'
import MarketplaceFilters, { FilterState } from '@/components/MarketplaceFilters'
import { PostJobModal } from '@/components/PostJobModal'
import JobItem from '@/components/JobItem'
import { useAuth } from '@/lib/auth'

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE|| '').replace(/\/$/, '')

type User = {
  _id: string;
  user?: { roles?: string[] };
  roles: string[];
};

function isAbort(err: unknown){
  return err instanceof DOMException && err.name === 'AbortError'
}

async function safeJson(res: Response){
  const ct = res.headers.get('content-type') || ''
  const text = await res.text()
  if(ct.includes('text/html') || text.startsWith('<!DOCTYPE')){
    throw new Error(`Server returned HTML instead of JSON from ${res.url}`)
  }
  try{ return JSON.parse(text) } catch{
    throw new Error('Invalid JSON from server')
  }
}

export default function MarketplacePage(){
  const { token } = useAuth()
  const [role, setRole] = useState<'worker'|'payer'|'guest'>('guest')
  const [filters, setFilters] = useState<FilterState>({ q:'', tags:[], sort:'new', payoutMin:0, onlyOpen:true })
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [postOpen, setPostOpen] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [expanded, setExpanded] = useState<string|null>(null)

  const headers = useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/users/me`, { method: 'GET', headers });
        if (!res.ok) throw new Error(`GET /users/me → ${res.status}`);
        const meData: User = await res.json();
        const roles: string[] = meData?.roles ?? meData?.user?.roles ?? [];
        if (roles.includes('worker')) setRole('worker');
        else if (roles.includes('payer')) setRole('payer');
        else setRole('guest');
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, headers]);

  useEffect(()=>{
    const controller = new AbortController()
    const { signal } = controller
    let active = true

    async function load(){
      try{
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if(filters.q) params.set('q', filters.q)
        if(filters.tags.length) params.set('tag', filters.tags[0])
        if(filters.payoutMin) params.set('payoutMin', String(filters.payoutMin))
        if(filters.onlyOpen) params.set('status', 'open')
        if(filters.sort === 'new') { params.set('sort','publishedAt'); params.set('dir','desc') }
        if(filters.sort === 'payout') { params.set('sort','payoutPerReview'); params.set('dir','desc') }
        if(filters.sort === 'ending') { params.set('sort','expireAt'); params.set('dir','asc') }

        if(!API_BASE){ throw new Error('Missing NEXT_PUBLIC_API_BASE_URL') }
        const url = `${API_BASE}/jobs?${params.toString()}`
        const res = await fetch(url, { signal, cache: 'no-store' })
        if(!res.ok){
          const text = await res.text()
          throw new Error(`HTTP ${res.status}: ${text.slice(0,120)}...`)
        }
        const data: any = await safeJson(res)
        let list: any[] = []
        if(Array.isArray(data?.items)) list = data.items
        else if(Array.isArray(data)) list = data

        const mapped: Job[] = list.map((j:any)=> ({
          _id: j._id,
          title: j.title,
          description: j.description,
          tags: j.tags,
          payoutPerReview: j.payoutPerReview,
          maxListeners: j.maxListeners,
          assignments: j.assignments,
          status: j.status,
          expireAt: j.expireAt,
          link: j.link,
          payer: j.payerId ? { name: (j.payerId.name || 'Payer') } : undefined
        }))

        if(!active) return
        setJobs(mapped)
        setLoading(false)
      }catch(err){
        if(isAbort(err)) return
        console.error('Failed to load jobs', err)
        if(!active) return
        setError(String(err instanceof Error ? err.message : err))
        setJobs([])
        setLoading(false)
      }
    }

    load()
    return () => { active = false; controller.abort() }
  }, [filters])

  const headerCta = useMemo(()=>{
    if(role === 'payer') return (
      <button onClick={()=>setPostOpen(true)} className="btn-primary"><Plus size={16}/> Post a Job</button>
    )
    if(role === 'worker') return (
      <Link href="/worker/dashboard" className="btn-primary"><Briefcase size={16}/> View Your Jobs</Link>
    )
    return (
      <div className="flex gap-2">
        <Link href="/register" className="btn-ghost">Register</Link>
        <Link href="/login" className="btn-primary">Login</Link>
      </div>
    )
  },[role])

  return (
    <main className="min-h-[100dvh] text-[var(--text)]">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-24">
        {/* HERO */}
        <div className="pt-12 sm:pt-16 lg:pt-20 flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
              Marketplace
              <span className="block text-sm md:text-base font-normal opacity-80">Match artists with engaged listeners. Earn for thoughtful feedback.</span>
            </h1>
            {headerCta}
          </div>

          {/* Search + Quick filters */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 card-sheen p-3 sm:p-4 shadow-lg shadow-black/20">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70"/>
                <input className="input pl-9" placeholder="Search jobs, tags, genres, keywords…" value={filters.q} onChange={(e)=>setFilters(f=>({...f, q:e.target.value}))}/>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={()=>setShowFilters(true)}><Filter size={16}/> Filters</button>
                <select className="select w-[180px]" value={filters.sort} onChange={(e)=>setFilters(f=>({...f, sort:e.target.value as any}))}>
                  <option value="new">Newest</option>
                  <option value="payout">Highest payout</option>
                  <option value="ending">Ending soon</option>
                </select>
              </div>
            </div>
            {!!filters.tags.length || filters.payoutMin>0 || !filters.onlyOpen ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {filters.tags.map(t=> (
                  <span key={t} className="badge inline-flex items-center gap-1">{t}<button onClick={()=>setFilters(f=>({...f, tags:f.tags.filter(x=>x!==t)}))}><X size={12}/></button></span>
                ))}
                {filters.payoutMin>0 && <span className="badge">Payout ≥ ${filters.payoutMin}</span>}
                {!filters.onlyOpen && <span className="badge">Include closed</span>}
                <button className="ml-auto text-xs underline opacity-80 hover:opacity-100" onClick={()=>setFilters({ q:'', tags:[], sort:'new', payoutMin:0, onlyOpen:true })}>Reset</button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Results spanning full width */}
        {error && <div className="text-[#FFAF47] mt-4">Error loading jobs: {error}</div>}
        <div id="open-jobs" className="mt-8 flex flex-col gap-4">
          {loading ? Array.from({length:6}).map((_,i)=> (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/70 animate-pulse h-20"/>
          )) : jobs.length === 0 ? (
            <div className="text-center py-20 opacity-80">
              <p>No jobs match your filters.</p>
            </div>
          ) : 
          
          jobs.map(job => (
            <JobItem
              key={job._id}
              job={job}
              role={role}
              apiBase={API_BASE}     // same base you already use for other calls
              token={token}       // pass token for auth if available
              onAccepted={() => { /* optionally refetch */ }}
            />
          ))
          
          }
        </div>
      </section>

      {showFilters && (
        <MarketplaceFilters initial={filters} onClose={()=>setShowFilters(false)} onApply={(next)=>{ setFilters(next); setShowFilters(false) }}/> )}

      {postOpen && role==='payer' && (
        <PostJobModal onClose={()=>setPostOpen(false)} onSuccess={()=>{ setPostOpen(false) }} />
      )}
    </main>
  )
}
