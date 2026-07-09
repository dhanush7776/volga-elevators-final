'use client';

import { useState } from 'react';
import { Download, Printer, ChevronDown } from 'lucide-react';
import { DATE_RANGE_LABELS, DateRangeKey, resolveDateRange } from '@/lib/date-ranges';
import { exportToPDF, exportToExcel, exportToCSV, ExportColumn } from '@/lib/export';
import { createClient } from '@/lib/supabase/client';

export default function ExportMenu({
  title,
  columns,
  table,
  currentFilterFn,
}: {
  title: string;
  columns: ExportColumn[];
  table: string;
  /** applies the current search/status filters to a Supabase query */
  currentFilterFn?: (q: any) => any;
}) {
  const [open, setOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  const fetchRows = async (rangeKey: DateRangeKey) => {
    setBusy(true);
    try {
      const { from, to } = resolveDateRange(rangeKey, { from: customFrom, to: customTo });
      let query = supabase.from(table).select('*');
      if (currentFilterFn) query = currentFilterFn(query);
      if (from) query = query.gte('created_at', from.toISOString());
      if (to) query = query.lte('created_at', to.toISOString());
      const { data, error } = await query.limit(5000);
      if (error) throw error;
      return data ?? [];
    } finally {
      setBusy(false);
    }
  };

  const doExport = async (format: 'pdf' | 'excel' | 'csv', rangeKey: DateRangeKey) => {
    const rows = await fetchRows(rangeKey);
    if (format === 'pdf') {
      exportToPDF(title, columns, rows, { name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Volga Elevators' });
    } else if (format === 'excel') {
      exportToExcel(title, columns, rows);
    } else {
      exportToCSV(title, columns, rows);
    }
    setRangeOpen(false);
    setOpen(false);
  };

  const ranges = Object.keys(DATE_RANGE_LABELS) as DateRangeKey[];

  return (
    <div className="relative flex items-center gap-2">
      <button onClick={() => window.print()} className="btn-secondary">
        <Printer className="h-4 w-4" /> Print
      </button>

      <div className="relative">
        <button onClick={() => setOpen((v) => !v)} className="btn-secondary" disabled={busy}>
          <Download className="h-4 w-4" /> Export <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-white/10 bg-navy-800/95 p-2 shadow-glass backdrop-blur-xl">
            <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Date Range
            </p>
            <div className="max-h-56 overflow-y-auto">
              {ranges.map((r) => (
                <div key={r}>
                  <button
                    onClick={() => (r === 'custom' ? setRangeOpen(r === 'custom' ? !rangeOpen : false) : doExport('pdf', r))}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-white/70 hover:bg-white/[0.06] hover:text-white"
                  >
                    {DATE_RANGE_LABELS[r]}
                  </button>
                  {r === 'custom' && rangeOpen && (
                    <div className="space-y-2 px-2 pb-2">
                      <input
                        type="date"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="input-field text-xs"
                      />
                      <input
                        type="date"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="input-field text-xs"
                      />
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => doExport('pdf', 'custom')} className="btn-primary flex-1 justify-center py-1.5 text-xs">
                          PDF
                        </button>
                        <button onClick={() => doExport('excel', 'custom')} className="btn-secondary flex-1 justify-center py-1.5 text-xs">
                          Excel
                        </button>
                        <button onClick={() => doExport('csv', 'custom')} className="btn-secondary flex-1 justify-center py-1.5 text-xs">
                          CSV
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-1 border-t border-white/10 pt-2">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Or export all (lifetime) as
              </p>
              <div className="flex gap-2 px-2">
                <button onClick={() => doExport('pdf', 'lifetime')} className="btn-secondary flex-1 justify-center py-1.5 text-xs">
                  PDF
                </button>
                <button onClick={() => doExport('excel', 'lifetime')} className="btn-secondary flex-1 justify-center py-1.5 text-xs">
                  Excel
                </button>
                <button onClick={() => doExport('csv', 'lifetime')} className="btn-secondary flex-1 justify-center py-1.5 text-xs">
                  CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
