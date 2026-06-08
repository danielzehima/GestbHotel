import { notFound } from 'next/navigation';
import { Hotel, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { MenuOrder, type MenuCategory } from './menu-order';

export const metadata = { title: 'Carte du restaurant' };
export const revalidate = 60;

const CAT_LABELS: Record<string, string> = {
  petit_dejeuner: '🥐 Petit-déjeuner',
  entree: '🥗 Entrées',
  plat: '🍽️ Plats',
  dessert: '🍰 Desserts',
  boisson: '🥤 Boissons',
  menu_enfant: '🧒 Menu enfant',
  special: '⭐ Spéciaux'
};

const CAT_ORDER = ['petit_dejeuner', 'entree', 'plat', 'dessert', 'menu_enfant', 'boisson', 'special'];

export default async function PublicMenuPage(props: {
  params: Promise<{ hotelSlug: string; qrCode: string }>;
}) {
  const { hotelSlug, qrCode } = await props.params;
  const supabase = await createClient();

  // 1. Hôtel via slug
  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, nom, slug, devise, logo_url')
    .eq('slug', hotelSlug)
    .single();

  if (!hotel) notFound();

  // 2. Table via QR
  const { data: table } = await supabase
    .from('restaurant_tables')
    .select('id, numero, zone, hotel_id')
    .eq('qr_code', qrCode)
    .eq('hotel_id', (hotel as any).id)
    .single();

  if (!table) notFound();

  // 3. Menus + items actifs
  const { data: menus } = await supabase
    .from('menus')
    .select('id, nom, description, menu_items(id, nom, description, categorie, prix, allergenes, temps_preparation_min, ordre, disponible)')
    .eq('hotel_id', (hotel as any).id)
    .eq('actif', true);

  const allItems: any[] = [];
  (menus ?? []).forEach((m: any) => {
    (m.menu_items ?? []).forEach((i: any) => {
      if (i.disponible) allItems.push(i);
    });
  });

  const grouped = new Map<string, any[]>();
  allItems.forEach((i) => {
    if (!grouped.has(i.categorie)) grouped.set(i.categorie, []);
    grouped.get(i.categorie)!.push(i);
  });

  const h = hotel as any;
  const t = table as any;
  const tableLabel = `Table ${t.numero}${t.zone ? ` · ${t.zone}` : ''}`;

  // Catégories ordonnées pour le composant de commande
  const categories: MenuCategory[] = CAT_ORDER.filter((c) => grouped.has(c)).map((cat) => ({
    cat,
    label: CAT_LABELS[cat] ?? cat,
    items: grouped.get(cat)!.map((i: any) => ({
      id: i.id,
      nom: i.nom,
      description: i.description ?? null,
      prix: Number(i.prix),
      allergenes: Array.isArray(i.allergenes) ? i.allergenes : [],
      temps_preparation_min: i.temps_preparation_min ?? null
    }))
  }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {h.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={h.logo_url} alt={h.nom} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
              <Hotel className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 truncate">{h.nom}</h1>
            <p className="text-xs text-slate-500">
              Table {t.numero}{t.zone && ` · ${t.zone}`}
            </p>
          </div>
        </div>
      </header>

      {categories.length === 0 ? (
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
            <p className="font-medium text-amber-900">Carte indisponible pour le moment</p>
            <p className="text-sm text-amber-700 mt-1">Demandez à votre serveur.</p>
          </div>
        </div>
      ) : (
        <MenuOrder
          categories={categories}
          hotelSlug={hotelSlug}
          qrCode={qrCode}
          devise={h.devise ?? 'XOF'}
          tableLabel={tableLabel}
        />
      )}
    </main>
  );
}
