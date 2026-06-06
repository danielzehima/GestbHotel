'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { getPlanPrice } from '@/lib/plan-prices';
import { createPayment } from '@/lib/geniuspay';
import { PLAN_LABELS, type Plan } from '@/lib/plan';

export type StartPaymentResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gestb-hotel.vercel.app';

const schema = z.object({
  plan: z.enum(['basique', 'standard', 'premium']),
  months: z.coerce.number().int().min(1).max(12).default(1)
});

/**
 * Initie un paiement d'abonnement GeniusPay (mode checkout hébergé).
 * Renvoie l'URL de paiement ; le client est redirigé côté navigateur.
 * L'activation du forfait se fera UNIQUEMENT via le webhook signé.
 */
export async function startSubscriptionPayment(formData: FormData): Promise<StartPaymentResult> {
  const user = await requireRole(['admin']);
  if (!user.profile.hotel_id) {
    return { ok: false, error: 'Aucun hôtel associé à votre compte.' };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' };
  }
  const { plan, months } = parsed.data;

  // Prix officiel récupéré côté serveur (jamais depuis le client → anti-fraude)
  const monthly = await getPlanPrice(plan as Plan);
  if (!monthly || monthly < 200) {
    return { ok: false, error: 'Tarif du forfait indisponible. Réessayez plus tard.' };
  }
  const amount = monthly * months;

  const supabase = await createClient();

  // Infos hôtel pour le paiement
  const { data: hotel } = await supabase
    .from('hotels')
    .select('nom, telephone, email')
    .eq('id', user.profile.hotel_id)
    .single();

  let payment;
  try {
    payment = await createPayment({
      amount,
      currency: 'XOF',
      customer: {
        email: (hotel as any)?.email || user.email,
        phone: (hotel as any)?.telephone || undefined,
        name: (hotel as any)?.nom || undefined
      },
      metadata: {
        hotel_id: user.profile.hotel_id,
        plan,
        months
      },
      callbackUrl: `${APP_URL}/upgrade/retour`
    });
  } catch (e: any) {
    console.error('[geniuspay] createPayment failed:', e?.message);
    return { ok: false, error: "Impossible d'initier le paiement. Réessayez ou utilisez WhatsApp." };
  }

  const checkoutUrl = payment.checkout_url ?? payment.payment_url;
  if (!checkoutUrl) {
    return { ok: false, error: 'GeniusPay n\'a pas renvoyé d\'URL de paiement.' };
  }

  // Trace la tentative (statut pending). L'activation viendra du webhook.
  const { error: insertError } = await supabase.from('subscription_payments').insert({
    hotel_id: user.profile.hotel_id,
    plan,
    months,
    amount,
    currency: 'XOF',
    provider: 'geniuspay',
    reference: payment.reference,
    status: payment.status ?? 'pending',
    checkout_url: checkoutUrl
  });

  if (insertError) {
    // Le paiement est créé chez GeniusPay mais on n'a pas pu tracer : on log et on continue,
    // le webhook retrouvera la transaction via metadata.hotel_id.
    console.error('[geniuspay] insert subscription_payments failed:', insertError.message);
  }

  console.info(
    `[geniuspay] paiement initié — hôtel ${user.profile.hotel_id}, ${PLAN_LABELS[plan as Plan]} x${months}m, ${amount} XOF, ref ${payment.reference}`
  );

  return { ok: true, checkoutUrl };
}
