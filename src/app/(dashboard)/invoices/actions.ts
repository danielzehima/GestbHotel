'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { getHotelPlanLimits } from '@/lib/plan-limits';

const MOBILE_METHODS = ['wave', 'orange_money', 'mtn_money', 'moov_money'];

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function genInvoiceNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const rnd = Math.floor(Math.random() * 90000 + 10000);
  return `FAC-${y}${m}-${rnd}`;
}

// ----- LINE SCHEMA -----
const lineSchema = z.object({
  libelle: z.string().min(1),
  quantite: z.number().min(0.01),
  prix_unitaire: z.number().min(0),
  reference_type: z.string().optional(),
  reference_id: z.string().uuid().optional().nullable()
});

const invoiceSchema = z.object({
  guest_id: z.string().uuid().optional().nullable(),
  reservation_id: z.string().uuid().optional().nullable(),
  taxe: z.coerce.number().min(0).default(0),
  remise: z.coerce.number().min(0).default(0),
  date_echeance: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, 'Au moins une ligne')
});

function computeTotals(lines: { quantite: number; prix_unitaire: number }[], taxe: number, remise: number) {
  const sous_total = lines.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
  const total = Math.max(0, sous_total + taxe - remise);
  return { sous_total, total };
}

export async function createInvoice(payload: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole(['admin', 'receptionniste', 'comptable']);
  const parsed = invoiceSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  const supabase = await createClient();
  const { sous_total, total } = computeTotals(parsed.data.lines, parsed.data.taxe, parsed.data.remise);

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      hotel_id: user.profile.hotel_id!,
      numero: genInvoiceNumber(),
      reservation_id: parsed.data.reservation_id || null,
      guest_id: parsed.data.guest_id || null,
      statut: 'emise',
      sous_total,
      taxe: parsed.data.taxe,
      remise: parsed.data.remise,
      total,
      montant_paye: 0,
      date_echeance: parsed.data.date_echeance || null,
      notes: parsed.data.notes || null,
      created_by: user.profile.id
    })
    .select('id')
    .single();

  if (error || !invoice) return { ok: false, error: error?.message ?? 'Erreur' };

  const { error: linesErr } = await supabase.from('invoice_lines').insert(
    parsed.data.lines.map((l) => ({
      invoice_id: invoice.id,
      libelle: l.libelle,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
      reference_type: l.reference_type || null,
      reference_id: l.reference_id || null
    }))
  );

  if (linesErr) return { ok: false, error: linesErr.message };

  revalidatePath('/invoices');
  return { ok: true, data: { id: invoice.id } };
}

/**
 * Crée une facture à partir d'une réservation : récupère le séjour + les commandes
 * room service associées et génère les lignes.
 */
