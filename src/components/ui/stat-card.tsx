import { cn } from '@/lib/utils/cn';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand'
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'brand' | 'emerald' | 'amber' | 'rose';
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700'
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', tones[tone])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
