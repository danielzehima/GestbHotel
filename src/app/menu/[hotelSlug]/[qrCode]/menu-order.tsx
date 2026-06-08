'use client';

import { useMemo, useState, useTransition } from 'react';
import { Plus, Minus, ShoppingCart, X, Loader2, CheckCircle2, Utensils, BellRing } from 'lucide-react';
import { formatMoney } from '@/lib/utils/format';
import { createPublicOrder, callWaiter } from './actions';

export type MenuItem = {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  allergenes: string[];
  temps_preparation_min: number | null;
};

export type MenuCategory = {
  cat: string;
  label: string;
  items: MenuItem[];
};

export function MenuOrder({
  categories,
  hotelSlug,
  qrCode,
  devise,
  tableLabel
}: {
  categories: MenuCategory[];
  hotelSlug: string;
  qrCode: string;
  devise: string;
  tableLabel: string;
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [callPending, startCall] = useTransition();
  const [called, setCalled] = useState(false);

  function call() {
    setCalled(false);
    startCall(async () => {
      const r = await callWaiter({ hotelSlug, qrCode });
      if (r.ok) {
        setCalled(true);
        setTimeout(() => setCalled(false), 6000);
      } else {
        setError(r.error);
      }
    });
  }

  const itemById = useMemo(() => {
    const m = new Map<string, MenuItem>();
    categories.forEach((c) => c.items.forEach((i) => m.set(i.id, i)));
    return m;
  }, [categories]);

  const cartLines = Object.entries(qty).filter(([, q]) => q > 0);
  const totalItems = cartLines.reduce((s, [, q]) => s + q, 0);
  const totalPrice = cartLines.reduce((s, [id, q]) => {
    const it = itemById.get(id);
    return s + (it ? Number(it.prix) * q : 0);
  }, 0);

  function inc(id: string) {
    setQty((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  }
  function dec(id: string) {
    setQty((p) => {
      const next = Math.max(0, (p[id] ?? 0) - 1);
      const cp = { ...p, [id]: next };
      if (next === 0) delete cp[id];
      return cp;
    });
  }

  function submit() {
    if (cartLines.length === 0) return;
    setError(null);
    start(async () => {
      const r = await createPublicOrder({
        hotelSlug,
        qrCode,
        notes: generalNotes,
        items: cartLines.map(([id, q]) => ({
          menu_item_id: id,
          quantite: q,
          notes: itemNotes[id] || undefined
        }))
      });
      if (r.ok) {
        setDone(r.numero);
        setQty({});
        setItemNotes({});
        setGeneralNotes('');
        setCartOpen(false);
      } else {
        setError(r.error);
      }
    });
  }

  // ----- Écran de confirmation -----
  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-10 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Commande envoyée !</h2>
        <p className="text-slate-600">
          Votre commande <strong className="font-mono">{done}</strong> a bien été transmise en cuisine.
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Un serveur vous l'apportera à la {tableLabel.toLowerCase()}. Merci !
        </p>
        <button
          onClick={() => setDone(null)}
          className="mt-6 inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-5 py-3 rounded-xl hover:bg-brand-700 transition"
        >
          <Utensils className="w-4 h-4" />
          Commander à nouveau
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Notre carte</h2>
        <p className="text-slate-600 mb-4">
          Ajoutez vos plats au panier, puis envoyez votre commande directement en cuisine.
        </p>

        {/* Appeler le serveur (si le client ne veut pas commander en ligne) */}
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">Vous préférez commander de vive voix ?</p>
            {called ? (
              <p className="text-sm text-emerald-600 font-medium">✓ Un serveur arrive à votre table</p>
            ) : (
              <p className="text-xs text-slate-500">Appelez un serveur à votre table.</p>
            )}
          </div>
          <button
            onClick={call}
            disabled={callPending || called}
            className="shrink-0 inline-flex items-center gap-2 bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-amber-600 active:scale-95 transition disabled:opacity-60"
          >
            {callPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
            {called ? 'Serveur appelé' : 'Appeler le serveur'}
          </button>
        </div>

        <div className="space-y-8">
          {categories.map((c) => (
            <section key={c.cat}>
              <h3 className="text-lg font-bold text-slate-900 mb-3 sticky top-16 bg-gradient-to-b from-brand-50 to-brand-50/80 py-2 -mx-4 px-4 z-[1]">
                {c.label}
              </h3>
              <div className="space-y-3">
                {c.items.map((item) => {
                  const q = qty[item.id] ?? 0;
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl border p-4 transition ${
                        q > 0 ? 'border-brand-400 ring-1 ring-brand-200' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900">{item.nom}</h4>
                          {item.description && (
                            <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                          )}
                          {item.allergenes?.length > 0 && (
                            <p className="text-xs text-amber-700 mt-1">
                              Allergènes : {item.allergenes.join(', ')}
                            </p>
                          )}
                          {item.temps_preparation_min && (
                            <p className="text-xs text-slate-400 mt-1">⏱ ~{item.temps_preparation_min} min</p>
                          )}
                          <div className="font-bold text-brand-700 mt-2">
                            {formatMoney(Number(item.prix), devise)}
                          </div>
                        </div>

                        {/* Contrôle quantité */}
                        <div className="shrink-0">
                          {q === 0 ? (
                            <button
                              onClick={() => inc(item.id)}
                              className="inline-flex items-center gap-1 bg-brand-600 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-brand-700 active:scale-95 transition"
                            >
                              <Plus className="w-4 h-4" />
                              Ajouter
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg p-1">
                              <button
                                onClick={() => dec(item.id)}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-brand-700 active:scale-95 transition shadow-sm"
                                aria-label="Retirer un"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-bold text-brand-900 w-5 text-center">{q}</span>
                              <button
                                onClick={() => inc(item.id)}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-brand-700 active:scale-95 transition shadow-sm"
                                aria-label="Ajouter un"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-12 text-center text-xs text-slate-400">
          Propulsé par <strong>GestHotel</strong>
        </footer>
      </div>

      {/* Barre panier fixe */}
      {totalItems > 0 && !cartOpen && (
        <div className="fixed bottom-0 inset-x-0 z-30 p-3 bg-gradient-to-t from-white via-white to-transparent">
          <button
            onClick={() => setCartOpen(true)}
            className="max-w-2xl mx-auto w-full flex items-center justify-between gap-3 bg-brand-600 text-white font-semibold px-5 py-4 rounded-2xl shadow-lg hover:bg-brand-700 active:scale-[0.99] transition"
          >
            <span className="flex items-center gap-2">
              <span className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 bg-white text-brand-700 text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              </span>
              Voir ma commande
            </span>
            <span>{formatMoney(totalPrice, devise)}</span>
          </button>
        </div>
      )}

      {/* Panneau panier */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-t-2xl max-h-[88vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900">Ma commande · {tableLabel}</h3>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 -mr-2 text-slate-500 hover:text-slate-900"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {cartLines.map(([id, q]) => {
                const it = itemById.get(id);
                if (!it) return null;
                return (
                  <div key={id} className="border border-slate-100 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900">{it.nom}</div>
                        <div className="text-sm text-slate-500">
                          {formatMoney(Number(it.prix), devise)} × {q} ={' '}
                          <span className="font-semibold text-slate-700">
                            {formatMoney(Number(it.prix) * q, devise)}
                          </span>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 shrink-0">
                        <button
                          onClick={() => dec(id)}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-slate-700 shadow-sm active:scale-95"
                          aria-label="Retirer un"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold w-5 text-center">{q}</span>
                        <button
                          onClick={() => inc(id)}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-slate-700 shadow-sm active:scale-95"
                          aria-label="Ajouter un"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={itemNotes[id] ?? ''}
                      onChange={(e) => setItemNotes((p) => ({ ...p, [id]: e.target.value }))}
                      placeholder="Note (ex. sans oignon, bien cuit…)"
                      maxLength={200}
                      className="mt-2 w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
                    />
                  </div>
                );
              })}

              <div>
                <label className="text-sm font-medium text-slate-700">Remarque générale</label>
                <textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Allergies, demande particulière…"
                  rows={2}
                  maxLength={500}
                  className="mt-1 w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {error}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4 shrink-0 space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatMoney(totalPrice, devise)}</span>
              </div>
              <button
                onClick={submit}
                disabled={pending || cartLines.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-5 py-4 rounded-xl hover:bg-brand-700 active:scale-[0.99] transition disabled:opacity-60"
              >
                {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Utensils className="w-5 h-5" />}
                Envoyer la commande
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
