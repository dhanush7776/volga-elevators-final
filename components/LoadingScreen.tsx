import { ArrowUpDown } from 'lucide-react';

export default function LoadingScreen({ label = 'Loading your workspace' }: { label?: string }) {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-navy-950 bg-aurora-gradient">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-mint-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-mint-200/10 blur-3xl" />

      <div className="relative flex flex-col items-center gap-6">
        {/* Elevator shaft with a car animating between floors */}
        <div className="relative h-28 w-14 overflow-hidden rounded-xl border border-mint-400/25 bg-white/[0.03] shadow-glow-mint">
          {/* floor rails */}
          <div className="absolute inset-x-0 top-1/3 h-px bg-white/10" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white/10" />
          {/* moving car */}
          <div className="absolute left-1/2 h-7 w-9 -translate-x-1/2 animate-elevator rounded-md bg-gradient-to-b from-mint-200 to-mint-400 shadow-glow-mint" />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-mint-600 to-mint-300 shadow-glow-mint">
            <ArrowUpDown className="h-5 w-5 text-navy-950" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-wide text-white">VOLGA</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-white/50">{label}&hellip;</p>
          <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/3 animate-shimmer rounded-full bg-mint-line bg-[length:200%_100%]" />
          </div>
        </div>
      </div>
    </div>
  );
}
