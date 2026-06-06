'use client';

import { useState } from 'react';
import { Link2, Copy, Check, ExternalLink } from 'lucide-react';

export function ShareBookingLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="bg-gradient-to-r from-brand-50 to-emerald-50 border border-brand-200 rounded-xl p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Votre lien de réservation en ligne</p>
            <p className="text-xs text-slate-500 truncate">{url}</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-50 transition"
          >
            {copied ? <><Check className="w-4 h-4 text-emerald-600" /> Copié</> : <><Copy className="w-4 h-4" /> Copier</>}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-brand-700 transition"
          >
            <ExternalLink className="w-4 h-4" /> Ouvrir
          </a>
        </div>
      </div>
    </div>
  );
}
