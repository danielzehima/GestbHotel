'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

export type PublicOrderResult =
  | { ok: true; numero: string }
  | { ok: false; error: string };

const schema = z.object({
  hotelSlug: z.string().min(1),
  qrCode: z.string().min(1),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        menu_item_id: z.string().uuid(),
        quantite: z.number().int().min(1).max(50),
        notes: z.string().max(200).optional()
      })
    )
    .min(1, 'Ajoutez au moins un plat')
    .max(50)
});

function genOrderNumber() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `CMD-${month}${day}-${rnd}`;
}

/**
 * Crée une commande passée par un client depuis la carte publique (QR de table).
 * Sécurité : aucune authentification, mais la table est validée par son QR + l'hôtel,
 * et les prix sont TOUJOURS recalculés côté serveur (jamais ceux envoyés par le client).
 */
export async function createPublicOrder(payload: unknown): Promise<PublicOrderResult> {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' };
  }
  const d = parsed.data;
  const sb = createAdminClient();

  // 1. Hôtel via slug (doit être actif)
  const { data: hotel } = await sb
    .from('hotels')
    .select('id, nom, actif, email')
    .eq('slug', d.hotelSlug)
    .maybeSingle();
  if (!hotel || !(hotel as any).actif) {
    return { ok: false, error: 'Restaurant indisponible pour le moment.' };
  }
  const hotelId = (hotel as any).id as string;

  // 2. Table via QR (doit appartenir à cet hôtel)
  const { data: table } = await sb
    .from('restaurant_tables')
    .select('id, numero')
    .eq('qr_code', d.qrCode)
    .eq('hotel_id', hotelId)
    .maybeSingle();
  if (!table) {
    return { ok: false, error: 'Table introuvable. Rescannez le QR code de votre table.' };
  }

  // 3. Recharger les plats côté serveur (prix de confiance + disponibilité)
  const ids = [...new Set(d.items.map((i) => i.menu_item_id))];
  const { data: dbItems } = await sb
    .from('menu_items')
    .select('id, nom, prix, disponible, hotel_id')
    .in('id', ids)
    .eq('hotel_id', hotelId);

  const priceMap = new Map<string, { prix: number; disponible: boolean }>();
  (dbItems ?? []).forEach((it: any) => {
    priceMap.set(it.id, { prix: Number(it.prix), disponible: !!it.disponible });
  });

  const lines: { menu_item_id: string; quantite: number; prix_unitaire: number; notes: string | null }[] = [];
  for (const it of d.items) {
    const dbItem = priceMap.get(it.menu_item_id);
    if (!dbItem) {
      return { ok: false, error: 'Un plat sélectionné n\'existe plus. Rafraîchissez la carte.' };
    }
    if (!dbItem.disponible) {
      return { ok: false, error: 'Un plat sélectionné n\'est plus disponible. Rafraîchissez la carte.' };
    }
    lines.push({
      menu_item_id: it.menu_item_id,
      quantite: it.quantite,
      prix_unitaire: dbItem.prix,
      notes: it.notes?.trim() || null
    });
  }

  const total = lines.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);

  // 4. Création de la commande (sur place, sans serveur — passée par le client)
  const { data: order, error: orderErr } = await sb
    .from('orders')
    .insert({
      hotel_id: hotelId,
      numero: genOrderNumber(),
      type: 'sur_place',
      statut: 'nouvelle',
      table_id: (table as any).id,
      serveur_id: null,
      total,
      notes: d.notes?.trim() || null
    })
    .select('id, numero')
    .single();

  if (orderErr || !order) {
    console.error('[public-order] insert order:', orderErr?.message);
    return { ok: false, error: 'Erreur lors de l\'envoi de la commande. Réessayez.' };
  }

  // 5. Lignes de commande
  const { error: itemsErr } = await sb.from('order_items').insert(
    lines.map((l) => ({
      order_id: (order as any).id,
      menu_item_id: l.menu_item_id,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
      notes: l.notes
    }))
  );

  if (itemsErr) {
    console.error('[public-order] insert items:', itemsErr.message);
    // Nettoyage : supprimer la commande orpheline
    await sb.from('orders').delete().eq('id', (order as any).id);
    return { ok: false, error: 'Erreur lors de l\'envoi de la commande. Réessayez.' };
  }

  // 6. Rafraîchir les vues côté hôtel
  revalidatePath('/restaurant/kitchen');
  revalidatePath('/restaurant/orders');
  revalidatePath('/restaurant');

  return { ok: true, numero: (order as any).numero };
}
