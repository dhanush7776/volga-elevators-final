'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { modulesForRole } from '@/lib/modules';
import * as Icons from 'lucide-react';
import { ArrowUpDown, LayoutDashboard, Settings, LogOut, Building2 } from 'lucide-react';
import clsx from 'clsx';

const MERGED_SLUGS = ['customers', 'buildings', 'elevators'];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const role = profile?.role ?? 'technician';
  const modules = modulesForRole(role).filter((m) => !MERGED_SLUGS.includes(m.slug));

  const dashboardHref = role === 'admin' ? '/dashboard' : '/dashboard/technician';
  const directoryHref = '/dashboard/elevator-directory';

  return (
    <aside className="no-print flex h-screen w-64 flex-shrink-0 flex-col border-r border-white/10 bg-navy-900/60 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-mint-600 to-mint-300 shadow-glow-mint">
          <ArrowUpDown className="h-5 w-5 text-navy-950" strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-display text-sm font-bold tracking-wide text-white">VOLGA</p>
          <p className="text-[10px] text-white/40">Elevators ERP</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        <NavItem
          href={dashboardHref}
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Dashboard"
          active={pathname === dashboardHref}
        />

        <NavItem
          href={directoryHref}
          icon={<Building2 className="h-4 w-4" />}
          label="Elevator Directory"
          active={pathname === directoryHref}
        />

        <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Modules
        </p>
        {modules.map((m) => {
          const Icon = (Icons as any)[m.icon] ?? Icons.Circle;
          const href = `/dashboard/modules/${m.slug}`;
          return (
            <NavItem
              key={m.slug}
              href={href}
              icon={<Icon className="h-4 w-4" />}
              label={m.label}
              active={pathname === href}
            />
          );
        })}

        {role === 'admin' && (
          <>
            <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              System
            </p>
            <NavItem
              href="/dashboard/settings"
              icon={<Settings className="h-4 w-4" />}
              label="Company Settings"
              active={pathname === '/dashboard/settings'}
            />
          </>
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-2.5 rounded-lg bg-white/[0.03] p-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-500/20 text-xs font-bold text-mint-300">
            {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{profile?.full_name}</p>
            <p className="truncate text-[10px] capitalize text-white/40">{profile?.role}</p>
          </div>
        </div>
        <button onClick={signOut} className="btn-ghost w-full justify-center">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-mint-500/10 text-mint-300 border border-mint-500/20'
          : 'text-white/60 hover:bg-white/[0.05] hover:text-white border border-transparent'
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}