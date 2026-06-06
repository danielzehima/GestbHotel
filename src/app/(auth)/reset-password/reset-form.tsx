'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { updatePassword, type ResetState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-60 shadow-sm transition"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      Réinitialiser le mot de passe
    </button>
  );
}

export function ResetForm() {
  const [state, formAction] = useActionState<ResetState, FormData>(updatePassword, null);
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(() => router.push('/login'), 2500);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  if (state?.ok) {
    return (
      <div className="text-center py-2">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="mt-3 font-semibold text-slate-900">Mot de passe mis à jour</h2>
        <p className="text-sm text-slate-600 mt-1">Redirection vers la connexion…</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <PasswordField name="password" label="Nouveau mot de passe" show={show} setShow={setShow} />
      <PasswordField name="confirm" label="Confirmer le mot de passe" show={show} setShow={setShow} />

      {state && !state.ok && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
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
