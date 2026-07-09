'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { modulesForRole, ModuleConfig } from '@/lib/modules';
import Topbar from '@/components/Topbar';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type ResultGroup = { module: ModuleConfig; rows: Record<string, any>[] };

export default function GlobalSearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const { profile } = useAuth();
  const supabase = createClient();
  const [results, setResults] = useState<ResultGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || !q) return;
    const run = async () => {
      setLoading(true);
      const modules = modulesForRole(profile.role).filter((m) => m.searchableKeys.length > 0);
      const groups = await Promise.all(
        modules.map(async (m) => {
          const orClause = m.searchableKeys.map((k) => `${k}.ilike.%${q}%`).join(',');
          const { data } = await supabase.from(m.table).select('*').or(orClause).limit(5);
          return { module: m, rows: data ?? [] };
        })
      );
      setResults(groups.filter((g) => g.rows.length > 0));
      setLoading(false);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, profile?.id]);

  return (
    <div>
      <Topbar title={`Search results for "${q}"`} />
      <div className="space-y-4 p-6">
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-mint-400" />
        ) : results.length === 0 ? (
          <p className="text-sm text-white/40">No matches found across any module.</p>
        ) : (
          results.map(({ module, rows }) => (
            <div key={module.slug} className="glass-panel p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-white">{module.label}</h3>
                <Link href={`/dashboard/modules/${module.slug}`} className="text-xs text-mint-300 hover:underline">
                  View all
                </Link>
              </div>
              <ul className="divide-y divide-white/5">
                {rows.map((row) => (
                  <li key={row.id} className="py-2 text-sm text-white/70">
                    {module.searchableKeys.map((k) => row[k]).filter(Boolean).join(' — ')}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
