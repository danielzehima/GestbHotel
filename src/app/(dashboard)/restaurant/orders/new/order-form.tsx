'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea, Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/utils/format';
import { createOrder } from '../actions';

type Item = { id: string; nom: string; prix: number; categorie: string };
type Table = { id: string; numero: string; zone: string | null };
type Room = { id: string; numero: string };
type CartItem = { menu_item_id: string; nom: string; quantite: number; prix_unitaire: number; notes: string };

const CAT_LABELS: Record<string, string> = {
  entree: 'Entrées', plat: 'Plats', dessert: 'Desserts', boisson: 'Boissons',
  petit_dejeuner: 'Petit-déj', menu_enfant: 'Enfant', special: 'Spéciaux'
};

export function OrderForm({
  menuItems,
  tables,
  rooms
}: {
  menuItems: Item[];
  tables: Table[];
  rooms: Room[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [type, setType] = useState<'sur_place' | 'room_service' | 'a_emporter'>('sur_place');
  const [tableId, setTableId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  const grouped = useMemo(() => {
    const g = new Map<string, Item[]>();
    menuItems.forEach((i) => {
      if (!g.has(i.categorie)) g.set(i.categorie, []);
      g.get(i.categorie)!.push(i);
    });
    return g;
  }, [menuItems]);

  const total = cart.reduce((s, c) => s + c.quantite * c.prix_unitaire, 0);

  function addItem(item: Item) {
    setCart((prev) => {
      const existing = prev.find((p) => p.menu_item_id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.menu_item_id === item.id ? { ...p, quantite: p.quantite + 1 } : p
        );
      }
      return [...prev, { menu_item_id: item.id, nom: item.nom, quantite: 1, prix_unitaire: Number(item.prix), notes: '' }];
    });
  }

  function changeQty(idx: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c, i) => (i === idx ? { ...c, quantite: c.quantite + delta } : c))
        .filter((c) => c.quantite > 0)
    );
  }

  function removeItem(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function setItemNotes(idx: number, n: string) {
    setCart((prev) => prev.map((c, i) => (i === idx ? { ...c, notes: n } : c)));
  }

  function onSubmit() {
    if (cart.length === 0) {
      toast.error('Ajoutez au moins un plat');
      return;
    }
    if (type === 'sur_place' && !tableId) {
      toast.error('Sélectionnez une table');
      return;
    }
    if (type === 'room_service' && !roomId) {
      toast.error('Sélectionnez une chambre');
      return;
    }
    start(async () => {
      const r = await createOrder({
        type,
        table_id: type === 'sur_place' ? tableId : null,
        room_id: type === 'room_service' ? roomId : null,
        notes,
        items: cart.map(({ nom: _n, ...rest }) => rest)
      });
      if (r.ok) {
        toast.success('Commande créée');
        const target = 'data' in r && r.data ? `/restaurant/orders/${r.data.id}` : '/restaurant/orders';
        router.push(target);
      } else toast.error(r.error);
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Catalogue */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <Field label="Type de commande" required>
            <Select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="sur_place">Sur place (table)</option>
              <option value="room_service">Room service (chambre)</option>
              <option value="a_emporter">À emporter</option>
            </Select>
          </Field>

          {type === 'sur_place' && (
            <Field label="Table" required>
              <Select value={tableId} onChange={(e) => setTableId(e.target.value)} required>
                <option value="">— Sélectionner —</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.numero} {t.zone && `· ${t.zone}`}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {type === 'room_service' && (
            <Field label="Chambre" required>
              <Select value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
                <option value="">— Sélectionner —</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>Ch. {r.numero}</option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        {Array.from(grouped.entries()).map(([cat, items]) => (
          <section key={cat}>
            <h3 className="font-bold text-slate-900 mb-2">{CAT_LABELS[cat] ?? cat}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => addItem(it)}
                  className="text-left bg-white border border-slate-200 rounded-lg p-3 hover:border-brand-400 hover:shadow transition"
                >
                  <div className="font-semibold text-slate-900 text-sm">{it.nom}</div>
                  <div className="text-xs text-brand-600 font-medium mt-1">
                    {formatMoney(Number(it.prix))}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}

        {menuItems.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
            Aucun plat disponible. Ajoutez d'abord des plats dans <strong>Cartes & Menus</strong>.
          </div>
        )}
      </div>

      {/* Panier */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-900 mb-3">Commande</h3>
          {cart.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Cliquez sur un plat pour l'ajouter</p>
          ) : (
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {cart.map((c, idx) => (
                <div key={c.menu_item_id} className="border border-slate-100 rounded-lg p-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{c.nom}</div>
                      <div className="text-xs text-slate-500">{formatMoney(c.prix_unitaire)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => changeQty(idx, -1)} className="p-1 bg-slate-100 rounded">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-semibold w-6 text-center">{c.quantite}</span>
                      <button onClick={() => changeQty(idx, 1)} className="p-1 bg-slate-100 rounded">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeItem(idx)} className="p-1 text-red-500 ml-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <Input
                    placeholder="Notes (sans oignon…)"
                    value={c.notes}
                    onChange={(e) => setItemNotes(idx, e.target.value)}
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          <Field label="Notes générales">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, demandes spéciales…" />
          </Field>

          <div className="border-t border-slate-100 pt-3 mt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>

          <Button onClick={onSubmit} disabled={pending || cart.length === 0} className="w-full mt-3">
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            Envoyer en cuisine
          </Button>
        </div>
      </div>
    </div>
  );
}
