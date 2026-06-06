import crypto from 'crypto';

/**
 * Client GeniusPay (https://pay.genius.ci/docs/api) — paiements d'abonnement SaaS.
 *
 * ⚠️ SERVEUR UNIQUEMENT. La clé secrète (X-API-Secret) ne doit JAMAIS être exposée au client.
 *
 * Variables d'env requises :
 *   - GENIUSPAY_API_KEY        : clé publique  (pk_sandbox_... ou pk_live_...)
 *   - GENIUSPAY_API_SECRET     : clé secrète   (sk_sandbox_... ou sk_live_...)
 *   - GENIUSPAY_WEBHOOK_SECRET : secret de signature des webhooks
 *   - GENIUSPAY_BASE_URL       : (optionnel) défaut https://pay.genius.ci/api/v1
 */

const BASE_URL = process.env.GENIUSPAY_BASE_URL ?? 'https://pay.genius.ci/api/v1';

export type GeniusPayStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'expired';

export type CreatePaymentInput = {
  amount: number;
  currency?: string; // défaut XOF
  customer?: { phone?: string; email?: string; name?: string };
  metadata?: Record<string, string | number>;
  /** URL où GeniusPay renvoie le client après paiement (mode checkout) */
  callbackUrl?: string;
  /** Omettre pour la page checkout hébergée (recommandé) */
  paymentMethod?: 'wave' | 'orange_money' | 'mtn_money' | 'pawapay' | 'card';
};

export type CreatePaymentResult = {
  id: string;
  reference: string;
  status: GeniusPayStatus;
  /** Page de paiement hébergée (mode checkout) */
  checkout_url?: string;
  /** URL de paiement direct (si payment_method spécifié) */
  payment_url?: string;
};

function getCredentials() {
  const apiKey = process.env.GENIUSPAY_API_KEY;
  const apiSecret = process.env.GENIUSPAY_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error(
      'GENIUSPAY_API_KEY / GENIUSPAY_API_SECRET manquantes. Ajoutez-les dans .env.local.'
    );
  }
  return { apiKey, apiSecret };
}

function headers() {
  const { apiKey, apiSecret } = getCredentials();
  return {
    'X-API-Key': apiKey,
    'X-API-Secret': apiSecret,
    'Content-Type': 'application/json'
  };
}

/**
 * Crée un paiement. En mode checkout (paymentMethod omis), GeniusPay renvoie
 * un checkout_url vers lequel rediriger le client.
 */
export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const body: Record<string, unknown> = {
    amount: input.amount,
    currency: input.currency ?? 'XOF'
  };
  if (input.paymentMethod) body.payment_method = input.paymentMethod;
  if (input.customer) body.customer = input.customer;
  if (input.metadata) body.metadata = input.metadata;
  if (input.callbackUrl) {
    // GeniusPay accepte une URL de retour ; on couvre les noms de champs courants.
    body.callback_url = input.callbackUrl;
    body.return_url = input.callbackUrl;
  }

  const res = await fetch(`${BASE_URL}/merchant/payments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as any)?.message ?? (json as any)?.error ?? `HTTP ${res.status}`;
    throw new Error(`GeniusPay createPayment: ${msg}`);
  }

  // La réponse peut être enveloppée dans { data: {...} } selon l'API.
  const d = (json as any)?.data ?? json;
  return {
    id: String(d.id),
    reference: String(d.reference),
    status: (d.status ?? 'pending') as GeniusPayStatus,
    checkout_url: d.checkout_url ?? undefined,
    payment_url: d.payment_url ?? undefined
  };
}

/** Récupère le statut d'un paiement par sa référence (MTX-...). */
export async function getPayment(reference: string): Promise<{ status: GeniusPayStatus; raw: any }> {
  const res = await fetch(`${BASE_URL}/merchant/payments/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: headers(),
    cache: 'no-store'
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as any)?.message ?? (json as any)?.error ?? `HTTP ${res.status}`;
    throw new Error(`GeniusPay getPayment: ${msg}`);
  }
  const d = (json as any)?.data ?? json;
  return { status: (d.status ?? 'pending') as GeniusPayStatus, raw: d };
}

/**
 * Vérifie la signature HMAC-SHA256 d'un webhook GeniusPay.
 * Format : HMAC-SHA256(timestamp + "." + rawBody, webhook_secret).
 * Comparaison en temps constant pour éviter les attaques par timing.
 */
export function verifyWebhookSignature(args: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  /** Tolérance anti-replay en secondes (défaut 300 = 5 min) */
  toleranceSec?: number;
}): { ok: true } | { ok: false; error: string } {
  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
  if (!secret) return { ok: false, error: 'GENIUSPAY_WEBHOOK_SECRET manquante' };
  if (!args.signature || !args.timestamp) return { ok: false, error: 'Signature ou timestamp absent' };

  // Anti-replay : rejette les webhooks plus vieux que la tolérance
  const tolerance = args.toleranceSec ?? 300;
  const tsNum = Number(args.timestamp);
  if (!Number.isFinite(tsNum)) return { ok: false, error: 'Timestamp invalide' };
  const ageSec = Math.abs(Date.now() / 1000 - tsNum);
  if (ageSec > tolerance) return { ok: false, error: 'Webhook expiré (anti-replay)' };

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${args.timestamp}.${args.rawBody}`)
    .digest('hex');

  // Comparaison en temps constant
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(args.signature.replace(/^sha256=/, ''), 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, error: 'Signature invalide' };
  }
  return { ok: true };
}
