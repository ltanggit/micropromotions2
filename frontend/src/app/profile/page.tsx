'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';

// Brand accent
const ACCENT = '#FFAF47';

// Uses your existing env var key
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');

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
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(API_BASE + '/users/me', { method: 'GET', headers });
        if (!res.ok) throw new Error('GET /users/me → ' + res.status);
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

      const res = await fetch(API_BASE + '/users/me', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('PATCH /users/me → ' + res.status);
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

  // helpers
  const initials = (me?.personal?.name || me?.account?.username || me?.personal?.email || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => (s && s[0] ? s[0].toUpperCase() : '?'))
    .join('');

  function RoleBadge({ r }: { r: 'payer' | 'worker' }) {
    const label = r === 'payer' ? 'Artist' : 'Listener';
    const color = r === 'payer' ? 'from-amber-400/20 to-amber-500/10' : 'from-indigo-400/20 to-indigo-500/10';
    return (
      <span className={'rounded-full border border-white/10 bg-gradient-to-br ' + color + ' px-3 py-1 text-xs text-white/90'}>
        {label}
      </span>
    );
  }

  function Stat({ label, value, hint }: { label: string; value: string | number | undefined; hint?: string }) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,.04)]">
        <div className="text-[11px] uppercase tracking-wide text-white/50">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value ?? '—'}</div>
        {hint && <div className="text-xs text-white/40">{hint}</div>}
      </div>
    );
  }

  function StarRating({ value = 0 }: { value?: number }) {
    const clamped = Math.max(0, Math.min(5, value));
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} viewBox="0 0 24 24" className={'h-4 w-4 ' + (i < clamped ? '' : 'opacity-30')} fill={ACCENT}>
            <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.402 8.168L12 18.896l-7.336 3.868 1.402-8.168L.132 9.21l8.2-1.192z" />
          </svg>
        ))}
        <span className="ml-1 text-xs text-white/60">{clamped.toFixed(1)}</span>
      </div>
    );
  }

  function Chip({ children }: { children: any }) {
    return <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80">{children}</span>;
  }

  // states
  if (loading && !me) {
    return (
      <div className="relative mx-auto max-w-6xl px-4 py-16">
        <Backdrop />
        <div className="animate-pulse space-y-6">
          <div className="h-24 w-1/2 rounded-2xl bg-white/5" />
          <div className="h-40 w-full rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (err && !me) {
    return (
      <div className="relative mx-auto max-w-2xl px-4 py-16 text-center">
        <Backdrop />
        <div
          className="mx-auto inline-block rounded-xl border border-[rgba(255,175,71,.35)] bg-[rgba(255,175,71,.1)] px-4 py-2 text-sm"
          style={{ color: ACCENT }}
        >
          {err}
        </div>
      </div>
    );
  }

  if (!me) return null;

  const isArtist = me.roles.includes('payer');
  const isListener = me.roles.includes('worker');

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-12">
      <Backdrop />

      {/* HERO */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1A1A1A] to-[#0E0E0F] p-6">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full"
          style={{ background: 'radial-gradient(closest-side, ' + ACCENT + '33, transparent)' }}
        />
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {me.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold">{initials}</span>
            )}
            <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />
          </div>

          {/* Title block */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-3xl font-semibold tracking-tight">
                {me.personal?.name || me.payer?.displayName || me.account?.username || 'Your Profile'}
              </h1>
              {isArtist && <RoleBadge r="payer" />}
              {isListener && <RoleBadge r="worker" />}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/60">
              <span>{'@' + (me.account?.username || 'username')}</span>
              <span className="opacity-40">•</span>
              <span>{me.personal?.email}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {me.socials?.website && (
                <a
                  className="underline hover:opacity-90"
                  style={{ textDecorationColor: ACCENT }}
                  href={normalizeUrl(me.socials.website)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Website
                </a>
              )}
              {me.socials?.instagram && (
                <a
                  className="underline hover:opacity-90"
                  style={{ textDecorationColor: ACCENT }}
                  href={normalizeUrl(me.socials.instagram)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditing(false)} className="rounded-xl border px-3 py-2 text-sm">
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:opacity-90"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Logged-in banner */}
        <div className="mt-4 text-xs" style={{ color: ACCENT }}>
          {'Logged in as ' + (authUser?.email || '')}
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* About */}
        <div className="md:col-span-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-2 text-lg font-medium">About</h2>
            {!isEditing ? (
              <div className="space-y-4 text-sm">
                <p className="whitespace-pre-wrap text-white/80">
                  {me.personal?.bio || me.payer?.bio || 'Tell the community who you are, your sound, and what you love to review.'}
                </p>

                {isArtist && (
                  <div>
                    <div className="mb-1 text-xs uppercase text-white/50">Genres</div>
                    <div className="flex flex-wrap gap-2">
                      {(me.payer?.genres?.length ? me.payer.genres : ['Pop', 'Indie', 'Electronic']).map((g) => (
                        <Chip key={g}>{g}</Chip>
                      ))}
                    </div>
                  </div>
                )}

                {isListener && (
                  <div>
                    <div className="mb-1 text-xs uppercase text-white/50">Preferred Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {(me.worker?.preferredTags || []).length === 0 ? (
                        <span className="text-xs text-white/50">No tags yet</span>
                      ) : (
                        me.worker!.preferredTags!.map((t) => <Chip key={t}>{t}</Chip>)
                      )}
                    </div>
                  </div>
                )}

                <div className="grid gap-2 text-white/70">
                  {me.socials?.website && (
                    <a
                      href={normalizeUrl(me.socials.website)}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm underline opacity-90 hover:opacity-100"
                    >
                      {normalizeUrl(me.socials.website)}
                    </a>
                  )}
                  {me.socials?.instagram && (
                    <a
                      href={normalizeUrl(me.socials.instagram)}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm underline opacity-90 hover:opacity-100"
                    >
                      {normalizeUrl(me.socials.instagram)}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Field label="Username">
                  <input
                    className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </Field>
                <Field label="Name">
                  <input
                    className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="Bio">
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Website">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                    />
                  </Field>
                  <Field label="Instagram">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                      value={form.instagram}
                      onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Stats */}
        <div className="grid content-start gap-4">
          {isArtist && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-sm text-white/70">Artist Rating</div>
              <StarRating value={me.payer?.rating || 0} />
            </div>
          )}
          {isListener && (
            <>
              <Stat label="Reviews Completed" value={me.worker?.reviewsCount || 0} />
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-sm text-white/70">Listener Rating</div>
                <StarRating value={me.worker?.rating || 0} />
              </div>
            </>
          )}
        </div>
      </div>

      {err && (
        <div className="mt-6">
          <div
            className="rounded-xl border border-[rgba(255,175,71,.35)] bg-[rgba(255,175,71,.1)] px-4 py-2 text-sm"
            style={{ color: ACCENT }}
          >
            {err}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wide text-white/50">{label}</span>
      {children}
    </label>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-32 -left-40 h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(closest-side, ' + ACCENT + '22, transparent)' }}
      />
      <div
        className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(closest-side, #7c3aed22, transparent)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }}
      />
    </div>
  );
}

function normalizeUrl(url?: string) {
  if (!url) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.toString();
  } catch {
    return url as string;
  }
}
