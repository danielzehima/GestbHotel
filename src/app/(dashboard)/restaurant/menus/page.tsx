import Link from 'next/link';
import { Plus, BookOpen } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = { title: 'Menus — GestHotel' };

export default async function MenusPage() {
  const user = await requireRole(['admin', 'cuisine', 'serveur', 'receptionniste']);
  const supabase = await createClient();

  const { data: menus } = await supabase
    .from('menus')
    .select('id, nom, description, actif, menu_items(count)')
    .eq('hotel_id', user.profile.hotel_id!)
    .order('nom');

  const canManage = user.profile.role === 'admin' || user.profile.role === 'cuisine';

  return (
    <div>
      <PageHeader
        title="Cartes & Menus"
        description="Vos cartes de restaurant."
        actions={
          canManage && (
            <Link href="/restaurant/menus/new">
              <Button>
                <Plus className="w-4 h-4" />
                Nouveau menu
              </Button>
            </Link>
          )
        }
      />

      {!menus || menus.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Aucun menu"
          description="Créez votre première carte (ex : Carte midi, Petit-déjeuner, Boissons)."
          action={
            canManage && (
              <Link href="/restaurant/menus/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Nouveau menu
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {menus.map((m: any) => (
            <Link
              key={m.id}
              href={`/restaurant/menus/${m.id}`}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-400 hover:shadow transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{m.nom}</h3>
                  {m.description && <p className="text-sm text-slate-500 mt-1">{m.description}</p>}
                </div>
                {!m.actif && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">Inactif</span>
                )}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                {m.menu_items?.[0]?.count ?? 0} plat{(m.menu_items?.[0]?.count ?? 0) > 1 ? 's' : ''}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
