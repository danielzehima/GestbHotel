import { MessageCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

type Props = {
  telephone: string;
  prenom: string;
  hotelNom: string;
  reference: string;
  arrivee: string;
  depart: string;
};

/**
 * Boutons WhatsApp "click-to-chat" (wa.me) pré-remplis.
 * Permet à la réception d'envoyer confirmation/rappel sans API payante.
 */
export function GuestWhatsapp({ telephone, prenom, hotelNom, reference, arrivee, depart }: Props) {
  const phone = telephone.replace(/\D/g, '');
  if (!phone) return null;

  const confirmation = encodeURIComponent(
    `Bonjour ${prenom}, votre réservation chez ${hotelNom} (réf. ${reference}) est confirmée : ` +
      `du ${formatDate(arrivee)} au ${formatDate(depart)}. Au plaisir de vous accueillir !`
  );
  const rappel = encodeURIComponent(
    `Bonjour ${prenom}, petit rappel : votre arrivée chez ${hotelNom} est prévue le ${formatDate(arrivee)}. ` +
      `Réf. ${reference}. À très bientôt !`
  );

  return (
    <div className="mt-4 pt-3 border-t border-slate-100">
      <p className="text-xs text-slate-500 mb-2">Contacter le client par WhatsApp</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://wa.me/${phone}?text=${confirmation}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
        >
          <MessageCircle className="w-4 h-4" /> Confirmation
        </a>
        <a
          href={`https://wa.me/${phone}?text=${rappel}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <MessageCircle className="w-4 h-4" /> Rappel d'arrivée
        </a>
      </div>
    </div>
  );
}
