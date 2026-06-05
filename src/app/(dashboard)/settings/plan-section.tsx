import Link from 'next/link';
import { Check, X, ArrowRight, Sparkles, Hotel, Users } from 'lucide-react';
import { getHotelPlanLimits, PLAN_LIMITS } from '@/lib/plan-limits';
import { PLAN_LABELS, PLAN_COLORS } from '@/lib/plan';
import { createClient } from '@/lib/supabase/server';

export async function PlanSection({ hotelId }: { hotelId: string }) {
  const { plan, limits, isExpired } = await getHotelPlanLimits(hotelId);

  // Compte courant
  const supabase = await createClient();
  const [{ count: rooms }, { count: users }] = await Promise.all([
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId)
  ]);

  const fmtMax = (n: number) => (n === Infinity ? '∞' : String(n));

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            Forfait actuel
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${PLAN_COLORS[plan]}`}>
              {PLAN_LABELS[plan].toUpperCase()}
            </span>
            {isExpired && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">EXPIRÉ</span>
            )}
          </h2>
          <p className="text-sm text-slate-500">Voici les limites incluses dans votre abonnement.</p>
        </div>
        <Link
          href="/upgrade"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
        >
          Changer <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-6 space-y-3">
        {/* Usage numérique */}
        <UsageBar
          icon={Hotel}
          label="Chambres"
          current={rooms ?? 0}
          max={limits.maxRooms}
          fmt={fmtMax}
        />
        <UsageBar
          icon={Users}
          label="Utilisateurs"
          current={users ?? 0}
          max={limits.maxUsers}
          fmt={fmtMax}
        />

        {/* Features booléennes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-100">
          <FeatureRow label="Restaurant + QR code" enabled={limits.restaurant} />
          <FeatureRow label="Mobile Money (Wave/OM/MTN/Moov)" enabled={limits.mobileMoney} />
          <FeatureRow label="Support prioritaire" enabled={limits.prioritySupport} />
          <FeatureRow label="Exports CSV/Excel" enabled={limits.exports} />
          <FeatureRow label="Domaine personnalisé" enabled={limits.customDomain} />
          <FeatureRow label="Multi-établissements" enabled={limits.multiHotel} />
        </div>
      </div>
    </section>
  );
}

function UsageBar({
  icon: Icon,
  label,
  current,
  max,
  fmt
}: {
  icon: any;
  label: string;
  current: number;
  max: number;
  fmt: (n: number) => string;
}) {
  const pct = max === Infinity ? 0 : Math.min(100, (current / max) * 100);
  const reached = max !== Infinity && current >= max;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-2 text-slate-700 font-medium">
          <Icon className="w-4 h-4 text-slate-400" />
          {label}
        </span>
        <span className={`font-semibold ${reached ? 'text-red-600' : 'text-slate-900'}`}>
          {current} / {fmt(max)}
        </span>
      </div>
      {max !== Infinity && (
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={reached ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-brand-500'}
            style={{ width: `${pct}%`, height: '100%' }}
          />
        </div>
      )}
    </div>
  );
}

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${enabled ? 'text-slate-700' : 'text-slate-400'}`}>
      {enabled ? (
        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
      ) : (
        <X className="w-4 h-4 text-slate-300 shrink-0" />
      )}
      <span className={enabled ? '' : 'line-through'}>{label}</span>
    </div>
  );
}
