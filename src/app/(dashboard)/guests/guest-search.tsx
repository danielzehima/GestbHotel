'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Search, Loader2 } from 'lucide-react';

export function GuestSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [pending, start] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    // Ne pas relancer au premier rendu (la page est déjà filtrée côté serveur)
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const q = value.trim();
      start(() => {
        router.replace(q ? `/guests?q=${encodeURIComponent(q)}` : '/guests');
      });
    }, 300);
    return () => clearTimeout(t);
  }, [value, router]);

  return (
    <div className="relative w-full max-w-md mb-4">
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Rechercher nom, email, téléphone…"
        className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
      />
      {pending && (
        <Loader2 className="w-4 h-4 text-brand-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
      )}
    </div>
  );
}