export async function createInvoiceFromReservation(reservationId: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole(['admin', 'receptionniste', 'comptable']);
  const supabase = await createClient();
  const hotelId = user.profile.hotel_id!;

  // 1. Récupérer la réservation
  const { data: res } = await supabase
    .from('reservations')
    .select(`id, guest_id, date_arrivee, date_depart, prix_total, acompte,
             room:rooms(numero, room_type:room_types(libelle))`)
    .eq('id', reservationId)
    .eq('hotel_id', hotelId)
    .single();

  if (!res) return { ok: false, error: 'Réservation introuvable' };

  const r = res as any;
  const nights = Math.max(1, Math.round(
    (new Date(r.date_depart).getTime() - new Date(r.date_arrivee).getTime()) / 86400000
  ));

  const lines: any[] = [
    {
      libelle: `Séjour chambre ${r.room?.numero ?? ''} (${r.room?.room_type?.libelle ?? ''}) — ${nights} nuit(s)`,
      quantite: 1,
      prix_unitaire: Number(r.prix_total),
      reference_type: 'reservation',
      reference_id: r.id
    }
  ];

  // 2. Récupérer les commandes liées à la réservation
  const { data: orders } = await supabase
    .from('orders')
    .select('id, numero, total, type')
    .eq('hotel_id', hotelId)
    .eq('reservation_id', reservationId)
    .neq('statut', 'annulee');

  (orders ?? []).forEach((o: any) => {
    lines.push({
      libelle: `Commande ${o.numero} (${o.type})`,
      quantite: 1,
      prix_unitaire: Number(o.total),
      reference_type: 'order',
      reference_id: o.id
    });
  });

  // 3. Vérifier qu'aucune facture active n'existe déjà pour cette réservation
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('reservation_id', reservationId)
    .neq('statut', 'annulee')
    .limit(1);

  if (existing && existing.length > 0) {
    return { ok: false, error: 'Une facture existe déjà pour cette réservation.' };
  }

  // 4. Calcul des totaux (acompte déduit en remise)
  const acompte = Number(r.acompte) || 0;
  const { sous_total, total } = computeTotals(lines, 0, acompte);

  // 5. Insertion facture
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      hotel_id: hotelId,
      numero: genInvoiceNumber(),
      reservation_id: r.id,
      guest_id: r.guest_id,
      statut: 'emise',
      sous_total,
      taxe: 0,
      remise: acompte,
      total,
      montant_paye: 0,
      created_by: user.profile.id
    })
    .select('id')
    .single();

  if (invErr || !invoice) return { ok: false, error: invErr?.message ?? 'Erreur création facture' };

  // 6. Insertion des lignes
  const { error: linesErr } = await supabase.from('invoice_lines').insert(
    lines.map((l) => ({ ...l, invoice_id: invoice.id }))
  );
  if (linesErr) return { ok: false, error: linesErr.message };

  // 7. Enregistrer l'acompte comme paiement initial
  if (acompte > 0) {
    await supabase.from('payments').insert({
      hotel_id: hotelId,
      invoice_id: invoice.id,
      reservation_id: r.id,
      methode: 'especes',
      statut: 'reussi',
      montant: acompte,
      reference_transaction: 'Acompte réservation',
      encaisse_par: user.profile.id
    });

    const nouveauStatut = acompte >= total ? 'payee' : 'partiellement_payee';
    await supabase
      .from('invoices')
      .update({ montant_paye: acompte, statut: nouveauStatut })
      .eq('id', invoice.id);
  }

  revalidatePath('/invoices');
  return { ok: true, data: { id: invoice.id } };
}

// ----- PAYMENTS -----

const paymentSchema = z.object({
  invoice_id: z.string().uuid(),
  methode: z.enum(['especes', 'carte', 'wave', 'orange_money', 'mtn_money', 'moov_money', 'virement']),
  montant: z.coerce.number().min(0.01),
  reference_transaction: z.string().optional()
});

export async function recordPayment(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(['admin', 'receptionniste', 'comptable']);
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalide' };

  // Garde-fou forfait : Mobile Money réservé aux forfaits qui l'incluent (Standard+)
  if (MOBILE_METHODS.includes(parsed.data.methode)) {
    const { limits } = await getHotelPlanLimits(user.profile.hotel_id!);
    if (!limits.mobileMoney) {
      return {
        ok: false,
        error: "Le paiement Mobile Money (Wave/OM/MTN/Moov) n'est pas inclus dans votre forfait. Passez au forfait Standard pour l'activer."
      };
    }
  }

  const supabase = await createClient();

  // 1. Récupérer la facture
  const { data: inv } = await supabase
    .from('invoices')
    .select('id, total, montant_paye, reservation_id')
    .eq('id', parsed.data.invoice_id)
    .eq('hotel_id', user.profile.hotel_id!)
    .single();

  if (!inv) return { ok: false, error: 'Facture introuvable' };

  // 2. Insérer le paiement
  const { error: payErr } = await supabase.from('payments').insert({
    hotel_id: user.profile.hotel_id!,
    invoice_id: parsed.data.invoice_id,
    reservation_id: (inv as any).reservation_id,
    methode: parsed.data.methode,
    statut: 'reussi',
    montant: parsed.data.montant,
    reference_transaction: parsed.data.reference_transaction || null,
    encaisse_par: user.profile.id
  });

  if (payErr) return { ok: false, error: payErr.message };

  // 3. Mettre à jour la facture
  const nouveauPaye = Number((inv as any).montant_paye) + parsed.data.montant;
  const total = Number((inv as any).total);
  const nouveauStatut = nouveauPaye >= total ? 'payee' : 'partiellement_payee';

  await supabase
    .from('invoices')
    .update({
      montant_paye: nouveauPaye,
      statut: nouveauStatut
    })
    .eq('id', parsed.data.invoice_id);

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${parsed.data.invoice_id}`);
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function cancelInvoice(id: string): Promise<ActionResult> {
  await requireRole(['admin', 'comptable']);
  const supabase = await createClient();
  const { error } = await supabase
    .from('invoices')
    .update({ statut: 'annulee' })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/invoices');
  revalidatePath(`/invoices/${id}`);
  return { ok: true };
}
