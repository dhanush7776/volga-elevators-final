'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { ModuleConfig } from '@/lib/modules';
import FormModal from '@/components/crud/FormModal';
import ExportMenu from '@/components/crud/ExportMenu';
import ImportMenu from '@/components/crud/ImportMenu';
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  Inbox,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

function PhotoThumbnails({ paths }: { paths: string[] }) {
  const supabase = createClient();
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const signed = await Promise.all(
        paths.map(async (p) => {
          const { data } = await supabase.storage
            .from('technician-documents')
            .createSignedUrl(p, 3600);
          return data?.signedUrl ?? null;
        })
      );
      if (!cancelled) setUrls(signed.filter(Boolean) as string[]);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths.join(',')]);

  if (urls.length === 0) return <span className="text-xs text-white/30">Loading…</span>;

  return (
    <div className="flex -space-x-2">
      {urls.slice(0, 3).map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
          <img
            src={url}
            alt="Job photo"
            className="h-8 w-8 rounded-md border border-white/20 object-cover transition-transform hover:z-10 hover:scale-150"
          />
        </a>
      ))}
      {urls.length > 3 && (
        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-white/10 text-xs text-white/60">
          +{urls.length - 3}
        </span>
      )}
    </div>
  );
}

export default function CrudPage({ moduleConfig }: { moduleConfig: ModuleConfig }) {
  const { profile } = useAuth();
  const supabase = createClient();
  const role = profile?.role ?? 'technician';

  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState(moduleConfig.defaultSort.key);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(moduleConfig.defaultSort.direction);
  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [deletingRow, setDeletingRow] = useState<Record<string, any> | null>(null);

  const tableFields = moduleConfig.fields.filter((f) => f.showInTable !== false);
  const statusField = moduleConfig.fields.find((f) => f.type === 'badge' && f.options);
  const canWrite = (moduleConfig.writeRoles ?? ['admin']).includes(role);

  const selectString = useMemo(() => {
    const relSelects = moduleConfig.fields
      .filter((f) => f.relation)
      .map((f) => `${f.relation!.table}(${f.relation!.labelKey})`);
    return ['*', ...relSelects].join(',');
  }, [moduleConfig]);

  const buildQuery = () => {
    let query = supabase.from(moduleConfig.table).select(selectString, { count: 'exact' });
    if (moduleConfig.table !== 'activity_logs') {
      query = query.is('deleted_at', null);
    }
    if (search.trim() && moduleConfig.searchableKeys.length > 0) {
      const orClause = moduleConfig.searchableKeys.map((k) => `${k}.ilike.%${search.trim()}%`).join(',');
      query = query.or(orClause);
    }
    if (statusField && statusFilter) {
      query = query.eq(statusField.key, statusFilter);
    }
    return query;
  };

  const load = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count, error } = await buildQuery()
      .order(sortKey, { ascending: sortDir === 'asc' })
      .range(from, to);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setRows(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleConfig.slug, page, search, statusFilter, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, moduleConfig.slug]);

  // Live-refresh this table when the underlying row data changes elsewhere
  // (e.g. a technician uploads a photo or completes a job from their dashboard)
  useEffect(() => {
    const channel = supabase
      .channel(`crud-${moduleConfig.table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: moduleConfig.table },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleConfig.table, page, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleDelete = async () => {
    if (!deletingRow) return;
    const isSoftDelete = moduleConfig.fields.some((f) => f.key === 'deleted_at') || true;
    const { error } = moduleConfig.table === 'activity_logs'
      ? { error: null }
      : await supabase.from(moduleConfig.table).update({ deleted_at: new Date().toISOString() }).eq('id', deletingRow.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${moduleConfig.label.slice(0, -1)} deleted`);
      setDeletingRow(null);
      load();
    }
  };

  const renderCell = (row: Record<string, any>, field: (typeof tableFields)[number]) => {
    const raw = row[field.key];
    if (field.relation) {
      const rel = row[field.relation.table];
      return rel?.[field.relation.labelKey] ?? '—';
    }
    if (field.type === 'photos') {
      const paths: string[] = Array.isArray(raw) ? raw : [];
      if (paths.length === 0) return '—';
      return <PhotoThumbnails paths={paths} />;
    }
    if (raw === null || raw === undefined || raw === '') return '—';
    if (field.type === 'badge') {
      const colorClass = field.badgeColors?.[raw] ?? 'bg-white/10 text-white/60 border-white/20';
      return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${colorClass}`}>
          {String(raw).replace(/_/g, ' ')}
        </span>
      );
    }
    if (field.type === 'checkbox') {
      return raw ? (
        <span className="text-mint-300">Yes</span>
      ) : (
        <span className="text-white/30">No</span>
      );
    }
    if (field.type === 'currency') {
      return `₹${Number(raw).toLocaleString('en-IN')}`;
    }
    if (field.type === 'date') {
      try {
        return format(new Date(raw), 'dd MMM yyyy');
      } catch {
        return raw;
      }
    }
    if (field.type === 'datetime') {
      try {
        return format(new Date(raw), 'dd MMM yyyy, hh:mm a');
      } catch {
        return raw;
      }
    }
    return String(raw);
  };

  const exportColumns = tableFields.map((f) => ({
    key: f.key,
    label: f.label,
    relation: f.relation ? { table: f.relation.table, labelKey: f.relation.labelKey } : undefined,
  }));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-white">{moduleConfig.label}</h2>
          <p className="text-sm text-white/40">{moduleConfig.description}</p>
        </div>
        <div className="no-print flex items-center gap-2">
          <ExportMenu title={moduleConfig.label} columns={exportColumns} table={moduleConfig.table} currentFilterFn={() => buildQuery()} />
          {moduleConfig.canCreate && canWrite && (
            <button
              onClick={() => {
                setEditingRow(null);
                setShowModal(true);
              }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" /> Add {moduleConfig.label.slice(0, -1) || moduleConfig.label}
            </button>
          )}


          {moduleConfig.canCreate && canWrite && (
          <ImportMenu
           table={moduleConfig.table}
           label={moduleConfig.label}
           fields={moduleConfig.fields.filter((f) => !f.relation)}
           onImported={load}
           />
           )}


        </div>
      </div>

      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${moduleConfig.label.toLowerCase()}...`}
            className="input-field pl-9"
          />
        </div>
        {statusField && (
          <button onClick={() => setFiltersOpen((v) => !v)} className="btn-secondary">
            <Filter className="h-4 w-4" /> Filters {statusFilter && `(1)`}
          </button>
        )}
        <span className="ml-auto text-xs text-white/40">
          Showing {rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + rows.length} of {total}
        </span>
      </div>

      {filtersOpen && statusField && (
        <div className="no-print mb-4 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <button
            onClick={() => setStatusFilter('')}
            className={`rounded-full px-3 py-1 text-xs ${!statusFilter ? 'bg-mint-500/20 text-mint-300' : 'text-white/50 hover:bg-white/5'}`}
          >
            All
          </button>
          {statusField.options?.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-xs capitalize ${
                statusFilter === opt.value ? 'bg-mint-500/20 text-mint-300' : 'text-white/50 hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="glass-panel print-area overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {tableFields.map((f) => (
                  <th
                    key={f.key}
                    onClick={() => !f.relation && toggleSort(f.key)}
                    className={`table-header-cell ${!f.relation ? 'cursor-pointer select-none' : ''}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {f.label}
                      {sortKey === f.key && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </span>
                  </th>
                ))}
                {canWrite && (moduleConfig.canUpdate || moduleConfig.canDelete) && (
                  <th className="table-header-cell no-print">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={tableFields.length + 1} className="py-16 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-mint-400" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={tableFields.length + 1} className="py-16 text-center">
                    <Inbox className="mx-auto mb-2 h-8 w-8 text-white/20" />
                    <p className="text-sm text-white/40">No records found.</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    {tableFields.map((f) => (
                      <td key={f.key} className="table-cell">
                        {renderCell(row, f)}
                      </td>
                    ))}
                    {canWrite && (moduleConfig.canUpdate || moduleConfig.canDelete) && (
                      <td className="table-cell no-print">
                        <div className="flex gap-1">
                          {moduleConfig.canUpdate && (
                            <button
                              onClick={() => {
                                setEditingRow(row);
                                setShowModal(true);
                              }}
                              className="rounded-lg p-1.5 text-white/40 hover:bg-mint-500/10 hover:text-mint-300"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {moduleConfig.canDelete && role === 'admin' && (
                            <button
                              onClick={() => setDeletingRow(row)}
                              className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/10 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="no-print mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-white/50">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-ghost disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {showModal && (
        <FormModal
          moduleConfig={moduleConfig}
          initialData={editingRow}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            toast.success(editingRow ? 'Changes saved' : `${moduleConfig.label.slice(0, -1)} created`);
            load();
          }}
        />
      )}

      {deletingRow && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm p-6">
            <h3 className="mb-2 font-display text-lg font-bold text-white">Delete record?</h3>
            <p className="mb-5 text-sm text-white/50">
              This will remove the record from all lists and reports. This action can be reversed only by a database admin.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="btn-primary flex-1 justify-center !from-red-600 !to-red-400 !text-white">
                Delete
              </button>
              <button onClick={() => setDeletingRow(null)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}