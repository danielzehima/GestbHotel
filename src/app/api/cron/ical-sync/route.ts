import { NextResponse } from 'next/server';
import { syncAllFeeds } from '@/lib/ical-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron : importe tous les flux iCal externes actifs (Booking.com, Airbnb…)
 * et crée/met à jour les réservations de blocage → anti-surbooking.
 *
 * Sécurité : CRON_SECRET (header Bearer ou ?secret=).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    const qs = new URL(req.url).searchParams.get('secret');
    if (auth !== `Bearer ${secret}` && qs !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await syncAllFeeds();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error('[cron ical-sync]', e?.message);
    return NextResponse.json({ error: e?.message ?? 'Erreur' }, { status: 500 });
  }
}
