// src/app/dashboard/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Lazy load to keep bundle lean and reuse your existing components
const WorkerDashboard = dynamic(() => import('@/app/worker/dashboard/page'), { ssr: false });
const PayerDashboard  = dynamic(() => import('@/app/payer/dashboard/page'),  { ssr: false });

type View = 'worker' | 'payer';

export default function UnifiedDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  // ---- Role helpers (flexible to common shapes) ----
  const roles: string[] = useMemo(() => {
    const r =
      (user as any)?.roles ??
      (user as any)?.account?.roles ??
      ((user as any)?.role ? [(user as any)?.role] : []);
    return Array.isArray(r) ? r.map((x) => String(x).toLowerCase()) : [];
  }, [user]);

  const canWorker = roles.includes('worker');
  const canPayer  = roles.includes('payer');

  // ---- Derive initial view: URL > localStorage > first available role ----
  const qsView = (params.get('view') as View | null);
  const [view, setView] = useState<View>(() => {
    if (qsView === 'worker' || qsView === 'payer') return qsView;
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('dash:view') as View | null;
      if (saved === 'worker' || saved === 'payer') return saved;
    }
    if (canWorker) return 'worker';
    if (canPayer)  return 'payer';
    return 'worker'; // fallback
  });

  // Keep URL in sync when view changes
  useEffect(() => {
    const next = new URLSearchParams(params.toString());
    next.set('view', view);
    router.replace(`${pathname}?${next.toString()}`);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dash:view', view);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // If user only has one role, force that view
  useEffect(() => {
    if (canWorker && !canPayer && view !== 'worker') setView('worker');
    if (canPayer && !canWorker && view !== 'payer') setView('payer');
  }, [canWorker, canPayer, view]);

  // Guard: if no roles, show a gentle message
  if (!canWorker && !canPayer) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Your account doesn’t have Worker or Payer access yet. If you think this is a mistake, contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>

          {/* Toggle (hidden if only one role) */}
          {(canWorker && canPayer) && (
            // <div className="inline-flex rounded-2xl border border-gray-300 bg-white shadow-sm overflow-hidden">
            //   <button
            //     type="button"
            //     aria-pressed={view === 'worker'}
            //     onClick={() => setView('worker')}
            //     className={`px-5 py-2 text-sm transition ${
            //       view === 'worker'
            //         ? 'bg-black text-white'
            //         : 'bg-white text-gray-700 hover:bg-gray-100'
            //     }`}
            //   >
            //     Worker
            //   </button>
            //   <button
            //     type="button"
            //     aria-pressed={view === 'payer'}
            //     onClick={() => setView('payer')}
            //     className={`px-5 py-2 text-sm transition ${
            //       view === 'payer'
            //         ? 'bg-black text-white'
            //         : 'bg-white text-gray-700 hover:bg-gray-100'
            //     }`}
            //   >
            //     Payer
            //   </button>
            // </div>
          <div className="inline-flex rounded-full bg-gray-100 p-1">
            <button
                onClick={() => setView('worker')}
                className={`px-4 py-1.5 text-sm rounded-full transition ${
                view === 'worker' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
                Worker View
            </button>
            <button
                onClick={() => setView('payer')}
                className={`px-4 py-1.5 text-sm rounded-full transition ${
                view === 'payer' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
                Payer View
            </button>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          {view === 'worker' && canWorker && <WorkerDashboard />}
          {view === 'payer'  && canPayer  && <PayerDashboard  />}

          {/* If user navigates to a view they don't have access to */}
          {view === 'worker' && !canWorker && (
            <p className="text-sm text-gray-600">You don’t have Worker access on this account.</p>
          )}
          {view === 'payer' && !canPayer && (
            <p className="text-sm text-gray-600">You don’t have Payer access on this account.</p>
          )}
        </main>
      </div>
    </div>
  );
}