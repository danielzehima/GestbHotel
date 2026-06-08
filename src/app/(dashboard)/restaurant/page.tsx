import Link from 'next/link';
import { UtensilsCrossed, BookOpen, QrCode, ChefHat, ClipboardList } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import type { UserRole } from '@/types/database';

export const metadata = { title: 'Restaurant — GestHotel' };

const TILES: { href: string; label: string; icon: any; desc: string; roles: UserRole[] }[] = [
  { href: '/restaurant/menus', label: 'Cartes & Menus', icon: BookOpen, desc: 'Gérer plats et catégories',
    roles: ['admin', 'cuisine', 'serveur', 'receptionniste'] },
  { href: '/restaurant/tables', label: 'Tables (QR codes)', icon: QrCode, desc: 'Tables et QR clients',
    roles: ['admin', 'serveur', 'receptionniste'] },
  { href: '/restaurant/orders', label: 'Commandes', icon: ClipboardList, desc: 'Prise de commande & suivi',
    roles: ['admin', 'serveur', 'cuisine', 'receptionniste'] },
  { href: '/restaurant/kitchen', label: 'Cuisine', icon: ChefHat, desc: 'Vue temps réel des préparations',
    roles: ['admin', 'cuisine'] }
];

export default async function RestaurantHub() {
  const user = await requireRole(['admin', 'serveur', 'cuisine', 'receptionniste']);
  const tiles = TILES.filter((t) => t.roles.includes(user.profile.role));
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const [{ count: ordersToday }, { count: ordersPending }] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('hotel_id', user.profile.hotel_id!)
      .gte('created_at', today),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('hotel_id', user.profile.hotel_id!)
      .in('statut', ['nouvelle', 'en_preparation'])
  ]);

  return (
    <div>
      <PageHeader title="Restaurant" description="Gestion F&B complète." />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard label="Commandes du jour" value={ordersToday ?? 0} icon={UtensilsCrossed} tone="brand" />
        <StatCard label="En préparation" value={ordersPending ?? 0} icon={ChefHat} tone="amber" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-400 hover:shadow transition flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
              <t.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">{t.label}</div>
              <div className="text-sm text-slate-500">{t.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
