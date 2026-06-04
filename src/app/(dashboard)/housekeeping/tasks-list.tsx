'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Play, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import {
  assignTask,
  startTask,
  completeTask,
  verifyTask,
  deleteTask
} from './actions';
import type { UserRole } from '@/types/database';

type Task = {
  id: string;
  statut: 'a_faire' | 'en_cours' | 'terminee' | 'verifiee';
  priorite: number;
  description: string | null;
  date_prevue: string;
  debut_at: string | null;
  fin_at: string | null;
  room: { id: string; numero: string; etage: number | null } | null;
  assignee: { id: string; nom: string; prenom: string } | null;
};

type Staff = { id: string; nom: string; prenom: string; role: UserRole };

const STATUS_COLORS: Record<Task['statut'], string> = {
  a_faire: 'bg-slate-100 text-slate-700',
  en_cours: 'bg-amber-100 text-amber-700',
  terminee: 'bg-emerald-100 text-emerald-700',
  verifiee: 'bg-brand-100 text-brand-700'
};

const STATUS_LABELS: Record<Task['statut'], string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  terminee: 'Terminée',
  verifiee: 'Vérifiée'
};

const PRIORITE_LABELS: Record<number, string> = {
  1: 'Normale',
  2: 'Élevée',
  3: 'Urgente'
};

export function TasksList({
  tasks,
  staff,
  currentUserId,
  currentRole
}: {
  tasks: Task[];
  staff: Staff[];
  currentUserId: string;
  currentRole: UserRole;
}) {
  const [pending, start] = useTransition();
  const canAssign = currentRole === 'admin' || currentRole === 'receptionniste';
  const canVerify = canAssign;
  const canDelete = canAssign;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(success);
      else toast.error(r.error ?? 'Erreur');
    });
  }

  return (
    <div className="space-y-2">
      {tasks.map((t) => {
        const isAssignedToMe = t.assignee?.id === currentUserId;
        const canStart = (currentRole === 'menage' && isAssignedToMe) || canAssign;
        return (
          <div
            key={t.id}
            className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4"
          >
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-slate-900">
                  Ch. {t.room?.numero ?? '—'}
                </span>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[t.statut])}>
                  {STATUS_LABELS[t.statut]}
                </span>
                {t.priorite >= 2 && (
                  <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    {PRIORITE_LABELS[t.priorite]}
                  </span>
                )}
              </div>
              {t.description && (
                <p className="text-sm text-slate-600 mt-1">{t.description}</p>
              )}
              {t.assignee && (
                <p className="text-xs text-slate-500 mt-1">
                  Assignée à : <span className="font-medium">{t.assignee.prenom} {t.assignee.nom}</span>
                </p>
              )}
            </div>

            {canAssign && (
              <select
                value={t.assignee?.id ?? ''}
                disabled={pending}
                onChange={(e) => run(() => assignTask(t.id, e.target.value), 'Assignée')}
                className="text-xs px-2 py-1.5 rounded border border-slate-200 bg-slate-50"
              >
                <option value="">— Non assignée —</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.prenom} {s.nom} ({s.role})
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-2">
              {t.statut === 'a_faire' && canStart && (
                <Button
                  size="sm"
                  onClick={() => run(() => startTask(t.id), 'Démarrée')}
                  disabled={pending}
                >
                  <Play className="w-3.5 h-3.5" />
                  Démarrer
                </Button>
              )}
              {t.statut === 'en_cours' && (canStart || isAssignedToMe) && (
                <Button
                  size="sm"
                  onClick={() => run(() => completeTask(t.id), 'Terminée')}
                  disabled={pending}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Terminer
                </Button>
              )}
              {t.statut === 'terminee' && canVerify && (
                <Button
                  size="sm"
                  onClick={() => run(() => verifyTask(t.id), 'Vérifiée — chambre disponible')}
                  disabled={pending}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Vérifier
                </Button>
              )}
              {canDelete && t.statut !== 'verifiee' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Supprimer cette tâche ?'))
                      run(() => deleteTask(t.id), 'Supprimée');
                  }}
                  disabled={pending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
