'use client';

import { AlertTriangle, RotateCw } from 'lucide-react';
import { useEffect } from 'react';

export default function StaffError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[/staff] error:', error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-red-50 border-2 border-red-200 rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-bold text-red-900">Erreur sur la page Personnel</h2>
          <p className="text-sm text-red-800 mt-1">
            La page n'a pas pu se charger. Détails techniques ci-dessous.
          </p>
        </div>
      </div>

      <div className="bg-white border border-red-100 rounded p-3 mb-4">
        <p className="text-xs font-mono text-red-900 break-all">
          <strong>Message :</strong> {error.message || '—'}
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-red-700 mt-1">
            <strong>Digest :</strong> {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded"
        >
          <RotateCw className="w-4 h-4" />
          Réessayer
        </button>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded hover:bg-slate-50"
        >
          Retour au dashboard
        </a>
      </div>
    </div>
  );
}
