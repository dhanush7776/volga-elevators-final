'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, Loader2, FileWarning } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { ModuleField } from '@/lib/modules';

type ImportableField = Pick<ModuleField, 'key' | 'label' | 'required' | 'type'>;

export default function ImportMenu({
  table,
  label,
  fields,
  onImported,
}: {
  table: string;
  label: string;
  fields: ImportableField[];
  onImported: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const importableFields = fields.filter((f) => f.key !== 'id' && f.key !== 'created_at' && f.key !== 'updated_at' && f.key !== 'deleted_at');

  const downloadTemplate = () => {
    const headers = importableFields.map((f) => f.key);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'template');
    XLSX.writeFile(wb, `${table}-import-template.csv`);
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
        if (parsed.length === 0) {
          toast.error('No rows found in that file');
          return;
        }
        if (parsed.length > 500) {
          toast.error('Max 500 rows per import — split into smaller files');
          return;
        }
        setRows(parsed);
      } catch (err) {
        toast.error('Could not read that file — make sure it is a valid CSV or Excel file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const missingRequired = importableFields.filter(
    (f) => f.required && rows.some((r) => !String(r[f.key] ?? '').trim())
  );

  const confirmImport = async () => {
    if (rows.length === 0) return;
    setBusy(true);
    const cleanRows = rows.map((r) => {
      const out: Record<string, any> = {};
      importableFields.forEach((f) => {
        const val = r[f.key];
        if (val === '' || val === undefined) return;
        out[f.key] = f.type === 'checkbox' ? String(val).toLowerCase() === 'true' : val;
      });
      return out;
    });
    const { error } = await supabase.from(table).insert(cleanRows);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Imported ${cleanRows.length} ${label.toLowerCase()}`);
    setOpen(false);
    setRows([]);
    setFileName('');
    onImported();
  };

  const reset = () => {
    setRows([]);
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary">
        <Upload className="h-4 w-4" /> Import
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-panel w-full max-w-lg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-white">Import {label}</h3>
              <button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="text-white/40 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-3 text-sm text-white/50">
              Upload a CSV or Excel file. Columns should match:{' '}
              <span className="text-white/70">
                {importableFields.map((f) => f.key).join(', ')}
              </span>
            </p>

            <button onClick={downloadTemplate} className="btn-secondary mb-4 w-full justify-center py-1.5 text-xs">
              Download blank template
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="input-field mb-4 file:mr-3 file:rounded-lg file:border-0 file:bg-mint-500/20 file:px-3 file:py-1.5 file:text-mint-300"
            />

            {rows.length > 0 && (
              <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="mb-1 text-sm text-white">
                  {fileName} — <span className="text-mint-300">{rows.length} rows</span> ready to import
                </p>
                {missingRequired.length > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-amber-400">
                    <FileWarning className="h-3.5 w-3.5" />
                    Some rows are missing required field(s): {missingRequired.map((f) => f.label).join(', ')}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={rows.length === 0 || busy || missingRequired.length > 0}
                className="btn-primary flex-1 justify-center disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Import ${rows.length || ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}