'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getModule } from '@/lib/modules';
import { useAuth } from '@/lib/auth-context';
import Topbar from '@/components/Topbar';
import CrudPage from '@/components/CrudPage';
import { Loader2 } from 'lucide-react';

export default function ModulePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const moduleConfig = getModule(params.slug);

  useEffect(() => {
    if (profile && moduleConfig && !moduleConfig.roles.includes(profile.role)) {
      router.replace(profile.role === 'admin' ? '/dashboard' : '/dashboard/technician');
    }
  }, [profile, moduleConfig, router]);

  if (!moduleConfig) {
    return (
      <div>
        <Topbar title="Not Found" />
        <div className="p-6 text-white/50">This module doesn&apos;t exist.</div>
      </div>
    );
  }

  if (!profile || !moduleConfig.roles.includes(profile.role)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mint-400" />
      </div>
    );
  }

  return (
    <div>
      <Topbar title={moduleConfig.label} />
      <CrudPage moduleConfig={moduleConfig} />
    </div>
  );
}
