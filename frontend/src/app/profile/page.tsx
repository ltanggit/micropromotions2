// frontend/src/app/profile/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE|| '').replace(/\/$/, '')

type User = {
  _id: string;
  account?: { username?: string };
  personal?: { email: string; name?: string; bio?: string };
  socials?: { website?: string; instagram?: string };
  payer?: { displayName?: string; artistName?: string; genres?: string[]; bio?: string; rating?: number };
  worker?: { displayName?: string; preferredTags?: string[]; reviewsCount?: number; rating?: number };
  avatarUrl?: string;
  roles: string[];
};

export default function ProfilePage() {
  const { token, user: authUser } = useAuth();
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<any>({});

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
        setMe(meData);
        setForm({
          username: meData.account?.username || '',
          name: meData.personal?.name || '',
          bio: meData.personal?.bio || meData.payer?.bio || '',
          website: meData.socials?.website || '',
          instagram: meData.socials?.instagram || '',
        });
        setErr(null);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, headers]);

  async function saveProfile() {
    try {
      setLoading(true);
      const updates: Record<string, string> = {};
      if (form.username) updates['account.username'] = form.username;
      if (form.name) updates['personal.name'] = form.name;
      if (form.bio) updates['personal.bio'] = form.bio;
      if (form.website) updates['socials.website'] = form.website;
      if (form.instagram) updates['socials.instagram'] = form.instagram;

      const res = await fetch(`${API_BASE}/users/me`, { method: 'PATCH', headers, body: JSON.stringify(updates), });
      if (!res.ok) throw new Error(`PATCH /users/me → ${res.status}`);
      const data = await res.json();
      setMe(data.user || data);
      setIsEditing(false);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  }

  if (loading && !me) return <p className="p-6">Loading…</p>;
  if (err && !me) return <p className="p-6 text-[#FFAF47]">{err}</p>;
  if (!me) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Profile</h1>
      <div className="mb-6 text-sm text-[#FFAF47]">Logged in as {authUser?.email}</div>
      {!isEditing ? (
        <div className="space-y-3">
          <p><strong>Username:</strong> {me.account?.username}</p>
          <p><strong>Name:</strong> {me.personal?.name}</p>
          <p><strong>Email:</strong> {me.personal?.email}</p>
          <p><strong>Bio:</strong> {me.personal?.bio || me.payer?.bio}</p>
          {me.roles.includes('payer') && (
            <>
              <p><strong>Payer Display Name:</strong> {me.payer?.displayName}</p>
              <p><strong>Genres:</strong> {(me.payer?.genres || []).join(', ')}</p>
              <p><strong>Payer Rating:</strong> {me.payer?.rating}</p>
            </>
          )}
          {me.roles.includes('worker') && (
            <>
              <p><strong>Worker Display Name:</strong> {me.worker?.displayName}</p>
              <p><strong>Preferred Tags:</strong> {(me.worker?.preferredTags || []).join(', ')}</p>
              <p><strong>Reviews Completed:</strong> {me.worker?.reviewsCount}</p>
              <p><strong>Worker Rating:</strong> {me.worker?.rating}</p>
            </>
          )}
          <p><strong>Website:</strong> {me.socials?.website}</p>
          <p><strong>Instagram:</strong> {me.socials?.instagram}</p>
          <button onClick={() => setIsEditing(true)} className="rounded-xl border px-3 py-2 text-sm">Edit</button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block">
            Username
            <input className="w-full rounded border px-2 py-1" value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})}/>
          </label>
          <label className="block">
            Name
            <input className="w-full rounded border px-2 py-1" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/>
          </label>
          <label className="block">
            Bio
            <textarea className="w-full rounded border px-2 py-1" value={form.bio} onChange={(e)=>setForm({...form,bio:e.target.value})}/>
          </label>
          <label className="block">
            Website
            <input className="w-full rounded border px-2 py-1" value={form.website} onChange={(e)=>setForm({...form,website:e.target.value})}/>
          </label>
          <label className="block">
            Instagram
            <input className="w-full rounded border px-2 py-1" value={form.instagram} onChange={(e)=>setForm({...form,instagram:e.target.value})}/>
          </label>
          <div className="flex gap-2">
            <button onClick={()=>setIsEditing(false)} className="rounded-xl border px-3 py-2 text-sm">Cancel</button>
            <button onClick={saveProfile} className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black">Save</button>
          </div>
        </div>
      )}
      {err && <p className="mt-4 text-[#FFAF47]">{err}</p>}
    </div>
  );
}
