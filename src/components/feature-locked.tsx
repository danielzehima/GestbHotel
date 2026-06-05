import Link from 'next/link';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';

export function FeatureLocked({
  feature,
  requiredPlan = 'Standard',
  description
}: {
  feature: string;
  requiredPlan?: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 sm:p-8 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
        <Lock className="w-6 h-6" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
        {feature} — fonctionnalité {requiredPlan}
      </h2>
      <p className="mt-2 text-sm sm:text-base text-slate-600">
        {description ?? `Cette fonctionnalité est incluse à partir du forfait ${requiredPlan}.`}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Mettez à niveau votre forfait pour débloquer cet accès.
      </p>
      <Link
        href="/upgrade"
        className="inline-flex items-center gap-2 mt-6 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition"
      >
        <Sparkles className="w-4 h-4" />
        Choisir un forfait
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
