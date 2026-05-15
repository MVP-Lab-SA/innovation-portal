'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { useEntities } from '@/hooks/useData';
import { toast } from 'sonner';
import { ShieldCheck, User, Eye, Loader2 } from 'lucide-react';

export default function UsersPage() {
  const { data: users, loading, refresh } = useEntities<any>('users', { pageSize: 100 });
  const [updating, setUpdating] = useState<string | null>(null);
  
  const updateRole = async (userId: string, newRole: 'ADMIN' | 'EDITOR' | 'VIEWER') => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/entities/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('فشل التحديث');
      toast.success('تم تحديث الدور');
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(null);
    }
  };
  
  const toggleActive = async (user: any) => {
    setUpdating(user.id);
    try {
      const res = await fetch(`/api/entities/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      });
      if (!res.ok) throw new Error('فشل التحديث');
      toast.success(user.active ? 'تم التعطيل' : 'تم التفعيل');
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(null);
    }
  };
  
  return (
    <AppShell
      title="إدارة المستخدمين"
      subtitle="التحكم في الأدوار والصلاحيات"
      showRefresh
      onRefresh={refresh}
    >
      <DataTable
        data={users}
        title={`المستخدمون (${users.length})`}
        columns={[
          { key: 'name', label: 'الاسم' },
          { key: 'email', label: 'البريد الإلكتروني' },
          { 
            key: 'role', 
            label: 'الدور',
            render: (v, row) => {
              const isUpdating = updating === row.id;
              return (
                <select
                  value={v || 'VIEWER'}
                  onChange={(e) => updateRole(row.id, e.target.value as any)}
                  disabled={isUpdating}
                  className="input-base text-xs py-1 px-2 w-32"
                >
                  <option value="ADMIN">مسؤول</option>
                  <option value="EDITOR">محرر</option>
                  <option value="VIEWER">مشاهد</option>
                </select>
              );
            }
          },
          {
            key: 'active',
            label: 'الحالة',
            render: (v, row) => {
              const isUpdating = updating === row.id;
              return (
                <button
                  onClick={() => toggleActive(row)}
                  disabled={isUpdating}
                  className={`badge ${v ? 'badge-success' : 'badge-danger'} cursor-pointer hover:opacity-80`}
                >
                  {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : (v ? 'نشط' : 'معطّل')}
                </button>
              );
            }
          },
          { key: 'lastLoginAt', label: 'آخر دخول', type: 'date' },
          { key: 'createdAt', label: 'الإنشاء', type: 'date' },
        ]}
        emptyMessage="لا يوجد مستخدمون. سيتم إضافتهم تلقائياً عند أول تسجيل دخول."
      />
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card border-2 border-ministry-green/20">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-ministry-green" />
            <h4 className="font-bold text-text-primary">مسؤول (Admin)</h4>
          </div>
          <p className="text-sm text-text-secondary">
            صلاحيات كاملة. يمكنه الإضافة والتعديل والحذف وإدارة المستخدمين.
          </p>
        </div>
        <div className="card border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-6 h-6 text-blue-600" />
            <h4 className="font-bold text-text-primary">محرر (Editor)</h4>
          </div>
          <p className="text-sm text-text-secondary">
            يمكنه الإضافة والتعديل لكن لا يستطيع الحذف أو إدارة المستخدمين.
          </p>
        </div>
        <div className="card border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-6 h-6 text-gray-600" />
            <h4 className="font-bold text-text-primary">مشاهد (Viewer)</h4>
          </div>
          <p className="text-sm text-text-secondary">
            يستطيع عرض اللوحات والبيانات فقط دون أي تعديل.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
