'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { CountrySelect } from '@/components/ui/country-select';
import { updateHotel } from './actions';

type Hotel = {
  nom: string;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  telephone: string | null;
  email: string | null;
  devise: string;
  logo_url: string | null;
  slug: string;
};

const DEVISES = [
  { v: 'XOF', l: 'Franc CFA (XOF)' },
  { v: 'EUR', l: 'Euro (EUR)' },
  { v: 'USD', l: 'Dollar US (USD)' },
  { v: 'GBP', l: 'Livre sterling (GBP)' },
  { v: 'XAF', l: 'Franc CFA Afrique Centrale (XAF)' },
  { v: 'MAD', l: 'Dirham marocain (MAD)' }
];

export function HotelForm({ initial }: { initial: Hotel }) {
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await updateHotel(fd);
      if (r.ok) toast.success('Hôtel mis à jour');
      else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="bg-slate-50 rounded-lg p-3 text-sm">
        <span className="text-slate-500">Identifiant URL (slug) :</span>{' '}
        <span className="font-mono font-medium">{initial.slug}</span>
        <p className="text-xs text-slate-400 mt-1">Utilisé dans l'URL du menu QR. Non modifiable.</p>
      </div>

      <Field label="Nom de l'hôtel" required>
        <Input name="nom" defaultValue={initial.nom} required maxLength={150} />
      </Field>

      <Field label="Logo (URL)" hint="Lien vers une image publique (apparaît sur le menu QR)">
        <Input name="logo_url" type="url" defaultValue={initial.logo_url ?? ''} placeholder="https://..." />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Téléphone">
          <Input name="telephone" defaultValue={initial.telephone ?? ''} placeholder="+225 27 22 00 00 00" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" defaultValue={initial.email ?? ''} />
        </Field>
      </div>

      <Field label="Adresse">
        <Textarea name="adresse" defaultValue={initial.adresse ?? ''} placeholder="Boulevard Lagunaire, Cocody…" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ville">
          <Input name="ville" defaultValue={initial.ville ?? ''} />
        </Field>
        <Field label="Pays">
          <CountrySelect name="pays" defaultValue={initial.pays ?? 'Côte d\'Ivoire'} />
        </Field>
      </div>

      <Field label="Devise" required hint="Apparaît sur factures et menus">
        <Select name="devise" defaultValue={initial.devise} required>
          {DEVISES.map((d) => <option key={d.v} value={d.v}>{d.l}</option>)}
        </Select>
      </Field>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
