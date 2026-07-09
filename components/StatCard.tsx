import * as Icons from 'lucide-react';
import clsx from 'clsx';

export default function StatCard({
  label,
  value,
  icon,
  trend,
  accent = 'mint',
}: {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  accent?: 'mint' | 'amber' | 'red' | 'sky';
}) {
  const Icon = (Icons as any)[icon] ?? Icons.Circle;
  const accentClasses = {
    mint: 'from-mint-600/20 to-mint-300/5 text-mint-300 border-mint-500/20',
    amber: 'from-amber-600/20 to-amber-300/5 text-amber-300 border-amber-500/20',
    red: 'from-red-600/20 to-red-300/5 text-red-300 border-red-500/20',
    sky: 'from-sky-600/20 to-sky-300/5 text-sky-300 border-sky-500/20',
  }[accent];

  return (
    <div className="glass-card animate-fade-up p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/40">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{value}</p>
          {trend && <p className="mt-1 text-xs text-mint-300/70">{trend}</p>}
        </div>
        <div className={clsx('rounded-xl border bg-gradient-to-br p-2.5', accentClasses)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
