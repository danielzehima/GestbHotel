'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Trash2, Pencil, Download, Copy } from 'lucide-react';
import { regenerateQr, deleteTable } from './actions';

type Table = {
  id: string;
  numero: string;
  capacite: number;
  zone: string | null;
  qr_code: string;
  active: boolean;
};

function getBaseUrl() {
  if (typeof window === 'undefined') return '';
  return `${window.location.protocol}//${window.location.host}`;
}

export function TableCard({
  table,
  hotelSlug,
  canManage
}: {
  table: Table;
  hotelSlug: string;
  canManage: boolean;
}) {
  const [pending, start] = useTransition();
  const publicUrl = `${getBaseUrl()}/menu/${hotelSlug}/${table.qr_code}`;
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;

  function copy() {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Lien copié');
  }

  function regen() {
    if (!confirm('Régénérer le QR code ? L\'ancien ne fonctionnera plus.')) return;
    start(async () => {
      const r = await regenerateQr(table.id);
      if (r.ok) toast.success('QR régénéré');
      else toast.error(r.error);
    });
  }

  function del() {
    if (!confirm(`Supprimer la table ${table.numero} ?`)) return;
    start(async () => {
      const r = await deleteTable(table.id);
      if (r.ok) toast.success('Table supprimée');
      else toast.error(r.error);
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xl font-bold text-slate-900">Table {table.numero}</div>
          <div className="text-xs text-slate-500">
            {table.capacite} personnes{table.zone && ` · ${table.zone}`}
            {!table.active && ' · Inactive'}
          </div>
        </div>
        {canManage && (
          <div className="flex gap-1">
            <Link href={`/restaurant/tables/${table.id}/edit`} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
              <Pencil className="w-4 h-4" />
            </Link>
            <button onClick={del} disabled={pending} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center bg-slate-50 rounded-lg p-3 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrImage} alt={`QR table ${table.numero}`} className="w-40 h-40" />
      </div>

      <div className="space-y-1 text-xs">
        <button
          onClick={copy}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded text-slate-700"
        >
          <Copy className="w-3.5 h-3.5" />
          Copier le lien
        </button>
        <a
          href={qrImage}
          download={`qr-table-${table.numero}.png`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded text-slate-700"
        >
          <Download className="w-3.5 h-3.5" />
          Télécharger le QR
        </a>
        {canManage && (
          <button
            onClick={regen}
            disabled={pending}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded text-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Régénérer le QR
          </button>
        )}
      </div>
    </div>
  );
}
