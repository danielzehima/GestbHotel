import Link from 'next/link';
import { Sparkles, Plus } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TasksList } from './tasks-list';

export const metadata = { title: 'Ménage — GestHotel' };

type SearchParams = { date?: string; statut?: string; mine?: string };

const STATUS_LABELS: Record<string, string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  terminee: 'Terminée',
  verifiee: 'Vérifiée'
};

export default async function HousekeepingPage(props: { searchParams: Promise<SearchParams> }) {
  const user = await requireRole(['admin', 'receptionniste', 'menage']);
  const { date, statut, mine } = await props.searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const dateFilter = date ?? today;
  const supabase = await createClient();

  let query = supabase
    .from('housekeeping_tasks')
    .select(
      `id, statut, priorite, description, date_prevue, debut_at, fin_at,
       room:rooms(id, numero, etage),
       assignee:profiles!housekeeping_tasks_assignee_id_fkey(id, nom, prenom)`
    )
    .eq('hotel_id', user.profile.hotel_id!)
    .eq('date_prevue', dateFilter)
    .order('priorite', { ascending: false })
    .order('created_at');

  if (statut && statut !== 'all') query = query.eq('statut', statut);
  if (mine === '1') query = query.eq('assignee_id', user.profile.id);

  const [{ data: tasks }, { data: rooms }, { data: staff }] = await Promise.all([
    query,
    supabase.from('rooms').select('id, numero').eq('hotel_id', user.profile.hotel_id!).order('numero'),
    supabase
      .from('profiles')
      .select('id, nom, prenom, role')
      .eq('hotel_id', user.profile.hotel_id!)
      .in('role', ['menage', 'admin'])
      .order('nom')
  ]);

  const canCreate = user.profile.role === 'admin' || user.profile.role === 'receptionniste';
  const isMenage = user.profile.role === 'menage';

  return (
    <div>
      <PageHeader
        title="Ménage"
        description="Tâches d'entretien et de nettoyage."
        actions={
          canCreate && (
            <Link href="/housekeeping/new">
              <Button>
                <Plus className="w-4 h-4" />
                Nouvelle tâche
              </Button>
            </Link>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form action="/housekeeping" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={dateFilter}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white"
          />
          {statut && <input type="hidden" name="statut" value={statut} />}
          {mine === '1' && <input type="hidden" name="mine" value="1" />}
          <Button type="submit" size="sm" variant="secondary">Filtrer</Button>
        </form>

        <div className="flex gap-1">
          {['all', 'a_faire', 'en_cours', 'terminee', 'verifiee'].map((s) => (
            <Link
              key={s}
              href={{
                pathname: '/housekeeping',
                query: { date: dateFilter, ...(s !== 'all' ? { statut: s } : {}), ...(mine === '1' ? { mine: '1' } : {}) }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                (statut ?? 'all') === s
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s === 'all' ? 'Tous' : STATUS_LABELS[s]}
            </Link>
          ))}
        </div>

        {isMenage && (
          <Link
            href={{ pathname: '/housekeeping', query: { date: dateFilter, ...(mine === '1' ? {} : { mine: '1' }) } }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              mine === '1'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Mes tâches uniquement
          </Link>
        )}
      </div>

      {!tasks || tasks.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Aucune tâche"
          description="Aucune tâche prévue pour les filtres sélectionnés."
        />
      ) : (
        <TasksList
          tasks={tasks as any}
          staff={(staff ?? []) as any}
          currentUserId={user.profile.id}
          currentRole={user.profile.role}
        />
      )}
    </div>
  );
}
