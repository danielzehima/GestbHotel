'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { requestPasswordReset, type ForgotState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-60 shadow-sm transition"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      Envoyer le lien
    </button>
  );
}

export function ForgotForm() {
  const [state, formAction] = useActionState<ForgotState, FormData>(requestPasswordReset, null);

  if (state?.ok) {
    return (
      <div className="text-center py-2">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="mt-3 font-semibold text-slate-900">Email envoyé</h2>
        <p className="text-sm text-slate-600 mt-1">
          Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.
          Pensez à vérifier vos spams.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          E-mail
        </label>
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

      {state && !state.ok && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
