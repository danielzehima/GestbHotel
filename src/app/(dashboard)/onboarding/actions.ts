'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export type OnboardingResult = { ok: true } | { ok: false; error: string };

// ── Étape 1 : Infos hôtel ──────────────────────────────────────────────────

const hotelStepSchema = z.object({
  nom: z.string().min(1, 'Nom requis').max(150),
  slug: z
    .string()
    .min(2, 'Slug requis (min 2 caractères)')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug : lettres minuscules, chiffres et tirets uniquement'),
  ville: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().optional()
});

export async function saveOnboardingHotel(formData: FormData): Promise<OnboardingResult> {
  const user = await requireRole(['admin']);
  const parsed = hotelStepSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();

  // Vérifier unicité du slug (sauf si déjà le sien)
  const { data: existing } = await supabase
    .from('hotels')
    .select('id')
    .eq('slug', parsed.data.slug)
    .neq('id', user.profile.hotel_id!)
    .maybeSingle();

  if (existing) return { ok: false, error: 'Ce slug est déjà utilisé. Choisissez-en un autre.' };

  const { error } = await supabase
    .from('hotels')
    .update({
      nom: parsed.data.nom,
      slug: parsed.data.slug,
      ville: parsed.data.ville || null,
      email: parsed.data.email || null,
      telephone: parsed.data.telephone || null
    })
    .eq('id', user.profile.hotel_id!);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/', 'layout');
  return { ok: true };
}

// ── Étape 2 : Premier type de chambre ─────────────────────────────────────

const roomStepSchema = z.object({
  libelle: z.string().min(1, 'Libellé requis').max(100),
  type: z.enum(['simple', 'double', 'twin', 'suite', 'familiale', 'deluxe']),
  capacite_adultes: z.coerce.number().int().min(1).max(10),
  prix_nuit: z.coerce.number().min(0, 'Prix requis'),
  numero_chambre: z.string().min(1, 'Numéro de chambre requis').max(20)
});

export async function saveOnboardingRoom(formData: FormData): Promise<OnboardingResult> {
  const user = await requireRole(['admin']);
  const parsed = roomStepSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();

  // Crée le type de chambre
  const { data: roomType, error: rtErr } = await supabase
    .from('room_types')
    .insert({
      hotel_id: user.profile.hotel_id!,
      code: parsed.data.libelle.toUpperCase().slice(0, 20).replace(/\s+/g, '_'),
      libelle: parsed.data.libelle,
      type: parsed.data.type,
      capacite_adultes: parsed.data.capacite_adultes,
      capacite_enfants: 0,
      prix_nuit: parsed.data.prix_nuit,
      equipements: []
    })
    .select('id')
    .single();

  if (rtErr || !roomType) return { ok: false, error: rtErr?.message ?? 'Erreur type de chambre' };

  // Crée la première chambre
  const { error: rErr } = await supabase.from('rooms').insert({
    hotel_id: user.profile.hotel_id!,
    numero: parsed.data.numero_chambre,
    room_type_id: (roomType as any).id,
    statut: 'disponible'
  });

  if (rErr) return { ok: false, error: rErr.message };

  revalidatePath('/rooms');
  return { ok: true };
}

// ── Étape 3 : Marquer l'onboarding comme terminé ──────────────────────────

export async function completeOnboarding(): Promise<OnboardingResult> {
  const user = await requireRole(['admin']);
  const supabase = await createClient();

  // Lire les parametres existants pour merger (ne pas écraser)
  const { data: hotel } = await supabase
    .from('hotels')
    .select('parametres')
    .eq('id', user.profile.hotel_id!)
    .single();

  const existingParams = (hotel as any)?.parametres ?? {};

  const { error } = await supabase
    .from('hotels')
    .update({
      parametres: {
        ...existingParams,
        onboarding_done: true
      }
    })
    .eq('id', user.profile.hotel_id!);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/', 'layout');
  return { ok: true };
}
