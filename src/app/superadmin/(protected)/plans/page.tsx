import { CreditCard, Info } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { getPlanPrices } from '@/lib/plan-prices';
import { PlanEditor } from './plan-editor';

export const metadata = { title: 'Tarifs — Super Admin' };
export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const prices = await getPlanPrices();

  return (
    <div>
      <PageHeader
        title="Tarifs des forfaits"
        description="Modifiez à tout moment les prix, descriptions et fonctionnalités. Les changements sont visibles immédiatement sur la landing page et la page d'upgrade."
      />

      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-sm text-brand-900">
        <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          Ces tarifs sont utilisés à 3 endroits :
          <ul className="list-disc list-inside ml-2 mt-1">
            <li><strong>Landing page</strong> (visible par les visiteurs)</li>
            <li><strong>Page d'upgrade</strong> côté hôtel</li>
            <li><strong>Calcul du MRR</strong> dans le tableau de bord superadmin</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {prices.map((p) => (
          <PlanEditor key={p.plan} initial={p} />
        ))}
      </div>
    </div>
  );
}
