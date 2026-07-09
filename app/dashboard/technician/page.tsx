'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Topbar from '@/components/Topbar';
import StatCard from '@/components/StatCard';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

type Job = {
  id: string;
  request_number: string;
  status: string;
  scheduled_date: string | null;
  description: string | null;
};

export default function TechnicianDashboardPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [counts, setCounts] = useState({ assigned: 0, completed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data } = await supabase
        .from('service_requests')
        .select('id, request_number, status, scheduled_date, description')
        .eq('assigned_technician_id', profile.id)
        .order('scheduled_date', { ascending: true });

      const all = (data as Job[]) ?? [];
      setJobs(all);
      setCounts({
        assigned: all.filter((j) => j.status === 'assigned').length,
        completed: all.filter((j) => j.status === 'completed').length,
        pending: all.filter((j) => j.status === 'pending' || j.status === 'in_progress').length,
      });
      setLoading(false);
    };
    load();
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysJobs = jobs.filter((j) => j.scheduled_date === today);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mint-400" />
      </div>
    );
  }

  return (
    <div>
      <Topbar title={`Welcome, ${profile?.full_name?.split(' ')[0] ?? ''}`} />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label="Assigned Jobs" value={counts.assigned} icon="ClipboardList" accent="sky" />
          <StatCard label="Pending Jobs" value={counts.pending} icon="Clock" accent="amber" />
          <StatCard label="Completed Jobs" value={counts.completed} icon="CheckCircle2" accent="mint" />
        </div>

        <div className="glass-panel p-5">
          <h3 className="mb-4 font-display text-sm font-semibold text-white">Today&apos;s Schedule</h3>
          {todaysJobs.length === 0 ? (
            <p className="text-sm text-white/40">No jobs scheduled for today.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {todaysJobs.map((j) => (
                <li key={j.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{j.request_number}</p>
                    <p className="text-xs text-white/40">{j.description}</p>
                  </div>
                  <span className="rounded-full border border-mint-500/30 bg-mint-500/10 px-2.5 py-1 text-xs capitalize text-mint-300">
                    {j.status.replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-panel p-5">
          <h3 className="mb-4 font-display text-sm font-semibold text-white">All Assigned Jobs</h3>
          <ul className="divide-y divide-white/5">
            {jobs.map((j) => (
              <li key={j.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-white">{j.request_number}</p>
                  <p className="text-xs text-white/40">
                    {j.scheduled_date ? format(new Date(j.scheduled_date), 'dd MMM yyyy') : 'Unscheduled'}
                  </p>
                </div>
                <span className="capitalize text-white/50">{j.status.replace('_', ' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
