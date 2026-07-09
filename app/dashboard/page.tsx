'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/Topbar';
import StatCard from '@/components/StatCard';
import RevenueChart from '@/components/charts/RevenueChart';
import ComplaintChart from '@/components/charts/ComplaintChart';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2 } from 'lucide-react';

type Stats = {
  total_customers: number;
  total_buildings: number;
  total_elevators: number;
  active_amc: number;
  expired_amc: number;
  today_services: number;
  pending_services: number;
  completed_services: number;
  total_revenue: number;
  open_complaints: number;
  resolved_complaints: number;
};

type Activity = { id: string; action: string; entity_table: string; created_at: string };

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.replace('/dashboard/technician');
    }
  }, [profile, router]);

  useEffect(() => {
    const load = async () => {
      const { data: statsData } = await supabase.from('v_dashboard_admin_stats').select('*').single();
      setStats(statsData as Stats);

      const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), 5 - i));
      const revenueRows = await Promise.all(
        months.map(async (m) => {
          const { data } = await supabase
            .from('payments')
            .select('amount_paid')
            .gte('paid_date', format(startOfMonth(m), 'yyyy-MM-dd'))
            .lte('paid_date', format(endOfMonth(m), 'yyyy-MM-dd'));
          const total = (data ?? []).reduce((sum, r: any) => sum + (r.amount_paid ?? 0), 0);
          return { month: format(m, 'MMM'), revenue: total };
        })
      );
      setRevenueData(revenueRows);

      const { data: activityData } = await supabase
        .from('activity_logs')
        .select('id, action, entity_table, created_at')
        .order('created_at', { ascending: false })
        .limit(8);
      setActivities((activityData as Activity[]) ?? []);

      setLoading(false);
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mint-400" />
      </div>
    );
  }

  const complaintData = [
    { name: 'Open', value: stats.open_complaints },
    { name: 'Resolved', value: stats.resolved_complaints },
  ];

  return (
    <div>
      <Topbar title="Admin Dashboard" />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          <StatCard label="Total Customers" value={stats.total_customers} icon="Users" accent="mint" />
          <StatCard label="Total Buildings" value={stats.total_buildings} icon="Building2" accent="sky" />
          <StatCard label="Total Elevators" value={stats.total_elevators} icon="ArrowUpDown" accent="mint" />
          <StatCard label="Active AMC" value={stats.active_amc} icon="FileSignature" accent="mint" />
          <StatCard label="Expired AMC" value={stats.expired_amc} icon="FileWarning" accent="red" />
          <StatCard label="Today's Services" value={stats.today_services} icon="CalendarClock" accent="sky" />
          <StatCard label="Pending Services" value={stats.pending_services} icon="Clock" accent="amber" />
          <StatCard label="Completed Services" value={stats.completed_services} icon="CheckCircle2" accent="mint" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="glass-panel p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-white">Revenue — Last 6 Months</h3>
              <span className="font-display text-lg font-bold text-mint-300">
                ₹{stats.total_revenue.toLocaleString('en-IN')}
              </span>
            </div>
            <RevenueChart data={revenueData} />
          </div>

          <div className="glass-panel p-5">
            <h3 className="mb-4 font-display text-sm font-semibold text-white">Complaint Statistics</h3>
            <ComplaintChart data={complaintData} />
          </div>
        </div>

        <div className="glass-panel p-5">
          <h3 className="mb-4 font-display text-sm font-semibold text-white">Recent Activity</h3>
          {activities.length === 0 ? (
            <p className="text-sm text-white/40">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {activities.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-white/80">
                    <span className="capitalize text-mint-300">{a.action.toLowerCase()}</span>{' '}
                    on <span className="text-white/60">{a.entity_table.replace(/_/g, ' ')}</span>
                  </span>
                  <span className="text-xs text-white/30">
                    {format(new Date(a.created_at), 'dd MMM, hh:mm a')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
