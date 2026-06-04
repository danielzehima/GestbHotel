import { CalendarDays, BedDouble, UtensilsCrossed, Receipt, Users, BarChart3 } from 'lucide-react';

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Réservations en temps réel',
    desc: 'Calendrier interactif, détection automatique des conflits de dates, check-in et check-out en un clic.',
    accent: 'bg-brand-50 text-brand-700'
  },
  {
    icon: BedDouble,
    title: 'Suivi des chambres',
    desc: 'État live (disponible, occupée, ménage, maintenance). Action rapide pour le personnel de ménage.',
    accent: 'bg-emerald-50 text-emerald-700'
  },
  {
    icon: UtensilsCrossed,
    title: 'Restaurant & QR code',
    desc: 'Carte accessible par QR scanné à table, prise de commande, interface cuisine temps réel.',
    accent: 'bg-amber-50 text-amber-700'
  },
  {
    icon: Receipt,
    title: 'Facturation centralisée',
    desc: 'Factures auto-générées depuis les réservations + commandes restaurant. Encaissement Mobile Money.',
    accent: 'bg-rose-50 text-rose-700'
  },
  {
    icon: Users,
    title: 'Personnel & plannings',
    desc: 'Rôles fins, plannings hebdomadaires, affectation des tâches ménage, pointage entrée/sortie.',
    accent: 'bg-indigo-50 text-indigo-700'
  },
  {
    icon: BarChart3,
    title: 'Rapports financiers',
    desc: 'Tableau de bord avec ADR, RevPAR, taux d\'occupation et revenus par canal de paiement.',
    accent: 'bg-cyan-50 text-cyan-700'
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">
            Fonctionnalités
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Tout ce qu'il faut pour piloter votre hôtel
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Une seule plateforme pour la réception, le restaurant, le ménage, la facturation et les rapports.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${f.accent} flex items-center justify-center mb-4`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
