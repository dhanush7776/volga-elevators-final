"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; // adjust path if your project uses a different one
import { X, Phone, MapPin, CalendarClock, CheckCircle2, Wallet } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  customerId: string | null;
}

interface DetailData {
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  service_interval_months: number;
  paymentStatus: string;
  paymentAmount: number | null;
  paymentDue: string | null;
  completedServices: number;
  nextServiceDue: string | null;
}

const PAYMENT_COLORS: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  partial: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  unpaid: "bg-red-500/15 text-red-400 border-red-500/30",
  overdue: "bg-red-500/15 text-red-400 border-red-500/30",
  "no records": "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export default function CustomerDetailModal({ open, onClose, customerId }: Props) {
  const supabase = createClient();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !customerId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [{ data: customer }, { data: payment }, { count: completedCount }, { data: elevators }] =
        await Promise.all([
          supabase
            .from("customers")
            .select("name, phone, address, city, service_interval_months")
            .eq("id", customerId)
            .single(),
          supabase
            .from("payments")
            .select("status, amount, due_date")
            .eq("customer_id", customerId)
            .order("due_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("service_requests")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", customerId)
            .eq("status", "completed"),
          supabase
            .from("buildings")
            .select("id, elevators(next_service_due)")
            .eq("customer_id", customerId)
            .is("deleted_at", null),
        ]);

      if (cancelled) return;

      const dueDates: string[] = (elevators ?? [])
        .flatMap((b: any) => b.elevators ?? [])
        .map((e: any) => e.next_service_due)
        .filter(Boolean)
        .sort();

      setData({
        name: customer?.name ?? "—",
        phone: customer?.phone ?? null,
        address: customer?.address ?? null,
        city: customer?.city ?? null,
        service_interval_months: customer?.service_interval_months ?? 3,
        paymentStatus: payment?.status ?? "no records",
        paymentAmount: payment?.amount ?? null,
        paymentDue: payment?.due_date ?? null,
        completedServices: completedCount ?? 0,
        nextServiceDue: dueDates[0] ?? null,
      });
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-emerald-400/20 bg-slate-900/95 shadow-2xl shadow-emerald-500/10">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Customer Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          {loading || !data ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-semibold text-white">{data.name}</h3>
                <div className="mt-2 space-y-1.5 text-sm text-slate-400">
                  {data.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} /> {data.phone}
                    </div>
                  )}
                  {(data.address || data.city) && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      {[data.address, data.city].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-slate-800/40 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-500">
                    <Wallet size={12} /> Payment status
                  </div>
                  <span
                    className={`mt-1.5 inline-block rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${
                      PAYMENT_COLORS[data.paymentStatus] ?? PAYMENT_COLORS["no records"]
                    }`}
                  >
                    {data.paymentStatus}
                  </span>
                  {data.paymentAmount != null && (
                    <p className="mt-1 text-xs text-slate-500">
                      ₹{data.paymentAmount.toLocaleString()}
                      {data.paymentDue ? ` due ${data.paymentDue}` : ""}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-800/40 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-500">
                    <CheckCircle2 size={12} /> Services completed
                  </div>
                  <p className="mt-1.5 text-lg font-semibold text-[#A7FEEB]">
                    {data.completedServices}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-800/40 p-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-500">
                  <CalendarClock size={12} /> Service reminder
                </div>
                <p className="mt-1.5 text-sm text-slate-300">
                  Every {data.service_interval_months} months
                  {data.nextServiceDue && (
                    <> · next due <span className="text-white">{data.nextServiceDue}</span></>
                  )}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Admins get a reminder notification 7 days before this date.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}