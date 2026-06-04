import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-700 px-6 sm:px-12 py-12 sm:py-16 text-center shadow-2xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-2xl" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Prêt à digitaliser votre hôtel ?
            </h2>
            <p className="mt-3 text-brand-100 max-w-xl mx-auto">
              Démarrez en 5 minutes, sans installation. Essai gratuit 21 jours, sans carte bancaire.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-6 py-3.5 rounded-xl hover:bg-brand-50 shadow-lg hover:shadow-xl transition group"
            >
              Démarrer mon essai gratuit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
