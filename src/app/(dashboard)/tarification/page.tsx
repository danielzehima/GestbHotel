import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { PricingClient } from './pricing-client';
import { Tag } from 'lucide-react';

export const metadata = { title: 'Tarification — GestHotel' };
export const dynamic = 'force-dynamic';

export default async function TarificationPage() {
  const user = await requireRole(['admin']);

  const supabase = await createClient();

  const [{ data: rules }, { data: promoCodes }, { data: roomTypes }] = await Promise.all([
    supabase
      .from('pricing_rules')
      .select('id, nom, type, room_type_id, date_debut, date_fin, days_of_week, modifier_pct, priorite, actif')
      .eq('hotel_id', user.profile.hotel_id!)
      .order('priorite', { ascending: false }),
    supabase
      .from('promo_codes')
      .select('id, code, description, discount_pct, discount_fixed, date_debut, date_fin, max_uses, uses_count, actif')
      .eq('hotel_id', user.profile.hotel_id!)
      .order('created_at', { ascending: false }),
    supabase
      .from('room_types')
      .select('id, libelle')
      .eq('hotel_id', user.profile.hotel_id!)
      .order('libelle')
  ]);

  return (
    <div>
      <PageHeader
        title="Tarification avancée"
        description="Définissez des règles de prix saisonniers, week-end et promotions. Créez des codes promo pour vos clients."
      />

      {/* Info bulle */}
      <div className="mb-6 bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm text-brand-800 flex gap-3">
        <Tag className="w-5 h-5 shrink-0 mt-0.5 text-brand-600" />
        <div>
          <strong>Comment ça marche ?</strong> Les règles s'appliquent automatiquement sur votre page de réservation en ligne.
          Le prix affiché aux clients intègre les règles actives nuit par nuit.
          Les règles de même type avec la priorité la plus élevée prennent le dessus.
        </div>
      </div>

      <PricingClient
        rules={(rules ?? []) as any}
        promoCodes={(promoCodes ?? []) as any}
        roomTypes={(roomTypes ?? []) as any}
      />
    </div>
  );
}
