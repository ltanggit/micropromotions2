'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [asWorker, setAsWorker] = useState(true);
  const [asPayer, setAsPayer] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const roles = [];
      if (asWorker) roles.push('worker');
      if (asPayer) roles.push('payer');
      const data = await api<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: { email, password, roles }
      });
      login(data.token, data.user);
      router.push('/jobs');
    } catch (e:any) {
      setErr(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={asWorker} onChange={e=>setAsWorker(e.target.checked)} />
          Worker
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={asPayer} onChange={e=>setAsPayer(e.target.checked)} />
          Payer
        </label>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="px-4 py-2 rounded bg-black text-white">Register</button>
      </form>
    </div>
  );
}