import { Mail } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/page-header';
import { formatDateTime } from '@/lib/utils/format';
import { MessageCard } from './message-card';

export const metadata = { title: 'Messages — Super Admin' };

type SearchParams = { filter?: 'all' | 'pending' | 'done' };

export default async function SuperadminMessagesPage(props: { searchParams: Promise<SearchParams> }) {
  const { filter = 'pending' } = await props.searchParams;
  const supabase = createAdminClient();

  let query = supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter === 'pending') query = query.eq('traite', false);
  if (filter === 'done') query = query.eq('traite', true);

  const { data: messages } = await query;

  const pending = (messages ?? []).filter((m: any) => !m.traite).length;
  const done = (messages ?? []).filter((m: any) => m.traite).length;

  return (
    <div>
      <PageHeader
        title="Messages de contact"
        description="Demandes reçues via le formulaire public /contact."
      />

      <div className="flex gap-2 mb-4 text-sm">
        <FilterPill href="/superadmin/messages" label="Tous" active={filter === 'all' as any} count={(messages ?? []).length} />
        <FilterPill href="/superadmin/messages?filter=pending" label="Non traités" active={filter === 'pending'} count={pending} tone="rose" />
        <FilterPill href="/superadmin/messages?filter=done" label="Traités" active={filter === 'done'} count={done} tone="emerald" />
      </div>

      {(!messages || messages.length === 0) ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Mail className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500">Aucun message.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m: any) => (
            <MessageCard
              key={m.id}
              id={m.id}
              nom={m.nom}
              email={m.email}
              telephone={m.telephone}
              sujet={m.sujet}
              message={m.message}
              traite={m.traite}
              createdAt={formatDateTime(m.created_at)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

function FilterPill({ href, label, active, count, tone }: any) {
  const tones: Record<string, string> = {
    default: 'bg-rose-600 text-white border-rose-600',
    rose: 'bg-rose-600 text-white border-rose-600',
    emerald: 'bg-emerald-600 text-white border-emerald-600'
  };
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium border transition',
        active ? tones[tone ?? 'default'] : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      )}
    >
      {label}
      <span className={cn(
        'text-[10px] font-bold px-1.5 py-0.5 rounded',
        active ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
      )}>{count}</span>
    </Link>
  );
}
