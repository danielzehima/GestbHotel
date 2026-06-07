'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export type ActionResult = { ok: true } | { ok: false; error: string };

// ── Règles de tarification ────────────────────────────────────────────────

const ruleSchema = z.object({
  nom: z.string().min(1, 'Nom requis').max(100),
  type: z.enum(['saison', 'weekend', 'promo']),
  room_type_id: z.string().uuid().optional().or(z.literal('')),
  date_debut: z.string().optional().or(z.literal('')),
  date_fin: z.string().optional().or(z.literal('')),
  days_of_week: z.string().optional(), // CSV ex: "0,5,6"
  modifier_pct: z.coerce.number().min(-100).max(500),
  priorite: z.coerce.number().int().default(0),
  actif: z.coerce.boolean().default(true)
});

export async function upsertPricingRule(formData: FormData, id?: string): Promise<ActionResult> {
  const user = await requireRole(['admin']);
  const parsed = ruleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const d = parsed.data;
  const days = d.days_of_week
    ? d.days_of_week.split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !isNaN(n))
    : null;

  const payload = {
    hotel_id: user.profile.hotel_id!,
    nom: d.nom,
    type: d.type,
    room_type_id: d.room_type_id || null,
    date_debut: d.date_debut || null,
    date_fin: d.date_fin || null,
    days_of_week: days,
    modifier_pct: d.modifier_pct,
    priorite: d.priorite,
    actif: d.actif ?? true
  };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from('pricing_rules').update(payload).eq('id', id)
    : await supabase.from('pricing_rules').insert(payload);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/tarification');
  return { ok: true };
}

export async function deletePricingRule(id: string): Promise<ActionResult> {
  await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase.from('pricing_rules').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/tarification');
  return { ok: true };
}

export async function togglePricingRule(id: string, actif: boolean): Promise<ActionResult> {
  await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase.from('pricing_rules').update({ actif }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/tarification');
  return { ok: true };
}

// ── Codes promo ───────────────────────────────────────────────────────────

const promoSchema = z.object({
  code: z.string().min(2, 'Code requis').max(50).toUpperCase(),
  description: z.string().max(200).optional().or(z.literal('')),
  discount_pct: z.coerce.number().min(0).max(100).optional(),
  discount_fixed: z.coerce.number().min(0).optional(),
  date_debut: z.string().optional().or(z.literal('')),
  date_fin: z.string().optional().or(z.literal('')),
  max_uses: z.coerce.number().int().min(1).optional().or(z.literal(''))
});

export async function upsertPromoCode(formData: FormData, id?: string): Promise<ActionResult> {
  const user = await requireRole(['admin']);
  const parsed = promoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const d = parsed.data;
  if (!d.discount_pct && !d.discount_fixed) {
    return { ok: false, error: 'Spécifiez un % de réduction ou un montant fixe.' };
  }

  const payload = {
    hotel_id: user.profile.hotel_id!,
    code: d.code,
    description: d.description || null,
    discount_pct: d.discount_pct ?? null,
    discount_fixed: d.discount_fixed ?? null,
    date_debut: d.date_debut || null,
    date_fin: d.date_fin || null,
    max_uses: d.max_uses ? Number(d.max_uses) : null,
    actif: true
  };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from('promo_codes').update(payload).eq('id', id)
    : await supabase.from('promo_codes').insert(payload);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/tarification');
  return { ok: true };
}

export async function deletePromoCode(id: string): Promise<ActionResult> {
  await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase.from('promo_codes').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/tarification');
  return { ok: true };
}

export async function togglePromoCode(id: string, actif: boolean): Promise<ActionResult> {
  await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase.from('promo_codes').update({ actif }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/tarification');
  return { ok: true };
}
