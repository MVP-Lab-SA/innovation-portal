'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { EntityForm } from '@/components/forms/EntityForm';
import { useEntities } from '@/hooks/useData';
import { ENTITY_CONFIGS } from '@/lib/entityConfigs';
import { Database, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDataPage() {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  
  const config = selectedEntity ? ENTITY_CONFIGS[selectedEntity] : null;
  const { data, loading, refresh, pagination } = useEntities<any>(selectedEntity || '', { pageSize: 50 });
  
  const handleDelete = async (row: any) => {
    if (!confirm(`هل أنت متأكد من حذف ${row.code || row.id}؟`)) return;
    try {
      const res = await fetch(`/api/entities/${selectedEntity}/${row.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل الحذف');
      toast.success('تم الحذف');
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  
  if (!selectedEntity) {
    return (
      <AppShell title="إدارة البيانات" subtitle="اختر جدولاً لإدارته">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(ENTITY_CONFIGS).map(cfg => (
            <button
              key={cfg.slug}
              onClick={() => setSelectedEntity(cfg.slug)}
              className="card card-hover text-right group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-xl bg-ministry-green-soft flex items-center justify-center mb-3 group-hover:bg-ministry-green group-hover:text-white transition-all">
                    <Database className="w-6 h-6 text-ministry-green group-hover:text-white" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary mb-1">{cfg.arabicName}</h3>
                  <p className="text-sm text-text-secondary">{cfg.description}</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-text-muted group-hover:text-ministry-green transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </AppShell>
    );
  }
  
  return (
    <AppShell
      title={`إدارة: ${config!.arabicName}`}
      subtitle={`${pagination.total} سجل`}
      showRefresh
      onRefresh={refresh}
      actions={
        <button onClick={() => setSelectedEntity(null)} className="btn-secondary text-sm flex items-center gap-2">
          <ArrowLeft className="w-4 h-4 rotate-180" />
          <span>كل الجداول</span>
        </button>
      }
    >
      <DataTable
        data={data}
        columns={config!.listColumns}
        onAdd={() => { setEditingRow(null); setShowForm(true); }}
        onEdit={(row) => { setEditingRow(row); setShowForm(true); }}
        onDelete={handleDelete}
        emptyMessage={`لا توجد سجلات في ${config!.arabicName}. اضغط "إضافة" لإنشاء سجل جديد.`}
      />
      
      {showForm && (
        <EntityForm
          title={editingRow ? `تعديل: ${editingRow.code || editingRow.id}` : `إضافة ${config!.arabicName}`}
          entity={selectedEntity}
          fields={config!.formFields}
          initial={editingRow || {}}
          isEdit={!!editingRow}
          onSuccess={refresh}
          onClose={() => { setShowForm(false); setEditingRow(null); }}
        />
      )}
    </AppShell>
  );
}
