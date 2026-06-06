'use client';

import { Download, Printer } from 'lucide-react';
import type { Analytics } from '@/lib/analytics';

export function ExportButtons({ data, hotelNom }: { data: Analytics; hotelNom: string }) {
  function exportCsv() {
    const rows: (string | number)[][] = [
      ['Rapport', hotelNom],
      ['Période', `${data.from} au ${data.to}`],
      [],
      ['Indicateur', 'Valeur'],
      ["Taux d'occupation (%)", data.occupancyPct.toFixed(1)],
      ['ADR (prix moyen/nuit)', Math.round(data.adr)],
      ['RevPAR', Math.round(data.revpar)],
      ['Revenu chambres', Math.round(data.roomRevenue)],
      ['Nuitées vendues', data.soldRoomNights],
      ['Nuitées disponibles', data.availableRoomNights],
      ['Réservations', data.bookings],
      ['Arrivées', data.arrivals],
      ['Départs', data.departures],
      [],
      ['Revenu par source', 'Revenu', 'Réservations'],
      ...data.revenueBySource.map((s) => [s.source, s.revenue, s.bookings]),
      [],
      ['Par type de chambre', 'Nuitées', 'Revenu'],
      ...data.byRoomType.map((t) => [t.libelle, t.soldNights, t.revenue])
    ];

    const csv = rows
      .map((r) => r.map((c) => {
        const s = String(c ?? '');
        return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(';'))
      .join('\n');

    // BOM pour qu'Excel lise correctement les accents
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${data.from}_${data.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2 print:hidden">
      <button
        onClick={exportCsv}
        className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-50 transition"
      >
        <Download className="w-4 h-4" /> Exporter CSV
      </button>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-50 transition"
      >
        <Printer className="w-4 h-4" /> Imprimer / PDF
      </button>
    </div>
  );
}
