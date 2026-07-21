"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // adjust path if your project uses a different one
import { X, Loader2 } from "lucide-react";

export interface CustomerFormValues {
  id?: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
  service_interval_months: 6 | 12;
  payment_status: "paid" | "unpaid";
}

const EMPTY: CustomerFormValues = {
  name: "",
  phone: "",
  address: "",
  city: "",
  notes: "",
  service_interval_months: 6,
  payment_status: "unpaid",
};

export default function CustomerFormModal({
  open,
  onClose,
  onSaved,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialValues?: CustomerFormValues | null;
}) {
  const supabase = createClient();
  const [values, setValues] = useState<CustomerFormValues>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(initialValues?.id);

  useEffect(() => {
    if (open) {
      setValues(initialValues ?? EMPTY);
      setError(null);
    }
  }, [open, initialValues]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Customer name is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: values.name.trim(),
      phone: values.phone.trim() || null,
      address: values.address.trim() || null,
      city: values.city.trim() || null,
      notes: values.notes.trim() || null,
      service_interval_months: values.service_interval_months,
      payment_status: values.payment_status,
    };

    const result = isEdit
      ? await supabase.from("customers").update(payload).eq("id", values.id)
      : await supabase.from("customers").insert({
          ...payload,
          customer_code: `CUST-${Date.now().toString().slice(-6)}`,
        });

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-emerald-400/20 bg-slate-900/95 shadow-2xl shadow-emerald-500/10">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Customer" : "Add Customer"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Name *
            </label>
            <input
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white outline-none focus:border-[#2DD4BF]"
              placeholder="Customer name"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Phone
            </label>
            <input
              value={values.phone}
              onChange={(e) => setValues({ ...values, phone: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white outline-none focus:border-[#2DD4BF]"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Address
            </label>
            <input
              value={values.address}
              onChange={(e) => setValues({ ...values, address: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white outline-none focus:border-[#2DD4BF]"
              placeholder="Street address"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              City
            </label>
            <input
              value={values.city}
              onChange={(e) => setValues({ ...values, city: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white outline-none focus:border-[#2DD4BF]"
              placeholder="City"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Service reminder interval
            </label>
            <div className="flex gap-2">
              {[6, 12].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() =>
                    setValues({ ...values, service_interval_months: m as 6 | 12 })
                  }
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                    values.service_interval_months === m
                      ? "border-[#2DD4BF] bg-[#2DD4BF]/10 text-[#A7FEEB]"
                      : "border-white/10 bg-slate-800/60 text-slate-400 hover:border-white/20"
                  }`}
                >
                  {m === 12 ? "Every 1 year" : `Every ${m} months`}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Applies to all elevators under this customer. A reminder notification
              is sent to admins 7 days before the next service is due.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Payment status
            </label>
            <div className="flex gap-2">
              {(["paid", "unpaid"] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setValues({ ...values, payment_status: p })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition ${
                    values.payment_status === p
                      ? p === "paid"
                        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                        : "border-rose-400/40 bg-rose-500/10 text-rose-300"
                      : "border-white/10 bg-slate-800/60 text-slate-400 hover:border-white/20"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Notes
            </label>
            <textarea
              value={values.notes}
              onChange={(e) => setValues({ ...values, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white outline-none focus:border-[#2DD4BF]"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-[#0D9488]/90 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save changes" : "Add customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}