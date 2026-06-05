import Link from 'next/link';
import { Receipt, Plus } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InvoiceStatusBadge, INVOICE_STATUS_LABELS } from '@/components/ui/invoice-status-badge';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export const metadata = { title: 'Factures — GestHotel' };

type SearchParams = { statut?: string };

export default async function InvoicesPage(props: { searchParams: Promise<SearchParams> }) {
  const user = await requireRole(['admin', 'receptionniste', 'comptable']);
  const { statut } = await props.searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('invoices')
    .select('id, numero, statut, total, montant_paye, date_emission, guest:guests(nom, prenom)')
    .eq('hotel_id', user.profile.hotel_id!)
    .order('date_emission', { ascending: false })
    .limit(100);

  if (statut && statut !== 'all') query = query.eq('statut', statut);

  const { data: invoices } = await query;

  // KPIs
  const { data: kpiData } = await supabase
    .from('invoices')
    .select('total, montant_paye, statut')
    .eq('hotel_id', user.profile.hotel_id!)
    .neq('statut', 'annulee');

  const totalFacture = (kpiData ?? []).reduce((s, i) => s + Number(i.total), 0);
  const totalEncaisse = (kpiData ?? []).reduce((s, i) => s + Number(i.montant_paye), 0);
  const restant = totalFacture - totalEncaisse;

  return (
    <div>
      <PageHeader
        title="Facturation"
        description="Factures émises et paiements."
        actions={
          <Link href="/invoices/new">
            <Button>
              <Plus className="w-4 h-4" />
              Nouvelle facture
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total facturé</p>
          <p className="text-xl font-bold mt-1">{formatMoney(totalFacture)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Encaissé</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatMoney(totalEncaisse)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Restant dû</p>
          <p className={cn('text-xl font-bold mt-1', restant > 0 ? 'text-red-600' : 'text-emerald-600')}>
            {formatMoney(restant)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', 'emise', 'partiellement_payee', 'payee', 'annulee'] as const).map((s) => {
          const active = (statut ?? 'all') === s;
          return (
            <Link
              key={s}
              href={s === 'all' ? '/invoices' : `/invoices?statut=${s}`}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition',
                active
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {s === 'all' ? 'Toutes' : INVOICE_STATUS_LABELS[s as keyof typeof INVOICE_STATUS_LABELS]}
            </Link>
          );
        })}
      </div>

      {!invoices || invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aucune facture"
          description="Créez votre première facture ou générez-la depuis une réservation."
          action={
            <Link href="/invoices/new">
              <Button>
                <Plus className="w-4 h-4" />
                Nouvelle facture
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">N°</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Émission</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-right px-4 py-3">Payé</th>
                <th className="text-center px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((i: any) => {
                const restant = Number(i.total) - Number(i.montant_paye);
                return (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{i.numero}</td>
                    <td className="px-4 py-3 font-medium">{i.guest ? `${i.guest.prenom} ${i.guest.nom}` : '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(i.date_emission)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMoney(Number(i.total))}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={restant > 0 ? 'text-slate-500' : 'text-emerald-600'}>
                        {formatMoney(Number(i.montant_paye))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center"><InvoiceStatusBadge status={i.statut} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/invoices/${i.id}`} className="text-brand-600 hover:underline text-xs font-medium">
                        Détails →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
