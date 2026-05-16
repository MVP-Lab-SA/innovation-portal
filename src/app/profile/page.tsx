'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { User, ShieldCheck, Loader2, Save } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  active: boolean;
}

const ROLE_LABEL: Record<string, string> = { ADMIN: 'مسؤول', EDITOR: 'محرّر', VIEWER: 'مشاهد' };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const p: Profile = await res.json();
        setProfile(p);
        setName(p.name ?? '');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error('فشل الحفظ');
      const updated: Profile = await res.json();
      setProfile(updated);
      toast.success('تم تحديث الملف الشخصي');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="الملف الشخصي" subtitle="إدارة بياناتك">
      {loading ? (
        <div className="card flex items-center justify-center py-12 text-text-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : !profile ? (
        <div className="card text-sm text-text-muted">تعذّر تحميل الملف الشخصي.</div>
      ) : (
        <div className="max-w-xl">
          <div className="card mb-6 flex items-center gap-4">
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image} alt="" className="w-16 h-16 rounded-full border-2 border-ministry-green/20" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-ministry-green text-white flex items-center justify-center">
                <User className="w-7 h-7" />
              </div>
            )}
            <div>
              <div className="text-lg font-bold text-text-primary">{profile.name || profile.email}</div>
              <div className="text-sm text-text-secondary">{profile.email}</div>
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-ministry-green-deep font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>الدور: {ROLE_LABEL[profile.role] ?? profile.role}</span>
              </div>
            </div>
          </div>

          <form onSubmit={save} className="card">
            <h3 className="text-base font-bold text-text-primary mb-4">تعديل البيانات</h3>
            <div className="space-y-4">
              <div>
                <label className="label-base">الاسم</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-base"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="label-base">البريد الإلكتروني</label>
                <input type="email" value={profile.email} disabled className="input-base opacity-60" />
                <p className="mt-1 text-xs text-text-muted">البريد الإلكتروني والدور يُداران بواسطة المسؤول.</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-border flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>حفظ</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
