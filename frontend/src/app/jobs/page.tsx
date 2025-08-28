// // frontend/src/app/jobs/page.tsx
// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import Link from 'next/link';
// import { api } from '@/lib/api';
// import { useAuth } from '@/lib/auth';

// type Job = {
//   _id: string;
//   title: string;
//   description?: string;
//   tags?: string[];
//   status: 'open'|'full'|'closed'|'expired';
//   payoutPerReview?: number;
//   maxListeners: number;
//   ratingAvg?: number;
//   publishedAt?: string;
// };

// export default function JobsPage() {
//   const { token, user } = useAuth();
//   const [items, setItems] = useState<Job[]>([]);
//   const [q, setQ] = useState('');
//   const [tag, setTag] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState<string|null>(null);

//   const params = useMemo(() => {
//     const p = new URLSearchParams();
//     if (q) p.set('q', q);
//     if (tag) p.set('tag', tag);
//     p.set('status', 'open');
//     p.set('limit', '30');
//     return p.toString();
//   }, [q, tag]);

//   async function load() {
//     setLoading(true); setErr(null);
//     try {
//       const data = await api<{ items: Job[] }>(`/jobs?${params}`);
//       setItems(data.items);
//     } catch (e:any) {
//       setErr(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => { load(); }, [params]);

//   async function accept(jobId: string) {
//     if (!token) return alert('Please log in first.');
//     try {
//       await api(`/jobs/${jobId}/accept`, {
//         method: 'POST',
//         body: { dueMinutes: 60 },
//         token
//       });
//       alert('Accepted! Find it in your Worker Dashboard.');
//       load();
//     } catch (e:any) {
//       alert(e.message || 'Failed to accept job');
//     }
//   }

//   return (
//     <div className="max-w-5xl mx-auto p-6 space-y-6">
//       <header className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
//         <h1 className="text-2xl font-semibold">MARKETPLACE</h1>
//         <div className="flex gap-2">
//           <input
//             className="border rounded px-3 py-2"
//             placeholder="Search Title/Desc/Tags…"
//             value={q}
//             onChange={e=>setQ(e.target.value)}
//           />
//           <input
//             className="border rounded px-3 py-2"
//             placeholder="Tag(s) (e.g. pop)"
//             value={tag}
//             onChange={e=>setTag(e.target.value)}
//           />
//         </div>
//       </header>

//       {err && <p className="text-red-600">{err}</p>}
//       {loading && <p>Loading…</p>}

//       <ul className="grid gap-4">
//         {items.map(j => (
//           <li key={j._id} className="border rounded p-6 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50">
//             <div>
//               <h2 className="font-medium">{j.title}</h2>
//               <p className="text-sm text-gray-600">{j.description}</p>
//               <div className="text-xs text-gray-500 mt-1">
//                 <span>{j.tags?.join(' • ')}</span>
//                 {j.payoutPerReview ? <span className="ml-2">• ${j.payoutPerReview.toFixed(2)}/review</span> : null}
//               </div>
//             </div>
//             <div className="flex gap-2">
//               <Link href={`/jobs/${j._id}`} className="px-3 py-2 border rounded">
//                 View
//               </Link>
//               <button
//                 onClick={() => accept(j._id)}
//                 className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
//                 disabled={!token || j.status !== 'open'}
//                 title={!token ? 'Login required' : ''}
//               >
//                 Accept
//               </button>
//             </div>
//           </li>
//         ))}
//       </ul>

      // <footer className="text-sm text-gray-500">
      //   {user ? `Logged in as ${user?.email}` : 'Not logged in'}
      // </footer>
//     </div>
//   );
// }

'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Briefcase, Filter, Plus, Search, X } from 'lucide-react'
import JobCard, { Job } from '@/components/JobCard'
import MarketplaceFilters, { FilterState } from '@/components/MarketplaceFilters'
import { PostJobModal } from '@/components/PostJobModal'

// Backend base: http://localhost:5000 (no /api)
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '')

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

// --- Helper: determine role (worker | payer) ---
async function fetchRole(): Promise<'worker'|'payer'|'guest'> {
  if(!API_BASE){ return 'guest' }
  try{
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include', cache: 'no-store' })
    if(!res.ok) return 'guest'
    const data: any = await safeJson(res)
    return (data?.user?.role === 'payer' ? 'payer' : data?.user?.role === 'worker' ? 'worker' : 'guest')
  } catch{
    return 'guest'
  }
}

export default function MarketplacePage(){
  const [role, setRole] = useState<'worker'|'payer'|'guest'>('guest')
  const [filters, setFilters] = useState<FilterState>({ q:'', tags:[], sort:'new', payoutMin:0, onlyOpen:true })
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [postOpen, setPostOpen] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(()=>{ fetchRole().then(setRole) },[])

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
        if(filters.tags.length) params.set('tag', filters.tags[0]) // backend supports one tag filter
        if(filters.payoutMin) params.set('payoutMin', String(filters.payoutMin))
        if(filters.onlyOpen) params.set('status', 'open')
        if(filters.sort === 'new') { params.set('sort','publishedAt'); params.set('dir','desc') }
        if(filters.sort === 'payout') { params.set('sort','payoutPerReview'); params.set('dir','desc') }
        if(filters.sort === 'ending') { params.set('sort','expireAt'); params.set('dir','asc') }

        if(!API_BASE){ throw new Error('Missing NEXT_PUBLIC_API_BASE_URL (should be http://localhost:5000)') }
        const url = `${API_BASE}/jobs?${params.toString()}`
        const res = await fetch(url, { signal, cache: 'no-store' })
        if(!res.ok){
          const text = await res.text()
          throw new Error(`HTTP ${res.status}: ${text.slice(0,120)}...`)
        }
        const data: any = await safeJson(res)

        // backend returns { items, total, page, pages }
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
      <Link href="#open-jobs" className="btn-primary"><Briefcase size={16}/> Browse Jobs</Link>
    )
    return (
      <div className="flex gap-2">
        <Link href="/login" className="btn-primary">Sign in</Link>
        <Link href="/register" className="btn-ghost">Create account</Link>
      </div>
    )
  },[role])

  return (
    <main className="page-gradient min-h-[100dvh] text-[var(--text)]">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
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

        {/* Results */}
        {error && <div className="text-red-400 mt-4">Error loading jobs: {error}</div>}
        <div id="open-jobs" className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading ? Array.from({length:6}).map((_,i)=> (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/70 animate-pulse h-48"/>
          )) : jobs.length === 0 ? (
            <div className="col-span-full text-center py-20 opacity-80">
              <p>No jobs match your filters.</p>
            </div>
          ) : jobs.map(job => (
            <JobCard key={job._id} job={job} role={role}/>
          ))}
        </div>
      </section>

      {/* Drawers / Modals */}
      {showFilters && (
        <MarketplaceFilters initial={filters} onClose={()=>setShowFilters(false)} onApply={(next)=>{ setFilters(next); setShowFilters(false) }}/> )}

      {postOpen && role==='payer' && (
        <PostJobModal onClose={()=>setPostOpen(false)} onSuccess={()=>{ setPostOpen(false); /* optionally refetch */ }} />
      )}
    </main>
  )
}
