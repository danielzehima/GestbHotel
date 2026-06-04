'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'Comment fonctionne l\'essai gratuit de 21 jours ?',
    a: 'Vous accédez à toutes les fonctionnalités du plan Standard pendant 21 jours, sans carte bancaire. Aucun engagement, aucun débit automatique. À la fin de la période, vous choisissez librement votre plan.'
  },
  {
    q: 'Mes données sont-elles en sécurité ?',
    a: 'Oui. Nous hébergeons vos données sur Supabase (PostgreSQL) avec chiffrement, Row Level Security activée et des sauvegardes quotidiennes. Vos clients et vos finances sont isolés par hôtel — impossible pour un autre tenant d\'y accéder.'
  },
  {
    q: 'Puis-je accepter Wave, Orange Money, MTN et Moov Money ?',
    a: 'Oui. GestHotel intègre les principales méthodes de paiement Mobile Money d\'Afrique de l\'Ouest. Vous pouvez aussi accepter les cartes bancaires via CinetPay ou Visa/Mastercard.'
  },
  {
    q: 'Combien d\'employés puis-je inscrire ?',
    a: 'Cela dépend du plan : 2 utilisateurs en Basique, 10 en Standard, illimité en Premium. Vous gérez les rôles finement : administrateur, réception, ménage, serveur, cuisine, comptable.'
  },
  {
    q: 'Le restaurant et le QR code sont-ils inclus ?',
    a: 'Oui, à partir du plan Standard. Chaque table reçoit un QR code unique. Le client scanne pour consulter la carte, et le serveur prend la commande dans l\'application. La cuisine voit les commandes en temps réel sur un tableau Kanban.'
  },
  {
    q: 'Puis-je essayer sans payer si je suis chercheur ou administration ?',
    a: 'Absolument. Les chercheurs académiques et les administrations publiques bénéficient d\'un accès gratuit illimité sur demande. Contactez-nous pour obtenir votre code d\'activation.'
  }
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">FAQ</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Vos questions fréquentes
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                className={`bg-white border rounded-xl transition-all ${
                  isOpen ? 'border-brand-300 shadow-md' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-slate-900">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-brand-600' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
