'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Topbar from '@/components/Topbar';
import { format } from 'date-fns';
import { Loader2, Tag, Clock, Camera, CheckCircle2, PlayCircle } from 'lucide-react';

type Job = {
  id: string;
  request_number: string;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  site_name: string | null;
  job_type: string | null;
  is_emergency: boolean | null;
  completion_note: string | null;
  photo_urls: string[] | null;
};

export default function TechnicianDashboardPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data } = await supabase
        .from('service_requests')
        .select(
          'id, request_number, status, scheduled_date, scheduled_time, site_name, job_type, is_emergency, completion_note, photo_urls'
        )
        .eq('assigned_technician_id', profile.id)
        .order('scheduled_time', { ascending: true });

      setJobs((data as Job[]) ?? []);
      setLoading(false);
    };
    load();
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysJobs = jobs.filter((j) => j.scheduled_date === today);
  const jobsDone = todaysJobs.filter((j) => j.status === 'completed').length;

  const updateStatus = async (jobId: string, status: string) => {
    setUpdatingId(jobId);
    await supabase.from('service_requests').update({ status }).eq('id', jobId);
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
    setUpdatingId(null);
  };

  const handleUploadPhotos = async (jobId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingId(jobId);

    const uploadedPaths: string[] = [];

    for (const file of Array.from(files)) {
      const filePath = `${jobId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('technician-documents')
        .upload(filePath, file);

      if (error) {
        console.error('Upload failed:', error.message);
        continue;
      }
      uploadedPaths.push(filePath);
    }

    if (uploadedPaths.length > 0) {
      const job = jobs.find((j) => j.id === jobId);
      const existing = job?.photo_urls ?? [];
      const updated = [...existing, ...uploadedPaths];

      await supabase
        .from('service_requests')
        .update({ photo_urls: updated })
        .eq('id', jobId);

      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, photo_urls: updated } : j))
      );
    }

    setUploadingId(null);
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

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
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-panel p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-white/40">Jobs Done</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">
              {jobsDone}/{todaysJobs.length}
            </p>
          </div>
          <div className="glass-panel p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-white/40">Hours</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">
              {profile?.hours_logged ?? '0.0'}
            </p>
          </div>
          <div className="glass-panel p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-white/40">Rating</p>
            <p className="mt-1 font-display text-2xl font-semibold text-amber-400">
              {profile?.rating ?? '—'}
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-display text-sm font-semibold text-white">Today&apos;s Schedule</h3>

          {todaysJobs.length === 0 ? (
            <div className="glass-panel p-5">
              <p className="text-sm text-white/40">No jobs scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todaysJobs.map((j) => (
                <div key={j.id} className="glass-panel p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display text-base font-semibold text-white">
                        {j.site_name ?? j.request_number}
                      </p>
                      <p className="text-xs text-white/40">{j.request_number}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {j.is_emergency && (
                        <span className="rounded-full bg-red-500/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Emergency
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          j.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : j.status === 'in_progress'
                            ? 'bg-sky-500/20 text-sky-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {j.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      {j.job_type ?? 'Job'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(j.scheduled_time)}
                    </span>
                  </div>

                  {j.status === 'completed' && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      {j.completion_note ?? 'Work completed successfully.'}
                    </div>
                  )}

                  {j.status === 'in_progress' && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
                        {uploadingId === j.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        Upload Photos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          hidden
                          onChange={(e) => handleUploadPhotos(j.id, e.target.files)}
                        />
                      </label>
                      <button
                        onClick={() => updateStatus(j.id, 'completed')}
                        disabled={updatingId === j.id}
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
                      >
                        {updatingId === j.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Mark Complete
                      </button>
                    </div>
                  )}

                  {j.photo_urls && j.photo_urls.length > 0 && (
                    <p className="mt-2 text-[11px] text-white/40">
                      {j.photo_urls.length} photo{j.photo_urls.length > 1 ? 's' : ''} uploaded
                    </p>
                  )}

                  {j.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(j.id, 'in_progress')}
                      disabled={updatingId === j.id}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                    >
                      {updatingId === j.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PlayCircle className="h-4 w-4" />
                      )}
                      Start Job
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}