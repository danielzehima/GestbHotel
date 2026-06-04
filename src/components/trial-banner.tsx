import Link from 'next/link';
import { Sparkles, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import type { PlanStatus } from '@/lib/plan';

export function TrialBanner({ status }: { status: PlanStatus }) {
  // Forfait payant + pas en fin de période : pas de bannière
  if (!status.isTrial && !status.isExpiringSoon && !status.isExpired) return null;

  // ESSAI EXPIRÉ
  if (status.isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold">Votre essai gratuit est terminé</h3>
              <p className="text-sm text-rose-100 mt-1">
                Choisissez un forfait pour continuer à utiliser GestHotel sans interruption.
              </p>
            </div>
          </div>
          <Link
            href="/upgrade"
            className="inline-flex items-center justify-center gap-2 bg-white text-red-600 font-semibold px-5 py-2.5 rounded-lg hover:bg-rose-50 shadow transition whitespace-nowrap"
          >
            Voir les forfaits
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ESSAI EN COURS - ALERTE FIN PROCHE
  if (status.isExpiringSoon) {
    const isUrgent = status.daysLeft <= 3;
    return (
      <div
        className={`rounded-2xl p-5 shadow-sm border-2 ${
          isUrgent
            ? 'bg-orange-50 border-orange-300'
            : 'bg-amber-50 border-amber-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isUrgent ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                {isUrgent ? 'Urgent : ' : ''}Plus que <span className={isUrgent ? 'text-orange-700' : 'text-amber-700'}>{status.daysLeft} jour{status.daysLeft > 1 ? 's' : ''}</span> d'essai gratuit
              </h3>
              <p className="text-sm text-slate-700 mt-1">
                Activez un forfait dès maintenant pour ne pas perdre l'accès à votre hôtel.
              </p>
              <ProgressBar pct={status.progressPct} used={status.daysUsed} total={status.totalDays} />
            </div>
          </div>
          <Link
            href="/upgrade"
            className={`inline-flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-lg shadow transition whitespace-nowrap ${
              isUrgent
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            Choisir un forfait
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ESSAI EN COURS - NORMAL
  return (
    <div className="bg-gradient-to-r from-brand-50 to-emerald-50 border border-brand-200 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">
              Essai gratuit : il vous reste <span className="text-brand-700">{status.daysLeft} jour{status.daysLeft > 1 ? 's' : ''}</span>
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Profitez de toutes les fonctionnalités jusqu'au {status.expiresAt!.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
            <ProgressBar pct={status.progressPct} used={status.daysUsed} total={status.totalDays} />
          </div>
        </div>
        <Link
          href="/upgrade"
          className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition whitespace-nowrap"
        >
          Voir les forfaits
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function ProgressBar({ pct, used, total }: { pct: number; used: number; total: number }) {
  return (
    <div className="mt-3 max-w-md">
      <div className="h-1.5 bg-white rounded-full overflow-hidden border border-slate-200">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-500 mt-1">
        {used} / {total} jours utilisés
      </p>
    </div>
  );
}
