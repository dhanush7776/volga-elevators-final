'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import LoadingScreen from '@/components/LoadingScreen';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, profile } = useAuth();

  if (loading || !profile) {
    return <LoadingScreen label="Signing you in" />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
