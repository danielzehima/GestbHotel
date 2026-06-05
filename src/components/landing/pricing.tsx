import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { getPlanPrices } from '@/lib/plan-prices';
import { formatMoney } from '@/lib/utils/format';

const PAYMENTS = [
  { name: 'Wave', color: 'bg-sky-500' },
  { name: 'Orange Money', color: 'bg-orange-500' },
  { name: 'MTN Money', color: 'bg-yellow-500' },
  { name: 'Moov Money', color: 'bg-blue-500' },
  { name: 'CinetPay', color: 'bg-pink-500' },
  { name: 'Visa / Mastercard', color: 'bg-slate-700' }
];

export async function Pricing() {
  const all = await getPlanPrices();
  const plans = all.filter((p) => p.active);

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Tarification</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Des tarifs adaptés à chaque structure
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Sans engagement. Changez de plan à tout moment.{' '}
            <span className="block sm:inline text-emerald-700 font-medium">Tarifs en FCFA / mois.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-4 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.plan}
              className={`relative rounded-2xl p-6 sm:p-8 transition ${
                p.highlight
                  ? 'bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-2xl shadow-brand-600/30 scale-[1.02] lg:scale-105 border-0'
                  : 'bg-white border border-slate-200 hover:border-brand-300 hover:shadow-lg'
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-emerald-400 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                  <Sparkles className="w-3 h-3" />
                  Le plus populaire
                </div>
              )}

              <h3 className={`text-xl font-bold ${p.highlight ? 'text-white' : 'text-slate-900'}`}>{p.nom}</h3>
              {p.description && (
                <p className={`mt-2 text-sm ${p.highlight ? 'text-brand-100' : 'text-slate-500'}`}>{p.description}</p>
              )}

              <div className="mt-6 mb-6">
                <span className={`text-4xl sm:text-5xl font-bold ${p.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {p.prix_mensuel.toLocaleString('fr-FR')}
                </span>
                <span className={`ml-1 text-sm ${p.highlight ? 'text-brand-100' : 'text-slate-500'}`}>
                  FCFA / mois
                </span>
              </div>

              <Link
                href="/register"
                className={`block w-full text-center font-semibold py-3 rounded-xl transition mb-6 ${
                  p.highlight
                    ? 'bg-white text-brand-700 hover:bg-brand-50 shadow-lg'
                    : 'bg-brand-600 text-white hover:bg-brand-700 shadow'
                }`}
              >
                {p.highlight ? 'Démarrer l\'essai' : 'Démarrer'}
              </Link>

              <ul className="space-y-2.5">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-2 text-sm ${p.highlight ? 'text-brand-50' : 'text-slate-700'}`}
                  >
                    <Check
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        p.highlight ? 'text-emerald-300' : 'text-emerald-500'
                      }`}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust badges paiement */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Paiements locaux & cartes — Sécurisé
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Encaissez vos clients avec les solutions qu'ils utilisent vraiment.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {PAYMENTS.map((m) => (
                <div
                  key={m.name}
                  className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${m.color}`} />
                  <span className="text-sm font-medium text-slate-700">{m.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-center text-xs text-slate-500">
              Vos paiements sont sécurisés et conformes aux standards bancaires PCI-DSS.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
