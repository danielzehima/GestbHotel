import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookSignature, type GeniusPayStatus } from '@/lib/geniuspay';
import { sendSubscriptionReceiptEmail } from '@/lib/email';
import { PLAN_LABELS, type Plan } from '@/lib/plan';

// crypto (HMAC) → runtime Node, et jamais de cache
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook GeniusPay — SOURCE DE VÉRITÉ pour l'activation des abonnements.
 *
 * Sécurité :
 *  - Vérifie la signature HMAC-SHA256 (header X-Webhook-Signature)
 *  - Rejette les webhooks > 5 min (anti-replay)
 *  - Idempotent : un paiement n'active le forfait qu'une seule fois (flag `applied`)
 */
export async function POST(req: Request) {
  const rawBody = await req.text();

  const verdict = verifyWebhookSignature({
    rawBody,
    signature: req.headers.get('x-webhook-signature'),
    timestamp: req.headers.get('x-webhook-timestamp')
  });
  if (!verdict.ok) {
    console.warn('[geniuspay webhook] rejeté:', verdict.error);
    return NextResponse.json({ error: verdict.error }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const event: string = payload.event ?? '';
  const data = payload.data ?? {};
  const metadata = data.metadata ?? payload.metadata ?? {};
  const reference: string | undefined = data.reference;
  const newStatus: GeniusPayStatus = (data.status ?? mapEventToStatus(event)) as GeniusPayStatus;

  if (!reference) {
    return NextResponse.json({ error: 'Référence absente' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Retrouve la tentative de paiement
  const { data: payment } = await supabase
    .from('subscription_payments')
    .select('*')
    .eq('reference', reference)
    .maybeSingle();

  // Fallback : si l'insert initial avait échoué, on reconstruit depuis metadata
  let row: any = payment;
  if (!row) {
    const hotel_id = metadata.hotel_id;
    const plan = metadata.plan;
    const months = Number(metadata.months ?? 1);
    if (hotel_id && plan) {
      const { data: created } = await supabase
        .from('subscription_payments')
        .insert({
          hotel_id,
          plan,
          months,
          amount: Number(data.amount ?? 0),
          currency: data.currency ?? 'XOF',
          provider: 'geniuspay',
          reference,
          status: newStatus
        })
        .select('*')
        .single();
      row = created;
    }
  }

  if (!row) {
    // Rien à faire mais on renvoie 200 pour éviter que GeniusPay ne réessaie indéfiniment
    console.warn('[geniuspay webhook] paiement introuvable pour ref', reference);
    return NextResponse.json({ received: true });
  }

  // Met à jour le statut + environnement
  const isSuccess = event === 'payment.success' || newStatus === 'completed';
  await supabase
    .from('subscription_payments')
    .update({
      status: isSuccess ? 'completed' : newStatus,
      environment: req.headers.get('x-webhook-environment') ?? row.environment,
      paid_at: isSuccess ? new Date().toISOString() : row.paid_at
    })
    .eq('id', row.id);

  // Activation du forfait — UNE SEULE FOIS (idempotence via `applied`)
  if (isSuccess && !row.applied) {
    const months = Number(row.months ?? 1);

    // Renouvellement anticipé : on prolonge depuis l'expiration en cours si encore valide
    const { data: hotel } = await supabase
      .from('hotels')
      .select('plan, plan_expires_at, email, nom')
      .eq('id', row.hotel_id)
      .single();

    const now = new Date();
    const current = (hotel as any)?.plan_expires_at ? new Date((hotel as any).plan_expires_at) : null;
    const base = current && current > now ? current : now;
    const expires = new Date(base);
    expires.setMonth(expires.getMonth() + months);

    const { error: activationError } = await supabase
      .from('hotels')
      .update({ plan: row.plan, plan_expires_at: expires.toISOString() })
      .eq('id', row.hotel_id);

    if (activationError) {
      console.error('[geniuspay webhook] activation échouée:', activationError.message);
      // On renvoie 500 pour que GeniusPay réessaie le webhook
      return NextResponse.json({ error: 'Activation échouée' }, { status: 500 });
    }

    await supabase.from('subscription_payments').update({ applied: true }).eq('id', row.id);

    console.info(
      `[geniuspay webhook] forfait activé — hôtel ${row.hotel_id}, ${PLAN_LABELS[row.plan as Plan]}, expire ${expires.toISOString()}`
    );

    // Reçu par email (non bloquant)
    const email = (hotel as any)?.email;
    if (email) {
      sendSubscriptionReceiptEmail({
        to: email,
        hotelNom: (hotel as any)?.nom ?? '',
        plan: row.plan as Exclude<Plan, 'trial'>,
        months,
        amount: Number(row.amount),
        reference,
        expiresAt: expires
      }).catch((e) => console.error('[geniuspay webhook] email reçu:', e?.message));
    }
  }

  return NextResponse.json({ received: true });
}

function mapEventToStatus(event: string): GeniusPayStatus {
  switch (event) {
    case 'payment.success':
      return 'completed';
    case 'payment.failed':
      return 'failed';
    case 'payment.cancelled':
      return 'cancelled';
    case 'payment.refunded':
      return 'refunded';
    case 'payment.expired':
      return 'expired';
    default:
      return 'pending';
  }
}
