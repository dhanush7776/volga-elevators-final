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
    mint: 'from-emerald-500/20 to-emerald-300/5 text-emerald-500 dark:text-emerald-300 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-300/5 text-amber-500 dark:text-amber-300 border-amber-500/20',
    red: 'from-rose-500/20 to-rose-300/5 text-rose-500 dark:text-rose-300 border-rose-500/20',
    sky: 'from-sky-500/20 to-sky-300/5 text-sky-500 dark:text-sky-300 border-sky-500/20',
  }[accent];

  return (
    <div className="glass-card animate-fade-up p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--color-muted-text)' }}>
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {value}
          </p>
          {trend && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-text)' }}>
              {trend}
            </p>
          )}
        </div>
        <div className={clsx('rounded-xl border bg-gradient-to-br p-2.5', accentClasses)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}