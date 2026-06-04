'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Check, Trash2, Mail, Phone, Loader2, Undo2 } from 'lucide-react';
import { markMessageHandled, deleteMessage } from '../../actions';

export function MessageCard({
  id,
  nom,
  email,
  telephone,
  sujet,
  message,
  traite,
  createdAt
}: {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  sujet: string;
  message: string;
  traite: boolean;
  createdAt: string;
}) {
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const r = await markMessageHandled(id, !traite);
      if (r.ok) toast.success(traite ? 'Marqué non traité' : 'Marqué traité');
      else toast.error(r.error);
    });
  }

  function onDelete() {
    if (!confirm('Supprimer ce message ?')) return;
    start(async () => {
      const r = await deleteMessage(id);
      if (r.ok) toast.success('Message supprimé');
      else toast.error(r.error);
    });
  }

  return (
    <div className={`bg-white rounded-xl border-l-4 ${traite ? 'border-l-emerald-400 border border-emerald-100' : 'border-l-rose-500 border border-slate-200'} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900">{nom}</h3>
            {traite ? (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">TRAITÉ</span>
            ) : (
              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">NOUVEAU</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
            <a href={`mailto:${email}`} className="inline-flex items-center gap-1 hover:text-brand-600">
              <Mail className="w-3 h-3" /> {email}
            </a>
            {telephone && (
              <a href={`tel:${telephone}`} className="inline-flex items-center gap-1 hover:text-brand-600">
                <Phone className="w-3 h-3" /> {telephone}
              </a>
            )}
            <span>{createdAt}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={toggle}
            disabled={pending}
            title={traite ? 'Remettre en non traité' : 'Marquer comme traité'}
            className={`p-1.5 rounded ${traite ? 'text-slate-500 hover:bg-slate-100' : 'text-emerald-600 hover:bg-emerald-50'}`}
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : (traite ? <Undo2 className="w-4 h-4" /> : <Check className="w-4 h-4" />)}
          </button>
          <button
            onClick={onDelete}
            disabled={pending}
            title="Supprimer"
            className="p-1.5 rounded text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-2">
        <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-medium">{sujet}</span>
      </div>
      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{message}</p>

      <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
        <a
          href={`mailto:${email}?subject=Re: ${encodeURIComponent(sujet)}`}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          ↩ Répondre par email
        </a>
        {telephone && (
          <a
            href={`https://wa.me/${telephone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-emerald-600 hover:underline"
          >
            💬 WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
