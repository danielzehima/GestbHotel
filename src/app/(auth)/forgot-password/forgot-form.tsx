'use client';

import { useState } from 'react';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function ForgotForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Veuillez saisir une adresse email valide.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    // Flux initié côté navigateur : le code PKCE est stocké dans CE navigateur,
    // ce qui permet d'établir la session sur /reset-password sans le serveur.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    setLoading(false);

    if (error) console.error('[forgot-password]', error.message);
    // On affiche toujours le succès (anti-énumération des comptes).
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center py-2">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="mt-3 font-semibold text-slate-900">Email envoyé</h2>
        <p className="text-sm text-slate-600 mt-1">
          Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.
          Pensez à vérifier vos spams. <strong>Ouvrez le lien depuis ce même appareil.</strong>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
            placeholder="vous@hotel.com"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-60 shadow-sm transition"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Envoyer le lien
      </button>
    </form>
  );
}
