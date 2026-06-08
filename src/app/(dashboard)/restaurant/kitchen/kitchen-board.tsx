'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChefHat, Bell, ClipboardList, BellRing, Volume2, VolumeX, Check } from 'lucide-react';
import { updateOrderStatus, resolveServiceCall } from '../orders/actions';
import { cn } from '@/lib/utils/cn';
import type { OrderStatus } from '@/types/database';

type OrderItem = {
  id: string;
  quantite: number;
  notes: string | null;
  menu_item: { nom: string; temps_preparation_min: number | null } | null;
};

type Order = {
  id: string;
  numero: string;
  type: 'sur_place' | 'room_service' | 'a_emporter';
  statut: OrderStatus;
  created_at: string;
  notes: string | null;
  table: { numero: string } | null;
  room: { numero: string } | null;
  items: OrderItem[];
};

type ServiceCall = {
  id: string;
  message: string | null;
  created_at: string;
  table: { numero: string; zone: string | null } | null;
};

const REFRESH_MS = 12000;

/** Bip court via Web Audio (pas de fichier asset). beeps = nombre de bips. */
function beep(beeps = 1) {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    let t = ctx.currentTime;
    for (let i = 0; i < beeps; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.start(t);
      o.stop(t + 0.37);
      t += 0.45;
    }
    setTimeout(() => ctx.close(), beeps * 500 + 200);
  } catch {
    /* audio non disponible */
  }
}

const COLS: { status: OrderStatus; label: string; color: string; icon: any }[] = [
  { status: 'nouvelle', label: 'Nouvelles', color: 'border-slate-300 bg-slate-50', icon: ClipboardList },
  { status: 'en_preparation', label: 'En préparation', color: 'border-amber-300 bg-amber-50', icon: ChefHat },
  { status: 'prete', label: 'Prêtes', color: 'border-emerald-300 bg-emerald-50', icon: Bell }
];

const TYPE_LABEL: Record<Order['type'], string> = {
  sur_place: 'Sur place',
  room_service: 'Room service',
  a_emporter: 'À emporter'
};

function elapsed(iso: string, now: number) {
  const min = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (min < 1) return '< 1 min';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;
}

