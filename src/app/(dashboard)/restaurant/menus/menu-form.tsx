'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { upsertMenu, deleteMenu } from './actions';

type Menu = {
  id: string;
  nom: string;
  description: string | null;
  actif: boolean;
};

export function MenuForm({ initial, canDelete }: { initial?: Menu; canDelete?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleting, startDel] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await upsertMenu(fd, initial?.id);
      if (r.ok) {
        toast.success(initial ? 'Menu mis à jour' : 'Menu créé');
        const target = initial
          ? `/restaurant/menus/${initial.id}`
          : 'data' in r && r.data ? `/restaurant/menus/${r.data.id}` : '/restaurant/menus';
        router.push(target);
      } else toast.error(r.error);
    });
  }

  function onDelete() {
    if (!initial) return;
    if (!confirm('Supprimer ce menu et tous ses plats ?')) return;
    startDel(async () => {
      const r = await deleteMenu(initial.id);
      if (r.ok) {
        toast.success('Menu supprimé');
        router.push('/restaurant/menus');
      } else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-4">
      <Field label="Nom du menu" required>
        <Input name="nom" defaultValue={initial?.nom} required maxLength={100} placeholder="Carte midi" />
      </Field>
      <Field label="Description">
        <Textarea name="description" defaultValue={initial?.description ?? ''} />
      </Field>
      <Field label="Menu actif">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="actif" defaultChecked={initial?.actif ?? true} value="true" />
          Visible et utilisable
        </label>
      </Field>

      <div className="flex justify-between pt-2 border-t border-slate-100">
        <div>
          {initial && canDelete && (
            <Button type="button" variant="danger" onClick={onDelete} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Supprimer
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </div>
    </form>
  );
}
