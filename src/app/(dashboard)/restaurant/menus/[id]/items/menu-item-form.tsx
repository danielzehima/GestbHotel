'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { upsertMenuItem } from '../../actions';

const CATEGORIES = [
  { v: 'entree', l: 'Entrée' },
  { v: 'plat', l: 'Plat' },
  { v: 'dessert', l: 'Dessert' },
  { v: 'boisson', l: 'Boisson' },
  { v: 'petit_dejeuner', l: 'Petit-déjeuner' },
  { v: 'menu_enfant', l: 'Menu enfant' },
  { v: 'special', l: 'Spécial' }
] as const;

type Item = {
  id: string;
  nom: string;
  description: string | null;
  categorie: string;
  prix: number;
  allergenes: string[];
  disponible: boolean;
  temps_preparation_min: number | null;
  ordre: number;
};

export function MenuItemForm({ menuId, initial }: { menuId: string; initial?: Item }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await upsertMenuItem(fd, initial?.id);
      if (r.ok) {
        toast.success(initial ? 'Plat mis à jour' : 'Plat ajouté');
        router.push(`/restaurant/menus/${menuId}`);
      } else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-4">
      <input type="hidden" name="menu_id" value={menuId} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom du plat" required>
          <Input name="nom" defaultValue={initial?.nom} required maxLength={150} placeholder="Poulet braisé" />
        </Field>
        <Field label="Catégorie" required>
          <Select name="categorie" defaultValue={initial?.categorie ?? 'plat'} required>
            {CATEGORIES.map((c) => (
              <option key={c.v} value={c.v}>{c.l}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Description">
        <Textarea name="description" defaultValue={initial?.description ?? ''} placeholder="Ingrédients, suggestion d'accompagnement…" />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Prix (XOF)" required>
          <Input name="prix" type="number" min={0} step={100} defaultValue={initial?.prix ?? 0} required />
        </Field>
        <Field label="Temps préparation (min)">
          <Input name="temps_preparation_min" type="number" min={0} max={180} defaultValue={initial?.temps_preparation_min ?? ''} />
        </Field>
        <Field label="Ordre d'affichage">
          <Input name="ordre" type="number" defaultValue={initial?.ordre ?? 0} />
        </Field>
      </div>

      <Field label="Allergènes" hint="Séparés par des virgules (gluten, arachide, fruits de mer…)">
        <Input name="allergenes" defaultValue={initial?.allergenes?.join(', ')} />
      </Field>

      <Field label="Disponible">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="disponible" defaultChecked={initial?.disponible ?? true} value="true" />
          Affiché aux clients et commandable
        </label>
      </Field>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </div>
    </form>
  );
}