export function KitchenBoard({ orders, calls = [] }: { orders: Order[]; calls?: ServiceCall[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [resolving, startResolve] = useTransition();
  const [now, setNow] = useState(Date.now());
  const [soundOn, setSoundOn] = useState(true);

  // Ids déjà connus (pour détecter les nouveautés sans réalerter)
  const knownOrderIds = useRef<Set<string> | null>(null);
  const knownCallIds = useRef<Set<string> | null>(null);
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  // Horloge (durées écoulées)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Auto-refresh des données serveur
  useEffect(() => {
    const t = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(t);
  }, [router]);

  // Détection nouvelles commandes
  useEffect(() => {
    const ids = new Set(orders.map((o) => o.id));
    if (knownOrderIds.current === null) {
      knownOrderIds.current = ids; // premier rendu : pas d'alerte
      return;
    }
    const fresh = orders.filter((o) => !knownOrderIds.current!.has(o.id));
    if (fresh.length > 0) {
      if (soundRef.current) beep(1);
      toast.success(
        fresh.length === 1 ? 'Nouvelle commande reçue' : `${fresh.length} nouvelles commandes`,
        { icon: '🍽️' }
      );
    }
    knownOrderIds.current = ids;
  }, [orders]);

  // Détection nouveaux appels serveur
  useEffect(() => {
    const ids = new Set(calls.map((c) => c.id));
    if (knownCallIds.current === null) {
      knownCallIds.current = ids;
      return;
    }
    const fresh = calls.filter((c) => !knownCallIds.current!.has(c.id));
    if (fresh.length > 0) {
      if (soundRef.current) beep(2);
      const tableNo = fresh[0].table?.numero;
      toast(tableNo ? `Appel serveur — Table ${tableNo}` : 'Appel serveur', { icon: '🔔' });
    }
    knownCallIds.current = ids;
  }, [calls]);

  function move(id: string, next: OrderStatus, msg: string) {
    start(async () => {
      const r = await updateOrderStatus(id, next);
      if (r.ok) toast.success(msg);
      else toast.error(r.error ?? 'Erreur');
    });
  }

  function resolveCall(id: string) {
    startResolve(async () => {
      const r = await resolveServiceCall(id);
      if (r.ok) {
        toast.success('Appel traité');
        router.refresh();
      } else toast.error(r.error ?? 'Erreur');
    });
  }

  const byStatus = new Map<OrderStatus, Order[]>();
  COLS.forEach((c) => byStatus.set(c.status, []));
  orders.forEach((o) => {
    if (byStatus.has(o.statut)) byStatus.get(o.statut)!.push(o);
  });

  return (
    <div className="space-y-4">
      {/* Barre d'état : son + indication live */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Live · actualisation auto
        </div>
        <button
          onClick={() => setSoundOn((s) => !s)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition',
            soundOn
              ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              : 'bg-slate-100 text-slate-400 border-slate-200'
          )}
          title={soundOn ? 'Couper le son' : 'Activer le son'}
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {soundOn ? 'Son activé' : 'Son coupé'}
        </button>
      </div>

      {/* Appels serveur en attente */}
      {calls.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <BellRing className="w-5 h-5 text-amber-600 animate-pulse" />
            <h3 className="font-bold text-amber-900">
              {calls.length === 1 ? 'Un client demande un serveur' : `${calls.length} appels serveur`}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {calls.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg pl-3 pr-2 py-2"
              >
                <div>
                  <div className="font-semibold text-slate-900 text-sm">
                    Table {c.table?.numero ?? '?'}
                    {c.table?.zone && <span className="text-slate-500 font-normal"> · {c.table.zone}</span>}
                  </div>
                  <div className="text-xs text-slate-500">{elapsed(c.created_at, now)}</div>
                  {c.message && <div className="text-xs text-amber-700 mt-0.5">📝 {c.message}</div>}
                </div>
                <button
                  onClick={() => resolveCall(c.id)}
                  disabled={resolving}
                  className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-60"
                >
                  <Check className="w-3.5 h-3.5" />
                  Traité
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLS.map((col) => {
        const list = byStatus.get(col.status) ?? [];
        return (
          <div key={col.status} className={cn('rounded-xl border-2 p-3 min-h-[60vh]', col.color)}>
            <div className="flex items-center gap-2 mb-3">
              <col.icon className="w-5 h-5" />
              <h3 className="font-bold text-slate-900">{col.label}</h3>
              <span className="ml-auto bg-white px-2 py-0.5 rounded text-xs font-semibold">{list.length}</span>
            </div>

            <div className="space-y-3">
              {list.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Aucune commande</p>
              ) : (
                list.map((o) => {
                  const localisation =
                    o.type === 'sur_place' ? `Table ${o.table?.numero ?? '?'}` :
                    o.type === 'room_service' ? `Ch. ${o.room?.numero ?? '?'}` :
                    'À emporter';
                  return (
                    <div key={o.id} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-mono text-xs text-slate-500">{o.numero}</div>
                          <div className="font-bold text-sm">{localisation}</div>
                        </div>
                        <div className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                          {elapsed(o.created_at, now)}
                        </div>
                      </div>

                      <ul className="text-sm space-y-1 mb-3">
                        {o.items?.map((it) => (
                          <li key={it.id}>
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold">{it.quantite}×</span>
                              <span>{it.menu_item?.nom}</span>
                            </div>
                            {it.notes && (
                              <div className="text-xs text-amber-700 ml-6">📝 {it.notes}</div>
                            )}
                          </li>
                        ))}
                      </ul>

                      {o.notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-1.5 text-xs mb-2">
                          {o.notes}
                        </div>
                      )}

                      {col.status === 'nouvelle' && (
                        <button
                          onClick={() => move(o.id, 'en_preparation', 'Démarrée')}
                          disabled={pending}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 rounded transition"
                        >
                          Commencer ▶
                        </button>
                      )}
                      {col.status === 'en_preparation' && (
                        <button
                          onClick={() => move(o.id, 'prete', 'Prête')}
                          disabled={pending}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 rounded transition"
                        >
                          Marquer prête ✓
                        </button>
                      )}
                      {col.status === 'prete' && (
                        <button
                          onClick={() => move(o.id, 'servie', 'Servie')}
                          disabled={pending}
                          className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded transition"
                        >
                          Servie 🍽️
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
