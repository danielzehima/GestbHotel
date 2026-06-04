import Link from 'next/link';
import { ArrowRight, Sparkles, BedDouble, Receipt, UtensilsCrossed, ClipboardList } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* Background décoratif */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-gradient-to-br from-brand-100 via-emerald-50 to-white rounded-full blur-3xl opacity-60" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/40 rounded-full blur-2xl" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-200/40 rounded-full blur-2xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Nouvelle version — Conçu pour les hôtels d'Afrique de l'Ouest
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            La gestion hôtelière,{' '}
            <span className="bg-gradient-to-r from-brand-600 to-emerald-600 bg-clip-text text-transparent">
              enfin simple
            </span>{' '}
            et complète.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
            Réservations, chambres, restaurant QR, facturation Mobile Money — pilotez tout votre hôtel depuis une seule plateforme, en français, optimisée pour vos équipes locales.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-brand-600/20 hover:shadow-xl hover:shadow-brand-600/30 transition-all"
            >
              Essayer gratuitement pendant 21 jours
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-6 py-3.5 rounded-xl hover:bg-slate-50 transition"
            >
              Découvrir les fonctionnalités
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Aucune carte bancaire requise · Accès illimité gratuit pour les chercheurs et administrations publiques
          </p>
        </div>

        {/* Mockup tableau de bord */}
        <div className="mt-16 sm:mt-20 max-w-5xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-x-4 -inset-y-4 bg-gradient-to-r from-brand-200 to-emerald-200 rounded-3xl blur-2xl opacity-40" />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Fausse barre navigateur */}
              <div className="h-9 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white border border-slate-200 rounded px-3 py-0.5 text-[10px] text-slate-500 font-mono">
                    gesthotel.app/dashboard
                  </div>
                </div>
              </div>

              {/* Faux dashboard */}
              <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-white">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  <MockKpi icon={BedDouble} label="Occupation" value="87%" tone="brand" />
                  <MockKpi icon={Receipt} label="Revenus" value="1,2M" tone="emerald" />
                  <MockKpi icon={UtensilsCrossed} label="Commandes" value="42" tone="amber" />
                  <MockKpi icon={ClipboardList} label="Tâches" value="6" tone="rose" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="sm:col-span-2 bg-white rounded-xl border border-slate-200 p-4 h-40 sm:h-44">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Revenus 7 jours</p>
                    <div className="flex items-end justify-between gap-2 h-24 sm:h-28">
                      {[50, 70, 45, 80, 60, 90, 100].map((h, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-md ${
                            i === 6
                              ? 'bg-gradient-to-t from-brand-600 to-brand-400'
                              : 'bg-gradient-to-t from-slate-300 to-slate-200'
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Méthodes</p>
                    <div className="space-y-2">
                      <MockBar label="Wave" pct={45} color="bg-sky-500" />
                      <MockBar label="OM" pct={28} color="bg-orange-500" />
                      <MockBar label="MTN" pct={15} color="bg-yellow-500" />
                      <MockBar label="Espèces" pct={12} color="bg-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockKpi({ icon: Icon, label, value, tone }: any) {
  const tones: Record<string, string> = {
    brand: 'from-brand-50 text-brand-700',
    emerald: 'from-emerald-50 text-emerald-700',
    amber: 'from-amber-50 text-amber-700',
    rose: 'from-rose-50 text-rose-700'
  };
  return (
    <div className={`bg-gradient-to-br ${tones[tone]} to-white border border-slate-200 rounded-xl p-3`}>
      <Icon className="w-4 h-4" />
      <div className="text-xs font-medium text-slate-500 mt-2">{label}</div>
      <div className="text-lg sm:text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function MockBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="text-xs">
      <div className="flex justify-between text-slate-600 mb-1">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={color} style={{ width: `${pct}%`, height: '100%' }} />
      </div>
    </div>
  );
}
