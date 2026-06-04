import { Clock } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { ClockWidget } from './clock-widget';
import { formatDateTime } from '@/lib/utils/format';

export const metadata = { title: 'Pointage — GestHotel' };

function diffHours(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms / 3600000;
}

export default async function ClockPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Pointage ouvert
  const { data: openClock } = await supabase
    .from('time_clock')
    .select('id, pointage_in')
    .eq('profile_id', user.profile.id)
    .is('pointage_out', null)
    .order('pointage_in', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Historique 7 derniers jours
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: history } = await supabase
    .from('time_clock')
    .select('id, pointage_in, pointage_out, notes')
    .eq('profile_id', user.profile.id)
    .gte('pointage_in', sevenDaysAgo.toISOString())
    .order('pointage_in', { ascending: false });

  const totalHours = (history ?? [])
    .filter((h) => h.pointage_out)
    .reduce((sum, h) => sum + diffHours(h.pointage_in, h.pointage_out!), 0);

  return (
    <div>
      <PageHeader
        title="Mon pointage"
        description="Enregistrez vos heures de travail."
      />

      <ClockWidget openClock={openClock as any} />

      <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Derniers 7 jours</h3>
          <span className="text-sm text-slate-500">
            Total : <span className="font-semibold text-slate-900">{totalHours.toFixed(1)}h</span>
          </span>
        </div>

        {!history || history.length === 0 ? (
          <div className="px-4 py-10 text-center text-slate-500 text-sm">
            <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            Aucun pointage enregistré.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Entrée</th>
                <th className="text-left px-4 py-2">Sortie</th>
                <th className="text-right px-4 py-2">Durée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-2 text-slate-700">{formatDateTime(h.pointage_in)}</td>
                  <td className="px-4 py-2 text-slate-700">
                    {h.pointage_out ? formatDateTime(h.pointage_out) : (
                      <span className="text-emerald-600 font-medium">En cours…</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {h.pointage_out ? `${diffHours(h.pointage_in, h.pointage_out).toFixed(1)}h` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
