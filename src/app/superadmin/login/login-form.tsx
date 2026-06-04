'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, KeyRound } from 'lucide-react';
import { superadminLogin, type LoginState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-60 transition"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
      Accéder au panneau
    </button>
  );
}

export function SuperadminLoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(superadminLogin, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
          Mot de passe maître
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          placeholder="••••••••"
          className="w-full px-3 py-3 rounded-lg border border-slate-300 focus:border-slate-700 focus:ring-2 focus:ring-slate-200 outline-none text-sm tracking-widest"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
