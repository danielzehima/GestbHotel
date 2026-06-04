'use client';

import { useEffect, useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clockIn, clockOut } from './actions';

type Open = { id: string; pointage_in: string } | null;

function formatElapsed(start: string, now: number) {
  const sec = Math.max(0, Math.floor((now - new Date(start).getTime()) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ClockWidget({ openClock }: { openClock: Open }) {
  const [pending, start] = useTransition();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!openClock) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [openClock]);

  function onIn() {
    start(async () => {
      const r = await clockIn();
      if (r.ok) toast.success('Entrée pointée');
      else toast.error(r.error);
    });
  }

  function onOut() {
    if (!openClock) return;
    start(async () => {
      const r = await clockOut(openClock.id);
      if (r.ok) toast.success('Sortie pointée');
      else toast.error(r.error);
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
      {openClock ? (
        <>
          <p className="text-slate-500 text-sm mb-2">En service depuis</p>
          <div className="text-5xl font-mono font-bold text-emerald-600 tabular-nums mb-6">
            {formatElapsed(openClock.pointage_in, now)}
          </div>
          <Button onClick={onOut} disabled={pending} variant="danger" size="md">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Pointer la sortie
          </Button>
        </>
      ) : (
        <>
          <p className="text-slate-500 text-sm mb-6">Vous n'êtes pas pointé en ce moment.</p>
          <Button onClick={onIn} disabled={pending} size="md">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Pointer l'entrée
          </Button>
        </>
      )}
    </div>
  );
}
