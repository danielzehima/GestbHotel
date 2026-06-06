import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlanStatus } from '@/lib/plan';
import { sendExpiryReminderEmail, sendExpiredEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Jours avant expiration qui déclenchent une relance
const REMINDER_DAYS = [7, 3, 1];

/**
 * Cron quotidien (Vercel) : envoie les relances d'expiration et l'email de suspension.
 *
 * Sécurité : header `Authorization: Bearer <CRON_SECRET>` (Vercel l'ajoute automatiquement)
 * ou `?secret=<CRON_SECRET>` pour un test manuel.
 *
 * Idempotence : le cron tourne 1×/jour, donc chaque seuil (J-7/J-3/J-1) et le jour J
 * ne sont franchis qu'une seule fois par hôtel → pas de doublon, pas de colonne de suivi.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    const url = new URL(req.url);
    const qs = url.searchParams.get('secret');
    if (auth !== `Bearer ${secret}` && qs !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const sb = createAdminClient();

  const { data: hotels, error } = await sb
    .from('hotels')
    .select('id, nom, email, plan, plan_expires_at, created_at, actif');

  if (error) {
    console.error('[cron expiry] fetch hotels:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let reminders = 0;
  let expired = 0;
  const results: any[] = [];

  for (const h of hotels ?? []) {
    if ((h as any).actif === false) continue;

    const status = getPlanStatus(h as any);

    // expiré exactement aujourd'hui (start-of-day) → un seul envoi
    const expiresAt = status.expiresAt;
    const todayMidnight = (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();
    const expiredToday = !!expiresAt && expiresAt.getTime() === todayMidnight;

    const shouldRemind = !status.isExpired && REMINDER_DAYS.includes(status.daysLeft);
    if (!shouldRemind && !expiredToday) continue;

    // Destinataire : email de l'hôtel, sinon email d'auth de l'admin
    let to: string | null = (h as any).email || null;
    let prenom: string | undefined;

    const { data: admin } = await sb
      .from('profiles')
      .select('id, prenom')
      .eq('hotel_id', (h as any).id)
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (admin) {
      prenom = (admin as any).prenom;
      if (!to) {
        const { data: authUser } = await sb.auth.admin.getUserById((admin as any).id);
        to = authUser?.user?.email ?? null;
      }
    }

    if (!to) {
      results.push({ hotel: (h as any).nom, skipped: 'aucun email' });
      continue;
    }

    if (expiredToday) {
      await sendExpiredEmail({ to, hotelNom: (h as any).nom, prenom, isTrial: status.isTrial });
      expired++;
      results.push({ hotel: (h as any).nom, sent: 'expired', to });
    } else {
      await sendExpiryReminderEmail({
        to,
        hotelNom: (h as any).nom,
        prenom,
        isTrial: status.isTrial,
        daysLeft: status.daysLeft
      });
      reminders++;
      results.push({ hotel: (h as any).nom, sent: `reminder J-${status.daysLeft}`, to });
    }
  }

  console.info(`[cron expiry] ${reminders} relance(s), ${expired} suspension(s)`);
  return NextResponse.json({ ok: true, checked: hotels?.length ?? 0, reminders, expired, results });
}
