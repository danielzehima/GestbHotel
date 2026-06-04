'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type Country = { nom: string; code: string };

export const COUNTRIES: Country[] = [
  { nom: 'Côte d\'Ivoire', code: 'ci' },
  { nom: 'Sénégal',        code: 'sn' },
  { nom: 'Mali',           code: 'ml' },
  { nom: 'Burkina Faso',   code: 'bf' },
  { nom: 'Bénin',          code: 'bj' },
  { nom: 'Togo',           code: 'tg' },
  { nom: 'Niger',          code: 'ne' },
  { nom: 'Guinée',         code: 'gn' },
  { nom: 'Ghana',          code: 'gh' },
  { nom: 'Nigeria',        code: 'ng' },
  { nom: 'Cameroun',       code: 'cm' },
  { nom: 'Gabon',          code: 'ga' },
  { nom: 'Congo',          code: 'cg' },
  { nom: 'RD Congo',       code: 'cd' },
  { nom: 'Maroc',          code: 'ma' },
  { nom: 'Tunisie',        code: 'tn' },
  { nom: 'Algérie',        code: 'dz' },
  { nom: 'Mauritanie',     code: 'mr' },
  { nom: 'France',         code: 'fr' },
  { nom: 'Belgique',       code: 'be' },
  { nom: 'Suisse',         code: 'ch' },
  { nom: 'Canada',         code: 'ca' }
];

function flagUrl(code: string, size = 24) {
  return `https://flagcdn.com/${size}x18/${code}.png`;
}

export function CountrySelect({
  name,
  defaultValue,
  required
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(defaultValue ?? COUNTRIES[0].nom);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selected = COUNTRIES.find((c) => c.nom === value) ?? COUNTRIES[0];

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name={name} value={value} required={required} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:border-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition text-sm"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={flagUrl(selected.code)}
          width={24}
          height={18}
          alt=""
          className="rounded-sm border border-slate-200"
        />
        <span className="flex-1 text-left text-slate-900">{selected.nom}</span>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-lg">
          {COUNTRIES.map((c) => {
            const active = c.nom === value;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setValue(c.nom);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50',
                  active && 'bg-brand-50 text-brand-700'
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={flagUrl(c.code)}
                  width={24}
                  height={18}
                  alt=""
                  className="rounded-sm border border-slate-200"
                />
                <span className="flex-1">{c.nom}</span>
                {active && <Check className="w-4 h-4 text-brand-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
