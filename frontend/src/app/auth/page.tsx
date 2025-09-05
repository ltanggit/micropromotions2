'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login: setAuth } = useAuth();

  // Derive initial mode from ?mode=, then localStorage, else 'login'
  const initialMode = useMemo<Mode>(() => {
    const m = params.get('mode');
    if (m === 'login' || m === 'register') return m;
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('auth:mode');
      if (saved === 'login' || saved === 'register') return saved;
    }
    return 'login';
  }, [params]);
  const [mode, setMode] = useState<Mode>(initialMode);

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Register-only fields
  const [asWorker, setAsWorker] = useState(true);
  const [asPayer, setAsPayer] = useState(true);

  // Optional: redirect after success (e.g., /dashboard)
  const redirect = params.get('redirect') || '/dashboard';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('auth:mode', mode);
    }
  }, [mode]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const data = await api<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setAuth(data.token, data.user);
      router.push(redirect);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const roles: string[] = [];
      if (asWorker) roles.push('worker');
      if (asPayer) roles.push('payer');

      const data = await api<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: { email, password, roles },
      });
      setAuth(data.token, data.user);
      router.push(redirect);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      {/* Tabs */}
      <div className="mb-6 flex w-full rounded-full bg-gray-100 p-1">
        <button
          onClick={() => setMode('login')}
          className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
            mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
          aria-pressed={mode === 'login'}
        >
          Log In
        </button>
        <button
          onClick={() => setMode('register')}
          className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
            mode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
          aria-pressed={mode === 'register'}
        >
          Create Account
        </button>
      </div>

      {/* Panel */}
      <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold">
          {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
        </h1>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          <input
            className="w-full rounded border p-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <div className="relative">
            <input
              className="w-full rounded border p-2 pr-20"
              placeholder="Password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs underline"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>

          {mode === 'register' && (
            <div className="grid gap-2 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={asWorker}
                  onChange={(e) => setAsWorker(e.target.checked)}
                />
                Register as Worker
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={asPayer}
                  onChange={(e) => setAsPayer(e.target.checked)}
                />
                Register as Payer
              </label>
              <p className="text-xs text-gray-500">
                You can switch roles later in the unified dashboard.
              </p>
            </div>
          )}

          {err && <p className="text-[#FFAF47] text-sm">{err}</p>}

          <button
            disabled={loading}
            className="w-full rounded bg-black px-4 py-2 text-white"
          >
            {loading
              ? mode === 'login' ? 'Logging in…' : 'Creating account…'
              : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => setMode('register')}
              className="underline"
            >
              No account? Create one
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="underline"
            >
              Already have an account? Log in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}