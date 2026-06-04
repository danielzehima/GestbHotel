'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Hotel as HotelIcon } from 'lucide-react';
import { registerAction, type RegisterState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60 transition"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      Créer mon compte
    </button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<RegisterState, FormData>(registerAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {/* Bloc hôtel */}
      <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 flex items-start gap-2">
        <HotelIcon className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <label htmlFor="hotel_nom" className="block text-sm font-medium text-brand-900">
            Nom de votre hôtel <span className="text-red-500">*</span>
          </label>
          <input
            id="hotel_nom"
            name="hotel_nom"
            type="text"
            required
            maxLength={150}
            placeholder="Hôtel Ivoire"
            className="w-full mt-1 px-3 py-2 rounded-lg border border-brand-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white"
          />
          <p className="text-xs text-brand-700/70 mt-1">Vous pourrez modifier les détails plus tard.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="prenom" className="block text-sm font-medium text-slate-700 mb-1">
            Prénom <span className="text-red-500">*</span>
          </label>
          <input
            id="prenom" name="prenom" type="text" required maxLength={100} placeholder="Jean"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
          />
        </div>
        <div>
          <label htmlFor="nom" className="block text-sm font-medium text-slate-700 mb-1">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            id="nom" name="nom" type="text" required maxLength={100} placeholder="Kouassi"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email" name="email" type="email" required autoComplete="email"
          placeholder="vous@hotel.com"
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
          Mot de passe <span className="text-red-500">*</span>
        </label>
        <input
          id="password" name="password" type="password" required minLength={8} autoComplete="new-password"
          placeholder="••••••••"
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">8 caractères minimum.</p>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-3">
          {state.success}
        </p>
      )}

      <SubmitButton />

      <p className="text-xs text-slate-400 text-center">
        En créant un compte, vous acceptez les conditions d'utilisation.
      </p>
    </form>
  );
}
