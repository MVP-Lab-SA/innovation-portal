'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Plus, Trash2, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LookupsPage() {
  const [lookups, setLookups] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newValue, setNewValue] = useState('');
  const [adding, setAdding] = useState(false);
  
  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/lookups');
    const data = await res.json();
    setLookups(data);
    setLoading(false);
  };
  
  useEffect(() => { load(); }, []);
  
  const handleAdd = async () => {
    if (!selectedCategory || !newValue.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/entities/lookups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          value: newValue.trim(),
          displayOrder: (lookups[selectedCategory] || []).length,
          active: true,
        }),
      });
      if (!res.ok) throw new Error('فشل الإضافة');
      toast.success('تمت الإضافة');
      setNewValue('');
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  };
  
  if (loading) {
    return (
      <AppShell title="القوائم المرجعية">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-ministry-green" />
        </div>
      </AppShell>
    );
  }
  
  const categories = Object.keys(lookups).sort();
  
  return (
    <AppShell title="القوائم المرجعية" subtitle="إدارة القيم المتاحة في القوائم المنسدلة">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-4">
          <div className="card sticky top-24">
            <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-ministry-green" />
              <span>الفئات ({categories.length})</span>
            </h3>
            <div className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto">
              {categories.map(cat => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                      active 
                        ? 'bg-ministry-green text-white shadow-soft' 
                        : 'hover:bg-ministry-green-soft text-text-secondary'
                    }`}
                  >
                    <span className="font-medium">{cat}</span>
                    <span className={`text-xs ${active ? 'text-white/80' : 'text-text-muted'}`}>
                      {lookups[cat].length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Values Panel */}
        <div className="lg:col-span-8">
          {selectedCategory ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-text-primary">{selectedCategory}</h3>
                  <p className="text-sm text-text-secondary">{lookups[selectedCategory].length} قيمة</p>
                </div>
              </div>
              
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="أضف قيمة جديدة..."
                  className="input-base flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button onClick={handleAdd} disabled={adding || !newValue.trim()} className="btn-primary flex items-center gap-2">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>إضافة</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {lookups[selectedCategory].map((value, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background-alt border border-border hover:border-ministry-green/30 transition-all">
                    <span className="text-sm font-medium text-text-primary">{value}</span>
                    <span className="text-xs text-text-muted">#{idx + 1}</span>
                  </div>
                ))}
              </div>
              
              {lookups[selectedCategory].length === 0 && (
                <div className="text-center py-12 text-text-muted">
                  <p className="text-sm">لا توجد قيم بعد. أضف القيم أعلاه.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-20 text-text-muted">
              <Settings className="w-16 h-16 opacity-30 mb-4" />
              <p className="text-base font-medium">اختر فئة من القائمة الجانبية</p>
              <p className="text-sm mt-1">لعرض وإدارة قيمها</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
