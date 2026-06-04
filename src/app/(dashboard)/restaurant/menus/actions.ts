'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export type ActionResult = { ok: true; data?: { id: string } } | { ok: false; error: string };

// ----- MENUS -----

const menuSchema = z.object({
  nom: z.string().min(1).max(100),
  description: z.string().optional(),
  actif: z.coerce.boolean().optional()
});

export async function upsertMenu(formData: FormData, id?: string): Promise<ActionResult> {
  const user = await requireRole(['admin', 'cuisine']);
  const parsed = menuSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();
  const payload = {
    hotel_id: user.profile.hotel_id!,
    nom: parsed.data.nom,
    description: parsed.data.description || null,
    actif: parsed.data.actif ?? true
  };

  const { data, error } = id
    ? await supabase.from('menus').update(payload).eq('id', id).select('id').single()
    : await supabase.from('menus').insert(payload).select('id').single();

  if (error) return { ok: false, error: error.message };
  revalidatePath('/restaurant/menus');
  return { ok: true, data: data ?? undefined };
}

export async function deleteMenu(id: string): Promise<ActionResult> {
  await requireRole(['admin']);
  const supabase = await createClient();
  const { error } = await supabase.from('menus').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/restaurant/menus');
  return { ok: true };
}

// ----- MENU ITEMS -----

const itemSchema = z.object({
  menu_id: z.string().uuid(),
  nom: z.string().min(1).max(150),
  description: z.string().optional(),
  categorie: z.enum(['entree', 'plat', 'dessert', 'boisson', 'petit_dejeuner', 'menu_enfant', 'special']),
  prix: z.coerce.number().min(0),
  allergenes: z.string().optional(),
  disponible: z.coerce.boolean().optional(),
  temps_preparation_min: z.coerce.number().int().min(0).max(180).optional(),
  ordre: z.coerce.number().int().optional()
});

export async function upsertMenuItem(formData: FormData, id?: string): Promise<ActionResult> {
  const user = await requireRole(['admin', 'cuisine']);
  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();
  const allergenes = parsed.data.allergenes
    ?.split(',')
    .map((a) => a.trim())
    .filter(Boolean) ?? [];

  const payload = {
    hotel_id: user.profile.hotel_id!,
    menu_id: parsed.data.menu_id,
    nom: parsed.data.nom,
    description: parsed.data.description || null,
    categorie: parsed.data.categorie,
    prix: parsed.data.prix,
    allergenes,
    disponible: parsed.data.disponible ?? true,
    temps_preparation_min: parsed.data.temps_preparation_min ?? null,
    ordre: parsed.data.ordre ?? 0
  };

  const { error } = id
    ? await supabase.from('menu_items').update(payload).eq('id', id)
    : await supabase.from('menu_items').insert(payload);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/restaurant/menus');
  revalidatePath(`/restaurant/menus/${parsed.data.menu_id}`);
  return { ok: true };
}

export async function toggleItemAvailability(id: string, disponible: boolean): Promise<ActionResult> {
  await requireRole(['admin', 'cuisine']);
  const supabase = await createClient();
  const { error } = await supabase.from('menu_items').update({ disponible }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/restaurant/menus');
  return { ok: true };
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  await requireRole(['admin', 'cuisine']);
  const supabase = await createClient();
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/restaurant/menus');
  return { ok: true };
}
