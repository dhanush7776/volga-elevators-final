'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { Loader2, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

type Settings = {
  company_name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  invoice_prefix: string | null;
};

export default function SettingsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.replace('/dashboard/technician');
    }
  }, [profile, router]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('company_settings').select('*').eq('id', 1).single();
      setSettings(data as Settings);
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    setUploading(true);
    const path = `logo-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('company-assets').upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('company-assets').getPublicUrl(path);
    setSettings({ ...settings, logo_url: data.publicUrl });
    setUploading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from('company_settings').update(settings).eq('id', 1);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Settings saved');
  };

  if (!settings) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mint-400" />
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Company Settings" />
      <div className="max-w-2xl space-y-6 p-6">
        <div className="glass-panel p-6">
          <h3 className="mb-4 font-display text-sm font-semibold text-white">Company Profile</h3>

          <div className="mb-5 flex items-center gap-4">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt="Logo" className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/5 text-xs text-white/30">
                No Logo
              </div>
            )}
            <label className="btn-secondary cursor-pointer">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company Name" value={settings.company_name} onChange={(v) => setSettings({ ...settings, company_name: v })} />
            <Field label="Email" value={settings.email ?? ''} onChange={(v) => setSettings({ ...settings, email: v })} />
            <Field label="Phone" value={settings.phone ?? ''} onChange={(v) => setSettings({ ...settings, phone: v })} />
            <Field label="GST Number" value={settings.gst_number ?? ''} onChange={(v) => setSettings({ ...settings, gst_number: v })} />
            <Field label="Invoice Prefix" value={settings.invoice_prefix ?? ''} onChange={(v) => setSettings({ ...settings, invoice_prefix: v })} />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-white/50">Address</label>
              <textarea
                value={settings.address ?? ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows={2}
                className="input-field resize-none"
              />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary mt-5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/50">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input-field" />
    </div>
  );
}
