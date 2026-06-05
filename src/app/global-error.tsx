'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError-root]', error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 40, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        <div style={{
          maxWidth: 600,
          margin: '40px auto',
          padding: 24,
          background: '#fff',
          border: '2px solid #fecaca',
          borderRadius: 12
        }}>
          <h1 style={{ margin: 0, color: '#b91c1c' }}>⚠ Erreur critique</h1>
          <p style={{ color: '#475569' }}>L'application a rencontré une erreur fatale.</p>
          <pre style={{
            background: '#fef2f2',
            padding: 12,
            borderRadius: 6,
            fontSize: 12,
            color: '#991b1b',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            <strong>Message :</strong> {error.message || 'inconnu'}
            {error.digest && `\nDigest : ${error.digest}`}
          </pre>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={reset}
              style={{
                padding: '8px 16px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              Réessayer
            </button>
            <a
              href="/"
              style={{
                padding: '8px 16px',
                background: '#fff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                textDecoration: 'none'
              }}
            >
              Retour accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
