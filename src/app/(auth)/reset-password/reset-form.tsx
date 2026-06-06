'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Phase = 'checking' | 'ready' | 'invalid' | 'done';

export function ResetForm() {
  const supabaseRef = useRef(createClient());
  const [phase, setPhase] = useState<Phase>('checking');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Détecte la session de récupération établie par le lien email
  // (le client navigateur consomme automatiquement ?code= ou #access_token=).
  useEffect(() => {
    const supabase = supabaseRef.current;
    let done = false;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) { done = true; setPhase('ready'); }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { done = true; setPhase('ready'); }
    });

    // Filet de sécurité si rien ne s'est établi
    const t = setTimeout(async () => {
      if (done) return;
      const { data } = await supabase.auth.getSession();
      setPhase(data.session ? 'ready' : 'invalid');
    }, 3000);

    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get('password') ?? '');
    const confirm = String(fd.get('confirm') ?? '');
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    const { error } = await supabaseRef.current.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }

    setPhase('done');
    setTimeout(() => router.push('/login'), 2500);
  }

  if (phase === 'checking') {
    return (
      <div className="text-center py-6">
        <Loader2 className="w-8 h-8 text-brand-500 mx-auto animate-spin" />
        <p className="text-sm text-slate-500 mt-3">Vérification du lien…</p>
      </div>
    );
  }

  if (phase === 'invalid') {
    return (
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h1 className="mt-3 text-xl font-bold text-slate-900">Lien invalide ou expiré</h1>
        <p className="text-sm text-slate-600 mt-2">
          Ouvrez le lien depuis le même appareil/navigateur que la demande, ou refaites une demande.
        </p>
        <a href="/forgot-password" className="mt-5 inline-block bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition">
          Nouvelle demande
        </a>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="text-center py-2">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="mt-3 font-semibold text-slate-900">Mot de passe mis à jour</h2>
        <p className="text-sm text-slate-600 mt-1">Redirection vers la connexion…</p>
      </div>
    );
  }

  // phase === 'ready'
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Nouveau mot de passe</h1>
      <p className="text-slate-500 mt-1 mb-6">Choisissez un mot de passe sécurisé (8 caractères min.).</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField name="password" label="Nouveau mot de passe" show={show} setShow={setShow} />
        <PasswordField name="confirm" label="Confirmer le mot de passe" show={show} setShow={setShow} />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-60 shadow-sm transition"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Réinitialiser le mot de passe
        </button>
      </form>
    </>
  );
}

function PasswordField({
  name, label, show, setShow
}: { name: string; label: string; show: boolean; setShow: (v: boolean) => void }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id={name}
          name={name}
          type={show ? 'text' : 'password'}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label={show ? 'Masquer' : 'Afficher'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
