import Link from 'next/link';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import type { PlanStatus } from '@/lib/plan';

/**
 * Écran de verrouillage affiché à la place des modules quand le forfait/essai est expiré.
 * L'utilisateur garde la sidebar (et donc la déconnexion) ; seul l'accès aux modules est bloqué.
 * La page /upgrade reste accessible pour réactiver.
 */
export function PlanExpiredLock({ status }: { status: PlanStatus }) {
  const isTrial = status.isTrial;

  return (
    <div className="flex items-center justify-center py-10">
      <div className="max-w-lg w-full bg-white rounded-2xl border-2 border-red-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          {isTrial ? 'Votre essai gratuit est terminé' : 'Votre forfait a expiré'}
        </h1>

        <p className="mt-2 text-slate-600 leading-relaxed">
          L'accès aux modules est temporairement suspendu.{' '}
          <strong className="text-slate-800">Vos données sont conservées</strong> et seront
          immédiatement disponibles dès la {isTrial ? 'souscription' : 'réactivation'} d'un forfait.
        </p>

        <Link
          href="/upgrade"
          className="mt-7 inline-flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-700 shadow transition"
        >
          {isTrial ? 'Choisir un forfait' : 'Réactiver mon forfait'}
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="mt-5 inline-flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          Paiement sécurisé · activation immédiate
        </p>
      </div>
    </div>
  );
}
