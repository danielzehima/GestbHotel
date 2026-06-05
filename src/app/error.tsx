'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="max-w-2xl w-full bg-white border-2 border-red-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Une erreur est survenue</h1>
            <p className="text-sm text-slate-600 mt-1">
              Cette page n'a pas pu se charger. Détails ci-dessous.
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4 space-y-1">
          <p className="text-xs font-mono text-red-900 break-all">
            <strong>Message :</strong> {error.message || 'Erreur inconnue'}
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-red-700">
              <strong>Digest :</strong> {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded"
          >
            <RotateCw className="w-4 h-4" />
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded hover:bg-slate-50"
          >
            <Home className="w-4 h-4" />
            Retour accueil
          </a>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Si l'erreur persiste, contactez le support : <a href="mailto:danielzehima@gmail.com" className="underline">danielzehima@gmail.com</a>
        </p>
      </div>
    </main>
  );
}
