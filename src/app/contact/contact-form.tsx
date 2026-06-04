'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { sendContactMessage, type ContactState } from './actions';

const SUJETS = [
  'Demande de démonstration',
  'Question sur les tarifs',
  'Support technique',
  'Accès gratuit (chercheur / administration)',
  'Partenariat',
  'Autre'
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-60 transition shadow-md hover:shadow-lg"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      Envoyer le message
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState<ContactState, FormData>(sendContactMessage, null);

  if (state?.success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Message envoyé !</h3>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nom complet" required>
          <input
            name="nom"
            type="text"
            required
            maxLength={100}
            placeholder="Jean Kouassi"
            className={inputCls}
          />
        </Field>
        <Field label="Email" required>
          <input
            name="email"
            type="email"
            required
            placeholder="vous@email.com"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Téléphone">
        <input
          name="telephone"
          type="tel"
          placeholder="+225 07 00 00 00 00"
          className={inputCls}
        />
      </Field>

      <Field label="Sujet" required>
        <select name="sujet" required defaultValue="" className={inputCls + ' pr-8'}>
          <option value="" disabled>— Sélectionner —</option>
          {SUJETS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <Field label="Message" required>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={5}
          placeholder="Décrivez votre besoin, votre établissement, vos questions…"
          className={inputCls + ' min-h-[140px]'}
        />
      </Field>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="text-xs text-slate-400 text-center">
        En envoyant ce formulaire, vous acceptez notre{' '}
        <a href="/legal/confidentialite" className="text-brand-600 hover:underline">politique de confidentialité</a>.
      </p>
    </form>
  );
}

const inputCls =
  'w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white';

function Field({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
