'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CalendarCheck } from 'lucide-react';
import { createPublicBooking } from './actions';

type Props = {
  hotelSlug: string;
  roomTypeId: string;
  dates: { arrivee: string; depart: string };
  adultes: number;
  enfants: number;
};

export function BookingForm({ hotelSlug, roomTypeId, dates, adultes, enfants }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('hotelSlug', hotelSlug);
    fd.set('room_type_id', roomTypeId);
    fd.set('date_arrivee', dates.arrivee);
    fd.set('date_depart', dates.depart);
    fd.set('nb_adultes', String(adultes));
    fd.set('nb_enfants', String(enfants));

    startTransition(async () => {
      const res = await createPublicBooking(fd);
      if (res.ok) {
        router.push(`/reserver/${hotelSlug}/confirmation?ref=${encodeURIComponent(res.reference)}`);
      } else {
        setError(res.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 shadow transition"
      >
        <CalendarCheck className="w-4 h-4" />
        Réserver
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 w-full space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="prenom" required placeholder="Prénom" className="input" />
        <input name="nom" required placeholder="Nom" className="input" />
        <input name="email" type="email" required placeholder="Email" className="input" />
        <input name="telephone" required placeholder="Téléphone (WhatsApp)" className="input" />
      </div>

      {/* Code promo */}
      <div className="flex gap-2">
        <input
          name="promo_code"
          placeholder="Code promo (optionnel)"
          className="input flex-1 uppercase"
          style={{ textTransform: 'uppercase' }}
        />
      </div>

      {error && (
        <p className="text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg py-2 px-3">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 shadow transition disabled:opacity-60"
        >
          {pending ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</> : <>Confirmer ma demande</>}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition"
        >
          Annuler
        </button>
      </div>
      <p className="text-[11px] text-slate-400">
        Demande sans paiement immédiat. L'hôtel vous recontacte pour confirmer.
      </p>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.6rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.9rem;
          outline: none;
        }
        .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
      `}</style>
    </form>
  );
}
