'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Trash2, Loader2, Copy, Check, X, MessageCircle } from 'lucide-react';
import { resetMemberPassword, deleteMember } from './actions';

export function MemberActions({ id, nom, isSelf }: { id: string; nom: string; isSelf: boolean }) {
  const [pending, start] = useTransition();
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);

  function resetPwd() {
    if (!confirm(`Réinitialiser le mot de passe de ${nom} ? L'ancien sera invalidé immédiatement.`)) return;
    start(async () => {
      const r = await resetMemberPassword(id);
      if (r.ok) {
        setCreds({ email: r.email, password: r.password });
        toast.success('Mot de passe réinitialisé');
      } else toast.error(r.error);
    });
  }

  function onDelete() {
    if (!confirm(`Supprimer définitivement ${nom} ? Le compte sera supprimé et ne pourra plus se connecter.`)) return;
    start(async () => {
      const r = await deleteMember(id);
      if (r.ok) toast.success('Membre supprimé');
      else toast.error(r.error);
    });
  }

  return (
    <>
      <button
        onClick={resetPwd}
        disabled={pending || isSelf}
        title={isSelf ? 'Utilisez Paramètres pour changer votre propre mot de passe' : 'Réinitialiser le mot de passe'}
        className="p-1.5 rounded text-amber-600 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
      </button>
      <button
        onClick={onDelete}
        disabled={pending || isSelf}
        title={isSelf ? 'Vous ne pouvez pas vous supprimer vous-même' : 'Supprimer ce membre'}
        className="p-1.5 rounded text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {creds && <ResetModal creds={creds} nom={nom} onClose={() => setCreds(null)} />}
    </>
  );
}

function ResetModal({
  creds,
  nom,
  onClose
}: {
  creds: { email: string; password: string };
  nom: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const text = `Bonjour ${nom},\nVotre mot de passe GestHotel a été réinitialisé.\n\nEmail : ${creds.email}\nNouveau mot de passe : ${creds.password}\n\nConnexion : https://gestb-hotel.vercel.app/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Message copié');
  }

  const waMessage = encodeURIComponent(
    `Bonjour ${nom},\nVotre mot de passe GestHotel a été réinitialisé.\n\nEmail : ${creds.email}\nNouveau mot de passe : ${creds.password}\n\nConnexion : https://gestb-hotel.vercel.app/login`
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Nouveau mot de passe</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-4">
          ⚠ Ce mot de passe ne sera plus affiché. Notez-le ou partagez-le maintenant.
        </p>

        <div className="bg-slate-50 rounded-lg p-4 space-y-2 mb-4">
          <div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Email</div>
            <div className="text-sm text-slate-900">{creds.email}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Mot de passe</div>
            <div className="font-mono text-base text-slate-900">{creds.password}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copy}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-medium"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
          <a
            href={`https://wa.me/?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-sm font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
