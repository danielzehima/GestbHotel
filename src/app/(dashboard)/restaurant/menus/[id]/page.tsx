import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, BookOpen } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney } from '@/lib/utils/format';
import { MenuItemRow } from './menu-item-row';

export const metadata = { title: 'Menu — GestHotel' };

const CATEGORIE_LABELS: Record<string, string> = {
  entree: 'Entrées',
  plat: 'Plats',
  dessert: 'Desserts',
  boisson: 'Boissons',
  petit_dejeuner: 'Petit-déjeuner',
  menu_enfant: 'Menu enfant',
  special: 'Spéciaux'
};

const CATEGORIE_ORDER = ['petit_dejeuner', 'entree', 'plat', 'dessert', 'menu_enfant', 'boisson', 'special'];

export default async function MenuDetailPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: menu }, { data: items }] = await Promise.all([
    supabase
      .from('menus')
      .select('*')
      .eq('id', id)
      .eq('hotel_id', user.profile.hotel_id!)
      .single(),
    supabase
      .from('menu_items')
      .select('*')
      .eq('menu_id', id)
      .order('ordre')
      .order('nom')
  ]);

  if (!menu) notFound();
  const canManage = user.profile.role === 'admin' || user.profile.role === 'cuisine';

  // Grouper par catégorie
  const grouped = new Map<string, any[]>();
  (items ?? []).forEach((it) => {
    const cat = it.categorie;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(it);
  });

  const m = menu as any;

  return (
    <div>
      <Link
        href="/restaurant/menus"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Tous les menus
      </Link>

      <PageHeader
        title={m.nom}
        description={m.description ?? undefined}
        actions={
          canManage && (
            <>
              <Link href={`/restaurant/menus/${id}/edit`}>
                <Button variant="secondary">
                  <Pencil className="w-4 h-4" />
                  Modifier
                </Button>
              </Link>
              <Link href={`/restaurant/menus/${id}/items/new`}>
                <Button>
                  <Plus className="w-4 h-4" />
                  Ajouter un plat
                </Button>
              </Link>
            </>
          )
        }
      />

      {(!items || items.length === 0) ? (
        <EmptyState
          icon={BookOpen}
          title="Aucun plat dans ce menu"
          action={
            canManage && (
              <Link href={`/restaurant/menus/${id}/items/new`}>
                <Button>
                  <Plus className="w-4 h-4" />
                  Ajouter un plat
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          {CATEGORIE_ORDER.filter((c) => grouped.has(c)).map((cat) => (
            <section key={cat}>
              <h2 className="font-bold text-slate-900 mb-2 text-lg">{CATEGORIE_LABELS[cat]}</h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {grouped.get(cat)!.map((item: any) => (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    menuId={id}
                    canManage={canManage}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
