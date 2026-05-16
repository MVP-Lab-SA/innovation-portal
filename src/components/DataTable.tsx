'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, Download, ChevronUp, ChevronDown, Inbox, Plus, Edit, Trash2, X } from 'lucide-react';
import { cn, getStatusVariant, formatDate, formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';

export interface Column {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
  type?: 'text' | 'status' | 'number' | 'date' | 'currency' | 'badge';
}

interface DataTableProps {
  data: Record<string, any>[];
  columns: Column[];
  searchable?: boolean;
  exportable?: boolean;
  title?: string;
  emptyMessage?: string;
  pageSize?: number;
  onAdd?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  /** When set, a checkbox column + bulk-delete bar appear (admin/editor). */
  onBulkDelete?: (rows: any[]) => void | Promise<void>;
  canEdit?: boolean;
  canDelete?: boolean;
  /** When set, the first column links to /records/{entitySlug}/{row.id}. */
  entitySlug?: string;
}

export function DataTable({
  data, columns, searchable = true, exportable = true, title,
  emptyMessage = 'لا توجد بيانات', pageSize = 10,
  onAdd, onEdit, onDelete, onBulkDelete, canEdit, canDelete, entitySlug,
}: DataTableProps) {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(p => p?.role && setRole(p.role)).catch(() => {});
  }, []);
  const userCanEdit = canEdit ?? (role === 'ADMIN' || role === 'EDITOR');
  const userCanDelete = canDelete ?? (role === 'ADMIN');
  
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  
  const filtered = useMemo(() => {
    let result = data;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(row => columns.some(col => String(row[col.key] || '').toLowerCase().includes(s)));
    }
    if (sortBy) {
      result = [...result].sort((a, b) => {
        const av = a[sortBy]; const bv = b[sortBy];
        if (av === bv) return 0;
        const cmp = av > bv ? 1 : -1;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, sortBy, sortDir, columns]);
  
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  
  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
  };
  
  const exportRows = () =>
    filtered.map(row => {
      const obj: Record<string, any> = {};
      columns.forEach(col => { obj[col.label] = row[col.key] ?? ''; });
      return obj;
    });
  const exportFileBase = `${title || 'export'}-${new Date().toISOString().split('T')[0]}`;

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title || 'البيانات');
    XLSX.writeFile(wb, `${exportFileBase}.xlsx`);
  };

  const handleExportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const csv = XLSX.utils.sheet_to_csv(ws);
    // Prepend a UTF-8 BOM so Excel renders Arabic correctly.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFileBase}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const renderCell = (col: Column, row: any) => {
    if (col.render) return col.render(row[col.key], row);
    const value = row[col.key];
    if (value === null || value === undefined || value === '') return <span className="text-text-muted">—</span>;
    
    if (col.type === 'status') {
      const variant = getStatusVariant(String(value));
      return <span className={`badge badge-${variant}`}>{value}</span>;
    }
    if (col.type === 'badge') return <span className="badge badge-info">{value}</span>;
    if (col.type === 'date') return <span>{formatDate(value)}</span>;
    if (col.type === 'currency') return <span className="tabular-nums">{formatCurrency(value)}</span>;
    if (col.type === 'number') return <span className="tabular-nums">{value}</span>;
    return <span className="text-text-primary">{String(value)}</span>;
  };
  
  const showActions = !!(onEdit || onDelete);
  const showSelect = !!onBulkDelete && userCanDelete;

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const pageIds = paginated.map(r => String(r.id)).filter(Boolean);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const toggleAllOnPage = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach(id => next.delete(id));
      else pageIds.forEach(id => next.add(id));
      return next;
    });
  };
  const handleBulkDelete = async () => {
    if (!onBulkDelete || selected.size === 0) return;
    const rows = data.filter(r => selected.has(String(r.id)));
    setBulkBusy(true);
    try {
      await onBulkDelete(rows);
      setSelected(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="card">
      {(title || searchable || exportable || onAdd) && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {title && <h3 className="text-base font-bold text-text-primary">{title}</h3>}
          <div className="flex items-center gap-2 mr-auto">
            {searchable && (
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="بحث..." className="input-base pr-9 w-64" />
              </div>
            )}
            {exportable && filtered.length > 0 && (
              <>
                <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2 text-sm" title="تصدير Excel">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Excel</span>
                </button>
                <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2 text-sm" title="تصدير CSV">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </>
            )}
            {onAdd && userCanEdit && (
              <button onClick={onAdd} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                <span>إضافة</span>
              </button>
            )}
          </div>
        </div>
      )}
      
      {showSelect && selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-lg bg-ministry-green-soft border border-ministry-green/20">
          <span className="text-sm font-medium text-ministry-green-deep">{selected.size} عنصر محدد</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected(new Set())} className="btn-secondary text-xs flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" />
              <span>إلغاء التحديد</span>
            </button>
            <button onClick={handleBulkDelete} disabled={bulkBusy}
              className="btn-secondary text-xs flex items-center gap-1.5 text-red-600 disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف المحدد</span>
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-text-muted">
          <Inbox className="w-16 h-16 opacity-20 mb-3" />
          <p className="text-sm font-medium">{emptyMessage}</p>
          {search && <p className="text-xs mt-1">جرّب البحث بكلمات أخرى</p>}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="data-table">
              <thead>
                <tr>
                  {showSelect && (
                    <th className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleAllOnPage}
                        aria-label="تحديد الكل"
                      />
                    </th>
                  )}
                  {columns.map(col => (
                    <th key={col.key} style={{ width: col.width }}
                      className="cursor-pointer hover:bg-ministry-green/10 transition-colors select-none"
                      onClick={() => handleSort(col.key)}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{col.label}</span>
                        {sortBy === col.key && (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                      </div>
                    </th>
                  ))}
                  {showActions && <th className="w-24 text-center">إجراءات</th>}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, idx) => (
                  <tr key={row.id || idx}>
                    {showSelect && (
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(String(row.id))}
                          onChange={() => toggleRow(String(row.id))}
                          aria-label="تحديد الصف"
                        />
                      </td>
                    )}
                    {columns.map((col, colIdx) => {
                      const linkable = entitySlug && colIdx === 0 && row.id;
                      return (
                        <td key={col.key}>
                          {linkable ? (
                            <Link
                              href={`/records/${entitySlug}/${row.id}`}
                              className="text-ministry-green-deep hover:underline font-medium"
                            >
                              {renderCell(col, row)}
                            </Link>
                          ) : (
                            renderCell(col, row)
                          )}
                        </td>
                      );
                    })}
                    {showActions && (
                      <td>
                        <div className="flex items-center gap-1 justify-center">
                          {onEdit && userCanEdit && (
                            <button onClick={() => onEdit(row)} className="p-1.5 rounded hover:bg-ministry-green-soft text-ministry-green-deep transition-colors" title="تعديل">
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && userCanDelete && (
                            <button onClick={() => onDelete(row)} className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors" title="حذف">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="text-xs text-text-muted">
                عرض {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} من {filtered.length}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">السابق</button>
                <span className="px-3 text-sm text-text-secondary">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">التالي</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
