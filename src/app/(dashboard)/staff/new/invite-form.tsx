'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Copy, Check, Mail, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { inviteTeamMember } from '../actions';
import { ROLE_DEFINITIONS } from '../role-permissions';

type Success = { email: string; password: string };

export function InviteForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [role, setRole] = useState<keyof typeof ROLE_DEFINITIONS>('receptionniste');
  const [autoPwd, setAutoPwd] = useState(true);
  const [success, setSuccess] = useState<Success | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (autoPwd) fd.delete('password');
    start(async () => {
      const r = await inviteTeamMember(fd);
      if (r.ok) {
        setSuccess({ email: r.email, password: r.password });
        toast.success('Compte créé');
      } else toast.error(r.error);
    });
  }

  if (success) {
    return <SuccessCard data={success} onClose={() => router.push('/staff')} />;
  }

  const roleInfo = ROLE_DEFINITIONS[role];

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl">
      {/* Formulaire */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-slate-900">Informations du membre</h3>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom" required>
            <Input name="prenom" required maxLength={100} placeholder="Jean" />
          </Field>
          <Field label="Nom" required>
            <Input name="nom" required maxLength={100} placeholder="Kouassi" />
          </Field>
        </div>

        <Field label="Email" required>
          <Input name="email" type="email" required placeholder="jean.kouassi@hotel.com" />
        </Field>

        <Field label="Téléphone">
          <Input name="telephone" placeholder="+225 07 00 00 00 00" />
        </Field>

        <Field label="Rôle" required>
          <Select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            required
          >
            {Object.entries(ROLE_DEFINITIONS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </Field>

        <div className="bg-slate-50 rounded-lg p-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoPwd}
              onChange={(e) => setAutoPwd(e.target.checked)}
              className="rounded"
            />
            <span>Générer automatiquement un mot de passe sécurisé</span>
          </label>
          {!autoPwd && (
            <Field label="Mot de passe (8 caractères min)">
              <Input
                name="password"
                type="text"
                minLength={8}
                placeholder="MotDePasse123"
                className="mt-2 font-mono"
              />
            </Field>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer le compte
          </Button>
        </div>
      </div>

      {/* Aperçu permissions du rôle sélectionné */}
      <aside className="bg-white border border-slate-200 rounded-2xl p-5 self-start sticky top-20">
        <h3 className="font-semibold text-slate-900 mb-1">Aperçu du rôle</h3>
        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${roleInfo.color} mb-2`}>
          {roleInfo.label}
        </span>
        <p className="text-sm text-slate-600 mb-4">{roleInfo.short}</p>

        <h4 className="text-xs uppercase font-semibold text-slate-500 tracking-wider mb-2">
          Ce qu'il pourra faire
        </h4>
        <ul className="space-y-2">
          {roleInfo.permissions.map((p) => (
            <li key={p.label} className="text-xs">
              <div className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">{p.label}</div>
                  <div className="text-slate-500">{p.desc}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </form>
  );
}

// ----- ÉCRAN DE SUCCÈS -----

function SuccessCard({ data, onClose }: { data: Success; onClose: () => void }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copy(field: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success(`${field} copié`);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function copyBoth() {
    const text = `Bienvenue sur GestHotel !\n\nVoici vos identifiants pour accéder à l'application :\nEmail : ${data.email}\nMot de passe : ${data.password}\n\nConnectez-vous sur : https://gestb-hotel.vercel.app/login\nPensez à changer votre mot de passe dans Paramètres après votre première connexion.`;
    navigator.clipboard.writeText(text);
    toast.success('Message complet copié');
  }

  const waMessage = encodeURIComponent(
    `Bonjour ! Vos identifiants GestHotel :\n\nEmail : ${data.email}\nMot de passe : ${data.password}\n\nConnexion : https://gestb-hotel.vercel.app/login\n\nMerci de changer votre mot de passe dans Paramètres après la première connexion.`
  );

  return (
    <div className="max-w-2xl">
      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-900">Compte créé avec succès</h3>
            <p className="text-sm text-emerald-700">
              ⚠ Notez ou partagez ces identifiants <strong>maintenant</strong>. Vous ne pourrez plus voir le mot de passe.
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-white rounded-xl p-4 border border-emerald-200">
          <CredentialRow
            label="Email"
            value={data.email}
            field="Email"
            copiedField={copiedField}
            onCopy={copy}
          />
          <CredentialRow
            label="Mot de passe"
            value={data.password}
            field="Mot de passe"
            copiedField={copiedField}
            onCopy={copy}
            mono
          />
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={copyBoth}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-lg text-sm font-medium transition"
          >
            <Copy className="w-4 h-4" />
            Copier le message complet
          </button>
          <a
            href={`mailto:${data.email}?subject=${encodeURIComponent('Vos identifiants GestHotel')}&body=${waMessage}`}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-lg text-sm font-medium transition"
          >
            <Mail className="w-4 h-4" />
            Envoyer par email
          </a>
          <a
            href={`https://wa.me/?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-sm font-medium transition"
          >
            <MessageCircle className="w-4 h-4" />
            Partager via WhatsApp
          </a>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
        >
          Retour à la liste de l'équipe <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CredentialRow({
  label, value, field, copiedField, onCopy, mono
}: {
  label: string; value: string; field: string;
  copiedField: string | null; onCopy: (f: string, v: string) => void; mono?: boolean;
}) {
  const isCopied = copiedField === field;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 uppercase font-semibold">{label}</div>
        <div className={`text-slate-900 truncate ${mono ? 'font-mono text-base' : 'text-sm'}`}>{value}</div>
      </div>
      <button
        onClick={() => onCopy(field, value)}
        className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition ${
          isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {isCopied ? 'Copié' : 'Copier'}
      </button>
    </div>
  );
}
