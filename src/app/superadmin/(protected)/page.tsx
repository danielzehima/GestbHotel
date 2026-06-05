import Link from 'next/link';
import {
  Hotel, Users, Sparkles, TrendingUp, AlertTriangle, CheckCircle2,
  Crown, ClipboardCheck, Mail, Clock
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney, formatDate, formatDateTime } from '@/lib/utils/format';
import { getPlanStatus, PLAN_LABELS, PLAN_COLORS, type Plan } from '@/lib/plan';
import { getPlanPrices } from '@/lib/plan-prices';

export const metadata = { title: 'Super Admin — GestHotel' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ----------------- DIAGNOSTIC CLÉ -----------------
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
function decodeJwtRole(jwt: string): string | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload.role ?? null;
  } catch { return null; }
}
const DETECTED_ROLE = decodeJwtRole(SERVICE_KEY);
const KEY_OK = DETECTED_ROLE === 'service_role';

// ----------------- DASHBOARD -----------------

export default async function SuperadminDashboard() {
  const supabase = createAdminClient();

  const [hotels, profiles, messagesNew, recentHotels, recentSubscribers] = await Promise.all([
    supabase.from('hotels').select('id, nom, slug, plan, plan_expires_at, created_at, actif'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('traite', false),
    supabase
      .from('hotels')
      .select('id, nom, slug, plan, ville, created_at, actif')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('hotels')
      .select('id, nom, slug, plan, plan_expires_at, created_at')
      .neq('plan', 'trial')
      .order('plan_expires_at', { ascending: false })
      .limit(6)
  ]);

  const allHotels = (hotels.data ?? []) as any[];

  // Récupère les prix dynamiques (depuis la table plan_prices)
  const planPrices = await getPlanPrices();
  const priceMap: Record<string, number> = { trial: 0 };
  planPrices.forEach((p) => { priceMap[p.plan] = p.prix_mensuel; });

  // Calcul des KPIs SaaS
  const totalHotels = allHotels.length;
  const totalUsers = profiles.count ?? 0;
  const messagesPending = messagesNew.count ?? 0;

  // Grouper par plan effectif
  const countsByPlan: Record<Plan, number> = { trial: 0, basique: 0, standard: 0, premium: 0 };
  const expiredCount = { trial: 0, paid: 0 };
  let mrr = 0;
  let trialsExpiringSoon = 0;
  let totalPaid = 0;

  allHotels.forEach((h) => {
    const status = getPlanStatus(h);
    countsByPlan[h.plan as Plan]++;
    if (status.isExpired) {
      if (h.plan === 'trial') expiredCount.trial++;
      else expiredCount.paid++;
    } else {
      // Plan actif
      if (h.plan !== 'trial') {
        mrr += priceMap[h.plan] ?? 0;
        totalPaid++;
      } else if (status.daysLeft <= 7) {
        trialsExpiringSoon++;
      }
    }
  });

  const activeTrials = countsByPlan.trial - expiredCount.trial;
  const conversionRate = totalHotels > 0
    ? Math.round((totalPaid / Math.max(1, totalHotels)) * 100)
    : 0;
  const arr = mrr * 12;

  return (
    <div className="space-y-6">
      {/* Bandeau clé service_role */}
      {KEY_OK ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Clé service_role active — accès complet aux données SaaS
        </div>
      ) : (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <strong>SUPABASE_SERVICE_ROLE_KEY manquante ou invalide.</strong>
            <br />Le panneau ne peut pas accéder aux données. Vérifiez vos variables d'environnement Vercel.
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-rose-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-rose-500/20 rounded-full blur-2xl" />
        <div className="relative">
          <p className="text-rose-300 text-xs uppercase tracking-wider font-semibold">Métriques SaaS GestHotel</p>
          <h1 className="text-3xl font-bold mt-1">Vue d'ensemble plateforme</h1>
          <p className="text-slate-300 mt-2">
            <strong className="text-white">{totalPaid}</strong> abonné{totalPaid > 1 ? 's' : ''} payant{totalPaid > 1 ? 's' : ''} ·{' '}
            <strong className="text-emerald-300">{formatMoney(mrr)}</strong> MRR ·{' '}
            <strong className="text-amber-300">{activeTrials}</strong> essai{activeTrials > 1 ? 's' : ''} en cours
          </p>
        </div>
      </div>

      {/* KPIs principaux SaaS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          icon={TrendingUp}
          label="MRR"
          value={formatMoney(mrr)}
          subtitle={`ARR estimé : ${formatMoney(arr)}`}
          tone="emerald"
        />
        <Kpi
          icon={Crown}
          label="Abonnés payants"
          value={totalPaid}
          subtitle={`sur ${totalHotels} hôtels (${conversionRate}%)`}
          tone="brand"
        />
        <Kpi
          icon={Sparkles}
          label="Essais en cours"
          value={activeTrials}
          subtitle={trialsExpiringSoon > 0 ? `${trialsExpiringSoon} expire(nt) sous 7j` : 'aucun urgent'}
          tone="amber"
        />
        <Kpi
          icon={ClipboardCheck}
          label="Conversion"
          value={`${conversionRate}%`}
          subtitle={`${totalPaid} payants / ${totalHotels} total`}
          tone="indigo"
        />
      </div>

      {/* KPIs secondaires */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Hotel} label="Hôtels totaux" value={totalHotels} subtitle="inscrits depuis le début" tone="brand" href="/superadmin/hotels" />
        <Kpi icon={Users} label="Utilisateurs" value={totalUsers} subtitle="comptes créés" tone="emerald" href="/superadmin/users" />
        <Kpi
          icon={AlertTriangle}
          label="Essais expirés"
          value={expiredCount.trial}
          subtitle="non convertis"
          tone="rose"
          href="/superadmin/hotels"
        />
        <Kpi icon={Mail} label="Messages" value={messagesPending} subtitle="non traités" tone="amber" href="/superadmin/messages" />
      </div>

      {/* Répartition par plan */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-1">Répartition par forfait</h3>
        <p className="text-sm text-slate-500 mb-4">Distribution des hôtels selon leur plan actuel.</p>

        {totalHotels > 0 && (
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mb-4">
            {(['premium', 'standard', 'basique', 'trial'] as Plan[]).map((p) => {
              const c = countsByPlan[p];
              if (c === 0) return null;
              const pct = (c / totalHotels) * 100;
              const color = p === 'premium' ? 'bg-amber-400'
                : p === 'standard' ? 'bg-brand-500'
                : p === 'basique' ? 'bg-slate-500'
                : 'bg-amber-200';
              return <div key={p} className={color} style={{ width: `${pct}%` }} title={`${PLAN_LABELS[p]} : ${c}`} />;
            })}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['trial', 'basique', 'standard', 'premium'] as Plan[]).map((p) => {
            const count = countsByPlan[p];
            const price = priceMap[p] ?? 0;
            const mrrContribution = count * price;
            return (
              <div key={p} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${PLAN_COLORS[p]}`}>
                    {PLAN_LABELS[p].toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400">{formatMoney(price)}/mois</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{count}</div>
                {p !== 'trial' && (
                  <div className="text-xs text-emerald-600 font-medium">+ {formatMoney(mrrContribution)} MRR</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Listes : Derniers abonnés + Derniers hôtels inscrits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              Derniers abonnés payants
            </h3>
            <Link href="/superadmin/hotels" className="text-xs text-rose-600 hover:underline">Tout voir →</Link>
          </div>
          {(recentSubscribers.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Aucun abonné payant pour le moment.</p>
          ) : (
            <ul className="space-y-2">
              {(recentSubscribers.data ?? []).map((h: any) => {
                const status = getPlanStatus(h);
                return (
                  <li key={h.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                    <span className={`w-2 h-2 rounded-full ${status.isExpired ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{h.nom}</div>
                      <div className="text-xs text-slate-500">
                        {h.plan_expires_at ? `Expire le ${formatDate(h.plan_expires_at)}` : '—'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${PLAN_COLORS[h.plan as Plan]}`}>
                        {PLAN_LABELS[h.plan as Plan].toUpperCase()}
                      </span>
                      <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                        + {formatMoney(priceMap[h.plan] ?? 0)}/mois
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              Derniers hôtels inscrits
            </h3>
            <Link href="/superadmin/hotels" className="text-xs text-rose-600 hover:underline">Tout voir →</Link>
          </div>
          {(recentHotels.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Aucun hôtel.</p>
          ) : (
            <ul className="space-y-2">
              {(recentHotels.data ?? []).map((h: any) => (
                <li key={h.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Hotel className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{h.nom}</div>
                    <div className="text-xs text-slate-500">{h.ville ?? '—'}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${PLAN_COLORS[h.plan as Plan]}`}>
                      {PLAN_LABELS[h.plan as Plan].toUpperCase()}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(h.created_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, subtitle, tone, href }: any) {
  const tones: Record<string, string> = {
    brand: 'from-brand-50 to-white text-brand-700',
    emerald: 'from-emerald-50 to-white text-emerald-700',
    amber: 'from-amber-50 to-white text-amber-700',
    rose: 'from-rose-50 to-white text-rose-700',
    indigo: 'from-indigo-50 to-white text-indigo-700'
  };
  const content = (
    <div className={`bg-gradient-to-br ${tones[tone]} border border-slate-200 rounded-2xl p-4 hover:shadow transition`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 leading-tight">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
