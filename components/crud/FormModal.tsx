'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ModuleConfig } from '@/lib/modules';
import { createClient } from '@/lib/supabase/client';

type RelationOptions = Record<string, { value: string; label: string }[]>;

export default function FormModal({
  moduleConfig,
  initialData,
  onClose,
  onSaved,
}: {
  moduleConfig: ModuleConfig;
  initialData: Record<string, any> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, any>>(initialData ?? {});
  const [relationOptions, setRelationOptions] = useState<RelationOptions>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const formFields = moduleConfig.fields.filter((f) => f.showInForm !== false);

  useEffect(() => {
    const loadRelations = async () => {
      const relFields = formFields.filter((f) => f.relation);
      const entries = await Promise.all(
        relFields.map(async (f) => {
          const { table, valueKey, labelKey } = f.relation!;
          const { data } = await supabase.from(table).select(`${valueKey}, ${labelKey}`).limit(500);
          return [
            f.key,
            (data ?? []).map((r: any) => ({ value: r[valueKey], label: r[labelKey] })),
          ] as const;
        })
      );
      setRelationOptions(Object.fromEntries(entries));
    };
    loadRelations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key: string, value: any) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const generateCode = () => {
    if (!moduleConfig.codePrefix) return undefined;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${moduleConfig.codePrefix}-${Date.now().toString().slice(-6)}${rand}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, any> = { ...values };
    formFields.forEach((f) => {
      if (f.type === 'number' || f.type === 'currency') {
        if (payload[f.key] !== undefined && payload[f.key] !== '') {
          payload[f.key] = Number(payload[f.key]);
        }
      }
      if (f.type === 'checkbox') {
        payload[f.key] = Boolean(payload[f.key]);
      }
    });

    // Auto-generate the human-friendly code field on create
    const codeField = moduleConfig.fields.find((f) => f.showInForm === false && f.type === 'text');
    if (!initialData && codeField && moduleConfig.codePrefix) {
      payload[codeField.key] = generateCode();
    }

    try {
      if (initialData?.id) {
        const { error } = await supabase.from(moduleConfig.table).update(payload).eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(moduleConfig.table).insert(payload);
        if (error) throw error;
      }
      onSaved();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-panel max-h-[85vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-white">
            {initialData ? `Edit ${moduleConfig.label.slice(0, -1) || moduleConfig.label}` : `Add ${moduleConfig.label}`}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:bg-white/[0.06] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                {f.label} {f.required && <span className="text-red-400">*</span>}
              </label>

              {f.type === 'textarea' ? (
                <textarea
                  required={f.required}
                  value={values[f.key] ?? ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                />
              ) : f.type === 'select' || f.type === 'badge' ? (
                <select
                  required={f.required}
                  value={values[f.key] ?? ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  className="input-field"
                >
                  <option value="">Select...</option>
                  {(f.relation ? relationOptions[f.key] : f.options)?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={Boolean(values[f.key])}
                    onChange={(e) => handleChange(f.key, e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-mint-500"
                  />
                  {values[f.key] ? 'Yes' : 'No'}
                </label>
              ) : f.type === 'date' ? (
                <input
                  type="date"
                  required={f.required}
                  value={values[f.key] ?? ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  className="input-field"
                />
              ) : f.type === 'number' || f.type === 'currency' ? (
                <input
                  type="number"
                  step="any"
                  required={f.required}
                  value={values[f.key] ?? ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  className="input-field"
                />
              ) : (
                <input
                  type="text"
                  required={f.required}
                  value={values[f.key] ?? ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  className="input-field"
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {initialData ? 'Save Changes' : 'Create'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
