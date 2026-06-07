import { NextResponse } from 'next/server';
import { buildExportFeed, getHotelIcalToken } from '@/lib/ical-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Export iCal public — un calendrier .ics par type de chambre.
 * Les OTA (Booking.com, Airbnb…) s'abonnent à cette URL pour bloquer les dates.
 *
 * Sécurité : token par hôtel (?token=) pour ne pas exposer le calendrier à tous.
 * URL : /api/ical/<hotelId>/<roomTypeId>.ics?token=<token>
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ hotelId: string; roomTypeId: string }> }
) {
  const { hotelId, roomTypeId } = await ctx.params;
  // Le roomTypeId peut arriver avec l'extension .ics → on la retire
  const cleanRoomTypeId = roomTypeId.replace(/\.ics$/i, '');

  const token = new URL(req.url).searchParams.get('token');
  const expectedToken = await getHotelIcalToken(hotelId);

  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
  }

  const feed = await buildExportFeed({ hotelId, roomTypeId: cleanRoomTypeId });
  if (feed === null) {
    return NextResponse.json({ error: 'Type de chambre introuvable' }, { status: 404 });
  }

  return new NextResponse(feed, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="gesthotel-${cleanRoomTypeId}.ics"`,
      // Pas de cache : la disponibilité doit toujours être à jour pour les OTA
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
