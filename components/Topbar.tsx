'use client';

import { useEffect, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Topbar({ title }: { title?: string }) {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [unread, setUnread] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', profile.id)
        .eq('is_read', false);
      setUnread(count ?? 0);
    };
    load();
    const channel = supabase
      .channel('notifications-badge')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="no-print sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/10 bg-navy-950/70 px-6 py-4 backdrop-blur-xl">
      <div>{title && <h1 className="font-display text-lg font-bold text-white">{title}</h1>}</div>

      <form onSubmit={handleSearch} className="hidden max-w-md flex-1 md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Global search... (Press Enter)"
            className="input-field pl-9"
          />
        </div>
      </form>

      <div className="flex items-center gap-3">
        <Link href="/dashboard/modules/notifications" className="relative rounded-lg p-2 hover:bg-white/[0.06]">
          <Bell className="h-5 w-5 text-white/70" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
        <div className="text-right">
          <p className="text-sm font-medium text-white">{profile?.full_name}</p>
          <p className="text-[11px] capitalize text-white/40">{profile?.role}</p>
        </div>
      </div>
    </header>
  );
}
