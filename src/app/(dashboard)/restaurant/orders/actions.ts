'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import type { OrderStatus } from '@/types/database';

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const itemSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantite: z.number().int().min(1),
  prix_unitaire: z.number().min(0),
  notes: z.string().optional()
});

const orderSchema = z.object({
  type: z.enum(['sur_place', 'room_service', 'a_emporter']),
  table_id: z.string().uuid().optional().nullable(),
  reservation_id: z.string().uuid().optional().nullable(),
  room_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Au moins un plat')
});

function genOrderNumber() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `CMD-${month}${day}-${rnd}`;
}

export async function createOrder(payload: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole(['admin', 'serveur', 'cuisine', 'receptionniste']);
  const parsed = orderSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();
  const total = parsed.data.items.reduce((sum, it) => sum + it.quantite * it.prix_unitaire, 0);

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      hotel_id: user.profile.hotel_id!,
      numero: genOrderNumber(),
      type: parsed.data.type,
      statut: 'nouvelle',
      table_id: parsed.data.table_id || null,
      reservation_id: parsed.data.reservation_id || null,
      room_id: parsed.data.room_id || null,
      serveur_id: user.profile.id,
      total,
      notes: parsed.data.notes || null
    })
    .select('id')
    .single();

  if (error || !order) return { ok: false, error: error?.message ?? 'Erreur' };

  const { error: itemErr } = await supabase.from('order_items').insert(
    parsed.data.items.map((it) => ({
      order_id: order.id,
      menu_item_id: it.menu_item_id,
      quantite: it.quantite,
      prix_unitaire: it.prix_unitaire,
      notes: it.notes || null
    }))
  );

  if (itemErr) return { ok: false, error: itemErr.message };

  revalidatePath('/restaurant/orders');
  revalidatePath('/restaurant/kitchen');
  revalidatePath('/restaurant');
  return { ok: true, data: { id: order.id } };
}

export async function updateOrderStatus(id: string, statut: OrderStatus): Promise<ActionResult> {
  await requireRole(['admin', 'serveur', 'cuisine', 'receptionniste']);
  const supabase = await createClient();
  const { error } = await supabase.from('orders').update({ statut }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/restaurant/orders');
  revalidatePath('/restaurant/kitchen');
  revalidatePath('/restaurant');
  return { ok: true };
}

export async function resolveServiceCall(id: string): Promise<ActionResult> {
  const user = await requireRole(['admin', 'serveur', 'cuisine', 'receptionniste']);
  const supabase = await createClient();
  const { error } = await supabase
    .from('service_calls')
    .update({ statut: 'traite', handled_at: new Date().toISOString(), handled_by: user.profile.id })
    .eq('id', id)
    .eq('hotel_id', user.profile.hotel_id!);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/restaurant/kitchen');
  revalidatePath('/restaurant');
  return { ok: true };
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  await requireRole(['admin', 'serveur', 'receptionniste']);
  const supabase = await createClient();
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/restaurant/orders');
  return { ok: true };
}
