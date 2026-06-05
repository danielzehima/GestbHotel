import Link from 'next/link';
import { Plus, Layers } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney } from '@/lib/utils/format';
import { ROOM_TYPE_LABELS } from '@/types/domain';
import { DeleteRoomTypeButton } from './delete-button';

export const metadata = { title: 'Types de chambres — GestHotel' };

export default async function RoomTypesPage() {
  const user = await requireRole(['admin', 'receptionniste']);
  const supabase = await createClient();

  const { data: types } = await supabase
    .from('room_types')
    .select('*')
    .eq('hotel_id', user.profile.hotel_id!)
    .order('libelle');

  const canDelete = user.profile.role === 'admin';

  return (
    <div>
      <PageHeader
        title="Types de chambres"
        description="Définissez vos catégories tarifaires."
        actions={
          <>
            <Link href="/rooms/bulk">
              <Button variant="secondary">
                <Plus className="w-4 h-4" />
                Créer N chambres
              </Button>
            </Link>
            <Link href="/rooms/types/new">
              <Button>
                <Plus className="w-4 h-4" />
                Nouveau type
              </Button>
            </Link>
          </>
        }
      />

      {!types || types.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Aucun type défini"
          description="Créez vos types (simple, double, suite…) avec prix et capacité avant d'ajouter des chambres."
          action={
            <Link href="/rooms/types/new">
              <Button>
                <Plus className="w-4 h-4" />
                Créer un type
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3">Libellé</th>
                <th className="text-left px-4 py-3">Catégorie</th>
                <th className="text-left px-4 py-3">Capacité</th>
                <th className="text-right px-4 py-3">Prix / nuit</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {types.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{t.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{t.libelle}</td>
                  <td className="px-4 py-3 text-slate-600">{ROOM_TYPE_LABELS[t.type as keyof typeof ROOM_TYPE_LABELS]}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.capacite_adultes} adulte{t.capacite_adultes > 1 ? 's' : ''}
                    {t.capacite_enfants > 0 && ` + ${t.capacite_enfants} enf.`}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatMoney(Number(t.prix_nuit))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/rooms/bulk?type=${t.id}`}
                        className="text-emerald-600 hover:underline text-xs font-medium"
                      >
                        + Chambres
                      </Link>
                      <Link
                        href={`/rooms/types/${t.id}/edit`}
                        className="text-brand-600 hover:underline text-xs font-medium"
                      >
                        Modifier
                      </Link>
                      {canDelete && <DeleteRoomTypeButton id={t.id} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
