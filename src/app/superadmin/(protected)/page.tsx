import Link from 'next/link';
import { Hotel, Users, BedDouble, Receipt, CalendarDays, UtensilsCrossed, Mail, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney, formatDateTime } from '@/lib/utils/format';

export const metadata = { title: 'Super Admin — GestHotel' };
// ⚠️ Pas de cache pour voir les données en live
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Diagnostic visuel
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const KEY_LEN = SERVICE_KEY.length;
const KEY_PREFIX = SERVICE_KEY.slice(0, 24);

function decodeJwtRole(jwt: string): string | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload.role ?? null;
  } catch { return null; }
}

const DETECTED_ROLE = decodeJwtRole(SERVICE_KEY);

export default async function SuperadminDashboard() {
  const supabase = createAdminClient();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

  const [
    hotels, profiles, rooms, reservations, payments,
    paymentsToday, paymentsMonth, orders, messagesNew,
    recentHotels, recentReservations
  ] = await Promise.all([
    supabase.from('hotels').select('id, actif', { count: 'exact' }),
    supabase.from('profiles').select('id, actif', { count: 'exact' }),
    supabase.from('rooms').select('id', { count: 'exact', head: true }),
    supabase.from('reservations').select('id', { count: 'exact', head: true }),
    supabase.from('payments').select('montant').eq('statut', 'reussi'),
    supabase.from('payments').select('montant').eq('statut', 'reussi').gte('encaisse_at', todayStart.toISOString()),
    supabase.from('payments').select('montant').eq('statut', 'reussi').gte('encaisse_at', monthStart.toISOString()),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('traite', false),
    supabase.from('hotels').select('id, nom, slug, ville, created_at, actif').order('created_at', { ascending: false }).limit(5),
    supabase.from('reservations').select('id, reference, statut, created_at, prix_total, hotel:hotels(nom)').order('created_at', { ascending: false }).limit(8)
  ]);

  const totalHotels = hotels.count ?? 0;
  const activeHotels = (hotels.data ?? []).filter((h: any) => h.actif).length;
  const totalUsers = profiles.count ?? 0;
  const activeUsers = (profiles.data ?? []).filter((p: any) => p.actif).length;
  const totalRooms = rooms.count ?? 0;
  const totalReservations = reservations.count ?? 0;
  const totalOrders = orders.count ?? 0;
  const messagesPending = messagesNew.count ?? 0;
  const grossRevenue = (payments.data ?? []).reduce((s, p) => s + Number(p.montant ?? 0), 0);
  const revenueToday = (paymentsToday.data ?? []).reduce((s, p) => s + Number(p.montant ?? 0), 0);
  const revenueMonth = (paymentsMonth.data ?? []).reduce((s, p) => s + Number(p.montant ?? 0), 0);

  // Si la clé est anon ou manquante, montrer un warning explicite
  const keyOk = DETECTED_ROLE === 'service_role';
  const keyError = !SERVICE_KEY
    ? 'Variable SUPABASE_SERVICE_ROLE_KEY non définie dans .env.local'
    : DETECTED_ROLE === 'anon'
      ? 'Tu as collé la clé ANON par erreur. Il faut la clé SERVICE_ROLE (celle qui est cachée derrière "Reveal").'
      : DETECTED_ROLE === null
        ? `Clé invalide (longueur ${KEY_LEN}, ne ressemble pas à un JWT Supabase).`
        : DETECTED_ROLE !== 'service_role'
          ? `Clé avec rôle "${DETECTED_ROLE}" au lieu de "service_role".`
          : null;

  return (
    <div className="space-y-6">
      {/* DIAGNOSTIC */}
      {keyError ? (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900">⚠ Diagnostic : clé service_role incorrecte</h3>
              <p className="text-sm text-red-800 mt-1">{keyError}</p>
              <div className="mt-3 text-xs font-mono bg-white border border-red-200 rounded p-2 text-red-900">
                <div>SUPABASE_SERVICE_ROLE_KEY :</div>
                <div>• Longueur détectée : <strong>{KEY_LEN || '0 (vide)'}</strong> caractères</div>
                <div>• Préfixe : <strong>{KEY_PREFIX || '(vide)'}…</strong></div>
                <div>• Rôle décodé du JWT : <strong>{DETECTED_ROLE ?? 'NULL'}</strong></div>
              </div>
              <div className="mt-4 text-sm text-red-800 space-y-1">
                <p><strong>Comment corriger :</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Supabase Dashboard → Project Settings → API</li>
                  <li>Section "Project API keys" : il y a <strong>2 clés</strong></li>
                  <li>Cherche la 2ème ligne <strong>"service_role"</strong> + clique sur <strong>"Reveal"</strong></li>
                  <li>Copie sa valeur dans <code className="bg-red-100 px-1 rounded">.env.local</code></li>
                  <li><strong>Arrête (Ctrl+C) puis relance <code className="bg-red-100 px-1 rounded">npm run dev</code></strong></li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Clé service_role détectée — accès complet activé.
        </div>
      )}

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-rose-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-rose-500/20 rounded-full blur-2xl" />
        <div className="relative">
          <p className="text-rose-300 text-xs uppercase tracking-wider font-semibold">Panneau de contrôle SaaS</p>
          <h1 className="text-3xl font-bold mt-1">Vue d'ensemble plateforme</h1>
          <p className="text-slate-300 mt-2">
            {totalHotels} hôtel{totalHotels > 1 ? 's' : ''} actif{activeHotels > 1 ? 's' : ''} ·{' '}
            {totalUsers} utilisateur{totalUsers > 1 ? 's' : ''} ·{' '}
            CA total : {formatMoney(grossRevenue)}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Hotel} label="Hôtels" value={totalHotels} subtitle={`${activeHotels} actifs`} tone="brand" href="/superadmin/hotels" />
        <Kpi icon={Users} label="Utilisateurs" value={totalUsers} subtitle={`${activeUsers} actifs`} tone="emerald" href="/superadmin/users" />
        <Kpi icon={BedDouble} label="Chambres" value={totalRooms} subtitle="toutes plateformes" tone="amber" />
        <Kpi icon={CalendarDays} label="Réservations" value={totalReservations} subtitle="depuis le début" tone="indigo" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Receipt} label="CA total" value={formatMoney(grossRevenue)} subtitle="cumulé" tone="emerald" />
        <Kpi icon={TrendingUp} label="CA du mois" value={formatMoney(revenueMonth)} subtitle="paiements réussis" tone="brand" />
        <Kpi icon={Receipt} label="CA du jour" value={formatMoney(revenueToday)} subtitle="encaissé aujourd'hui" tone="amber" />
        <Kpi icon={Mail} label="Messages" value={messagesPending} subtitle="non traités" tone="rose" href="/superadmin/messages" />
      </div>

      {/* RECENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Derniers hôtels inscrits</h3>
            <Link href="/superadmin/hotels" className="text-xs text-rose-600 hover:underline">Tout voir →</Link>
          </div>
          {(recentHotels.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Aucun hôtel.</p>
          ) : (
            <ul className="space-y-2">
              {(recentHotels.data ?? []).map((h: any) => (
                <li key={h.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                    <Hotel className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{h.nom}</div>
                    <div className="text-xs text-slate-500">/{h.slug} · {h.ville ?? '—'}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {h.actif ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">ACTIF</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">INACTIF</span>
                    )}
                    <span className="text-[10px] text-slate-400">{formatDateTime(h.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">Dernières réservations (toutes plateformes)</h3>
          {(recentReservations.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Aucune réservation.</p>
          ) : (
            <ul className="space-y-2">
              {(recentReservations.data ?? []).map((r: any) => (
                <li key={r.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-slate-500">{r.reference}</div>
                    <div className="text-sm font-medium truncate">{r.hotel?.nom ?? '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatMoney(Number(r.prix_total))}</div>
                    <div className="text-[10px] text-slate-400">{formatDateTime(r.created_at)}</div>
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
