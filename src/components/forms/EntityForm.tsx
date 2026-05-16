'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Upload, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';

export interface FieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'email' | 'tel' | 'url' | 'select' | 'currency' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: string[]; // for select
  lookupCategory?: string;
  helperText?: string;
  cols?: 1 | 2; // grid columns
}

interface EntityFormProps {
  title: string;
  fields: FieldConfig[];
  initial?: Record<string, any>;
  entity: string; // e.g. "ideas"
  isEdit?: boolean;
  onSuccess?: () => void;
  onClose: () => void;
}

export function EntityForm({ title, fields, initial = {}, entity, isEdit, onSuccess, onClose }: EntityFormProps) {
  const [values, setValues] = useState<Record<string, any>>(initial);
  const [saving, setSaving] = useState(false);
  const [lookups, setLookups] = useState<Record<string, string[]>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const uploadFile = async (key: string, file: File) => {
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error === 'unsupported_content_type' ? 'نوع الملف غير مدعوم' : 'فشل رفع الملف');
      }
      const data = await res.json();
      setValues(v => ({ ...v, [key]: data.url }));
      toast.success('تم رفع الملف');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل رفع الملف');
    } finally {
      setUploading(null);
    }
  };
  
  // Load lookups for select fields
  useEffect(() => {
    const lookupFields = fields.filter(f => f.lookupCategory);
    if (lookupFields.length === 0) return;
    
    Promise.all(lookupFields.map(async f => {
      const res = await fetch(`/api/lookups?category=${encodeURIComponent(f.lookupCategory!)}`);
      const data = await res.json();
      return { category: f.lookupCategory!, values: data.values || [] };
    })).then(results => {
      const map: Record<string, string[]> = {};
      results.forEach(r => { map[r.category] = r.values; });
      setLookups(map);
    });
  }, [JSON.stringify(fields)]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    for (const f of fields) {
      if (f.required && !values[f.key]) {
        toast.error(`الحقل "${f.label}" مطلوب`);
        return;
      }
    }
    
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/entities/${entity}/${initial.id}`
        : `/api/entities/${entity}`;
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل الحفظ');
      }
      
      toast.success(isEdit ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };
  
  const renderField = (f: FieldConfig) => {
    const v = values[f.key] ?? '';
    const set = (val: any) => setValues({ ...values, [f.key]: val });
    
    const options = f.lookupCategory ? (lookups[f.lookupCategory] || []) : (f.options || []);
    
    if (f.type === 'textarea') {
      return (
        <textarea value={v} onChange={e => set(e.target.value)} placeholder={f.placeholder}
          rows={3} className="input-base resize-y min-h-20" />
      );
    }
    
    if (f.type === 'select' || f.lookupCategory) {
      // Keep the current value selectable even when it's outside the lookup
      // set (e.g. values imported from external spreadsheets).
      const selectOptions = v && !options.includes(v) ? [v, ...options] : options;
      return (
        <select value={v} onChange={e => set(e.target.value)} className="input-base">
          <option value="">-- اختر --</option>
          {selectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    
    if (f.type === 'date' || f.type === 'datetime') {
      const dateValue = v ? new Date(v).toISOString().split('T')[0] : '';
      return <input type="date" value={dateValue} onChange={e => set(e.target.value)} className="input-base" />;
    }

    if (f.type === 'file') {
      const isUploading = uploading === f.key;
      return (
        <div className="space-y-2">
          <label className={`btn-secondary inline-flex items-center gap-2 cursor-pointer text-sm ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{isUploading ? 'جارٍ الرفع...' : 'رفع ملف'}</span>
            <input
              type="file"
              className="hidden"
              disabled={isUploading}
              onChange={e => { const file = e.target.files?.[0]; if (file) uploadFile(f.key, file); }}
            />
          </label>
          {v && (
            <a href={v} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-ministry-green-deep hover:underline">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span className="truncate">الملف المرفوع</span>
            </a>
          )}
        </div>
      );
    }
    
    return (
      <input
        type={f.type || 'text'}
        value={v}
        onChange={e => set(f.type === 'number' || f.type === 'currency' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
        placeholder={f.placeholder}
        className="input-base"
      />
    );
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-xl shadow-strong w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-background-alt">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key} className={f.cols === 2 || f.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="label-base">
                  {f.label}
                  {f.required && <span className="text-red-500 mr-1">*</span>}
                </label>
                {renderField(f)}
                {f.helperText && <p className="mt-1 text-xs text-text-muted">{f.helperText}</p>}
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-border flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">إلغاء</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEdit ? 'حفظ التعديلات' : 'إضافة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
