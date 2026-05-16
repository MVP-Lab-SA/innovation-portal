'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Upload, X, Download, Loader2 } from 'lucide-react';
import type { FieldConfig } from '@/components/forms/EntityForm';

interface CsvImportProps {
  entity: string;
  fields: FieldConfig[];
  onDone: () => void;
}

/**
 * Bulk-create records from a CSV/XLSX file. Column headers must match the
 * entity's field keys (the template download produces a correct header row).
 * Each row is POSTed through the normal /api/entities endpoint, so RBAC and
 * Zod validation still apply.
 */
export function CsvImport({ entity, fields, onDone }: CsvImportProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const keys = fields.map(f => f.key);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([keys]);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entity}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (rows.length === 0) {
        toast.error('الملف فارغ');
        return;
      }
      // Keep only known field keys; drop blank cells.
      const cleaned = rows.map(r => {
        const o: Record<string, unknown> = {};
        for (const k of keys) {
          const v = r[k];
          if (v !== undefined && v !== '') o[k] = v;
        }
        return o;
      });
      const results = await Promise.allSettled(
        cleaned.map(row =>
          fetch(`/api/entities/${entity}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(row),
          }).then(res => { if (!res.ok) throw new Error(); }),
        ),
      );
      const ok = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - ok;
      if (ok) toast.success(`تم استيراد ${ok} سجل`);
      if (failed) toast.error(`فشل استيراد ${failed} سجل — تحقّق من تطابق الأعمدة`);
      onDone();
      setOpen(false);
    } catch {
      toast.error('تعذّرت قراءة الملف');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm flex items-center gap-2">
        <Upload className="w-4 h-4" />
        <span>استيراد CSV</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-strong w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-base font-bold text-text-primary">استيراد سجلات من ملف</h2>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-background-alt">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-text-secondary">
                يجب أن تطابق رؤوس الأعمدة في الملف مفاتيح الحقول التالية:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {keys.map(k => <span key={k} className="badge badge-neutral text-xs">{k}</span>)}
              </div>
              <button onClick={downloadTemplate} className="btn-secondary text-xs flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span>تنزيل قالب CSV</span>
              </button>
              <label className={`btn-primary inline-flex items-center gap-2 cursor-pointer text-sm w-full justify-center ${busy ? 'opacity-60 pointer-events-none' : ''}`}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{busy ? 'جارٍ الاستيراد...' : 'اختر ملف CSV / Excel'}</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  disabled={busy}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
