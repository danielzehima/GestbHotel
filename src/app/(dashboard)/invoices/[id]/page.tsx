import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Printer, XCircle } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { InvoiceStatusBadge } from '@/components/ui/invoice-status-badge';
import { formatMoney, formatDate, formatDateTime } from '@/lib/utils/format';
import { PaymentForm } from './payment-form';
import { CancelInvoice } from './cancel-invoice';
import { getHotelPlanLimits } from '@/lib/plan-limits';

export const metadata = { title: 'Facture — GestHotel' };

const PAY_METHOD_LABELS: Record<string, string> = {
  especes: 'Espèces',
  carte: 'Carte',
  wave: 'Wave',
  orange_money: 'Orange Money',
  mtn_money: 'MTN Money',
  moov_money: 'Moov Money',
  virement: 'Virement'
};

export default async function InvoiceDetailPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['admin', 'receptionniste', 'comptable']);
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: hotel }] = await Promise.all([
    supabase
      .from('invoices')
      .select(`*,
        guest:guests(nom, prenom, email, telephone, adresse, nationalite),
        lines:invoice_lines(id, libelle, quantite, prix_unitaire, total),
        payments(id, methode, montant, reference_transaction, encaisse_at, statut)`)
      .eq('id', id)
      .eq('hotel_id', user.profile.hotel_id!)
      .single(),
    supabase
      .from('hotels')
      .select('nom, adresse, ville, pays, telephone, email, devise')
      .eq('id', user.profile.hotel_id!)
      .single()
  ]);

  if (!invoice) notFound();
  const inv = invoice as any;
  const h = hotel as any;
  const restant = Number(inv.total) - Number(inv.montant_paye);

  // Limites du plan pour filtrer les méthodes Mobile Money
  const { limits } = await getHotelPlanLimits(user.profile.hotel_id!);
  const canCancel = (user.profile.role === 'admin' || user.profile.role === 'comptable') && inv.statut !== 'annulee' && inv.statut !== 'payee';

  return (
    <div>
      <div className="print:hidden">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Toutes les factures
        </Link>

        <PageHeader
          title={
            <span className="flex items-center gap-3">
              Facture {inv.numero}
              <InvoiceStatusBadge status={inv.statut} />
            </span>
          }
          actions={
            <>
              <a href={`/invoices/${id}/print`} target="_blank" rel="noopener">
                <Button variant="secondary">
                  <Printer className="w-4 h-4" />
                  Imprimer
                </Button>
              </a>
              {canCancel && <CancelInvoice id={inv.id} />}
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Facture (imprimable) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-8 print:border-0 print:p-0">
          <div className="flex justify-between mb-8 border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{h?.nom}</h2>
              {h?.adresse && <p className="text-sm text-slate-600">{h.adresse}</p>}
              {(h?.ville || h?.pays) && <p className="text-sm text-slate-600">{[h.ville, h.pays].filter(Boolean).join(', ')}</p>}
              {h?.telephone && <p className="text-sm text-slate-600">{h.telephone}</p>}
              {h?.email && <p className="text-sm text-slate-600">{h.email}</p>}
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-brand-700">FACTURE</h1>
              <p className="font-mono text-sm text-slate-600 mt-1">{inv.numero}</p>
              <p className="text-sm text-slate-500 mt-1">Émise le {formatDate(inv.date_emission)}</p>
              {inv.date_echeance && (
                <p className="text-sm text-slate-500">Échéance : {formatDate(inv.date_echeance)}</p>
              )}
            </div>
          </div>

          {inv.guest && (
            <div className="mb-6">
              <h3 className="text-xs uppercase text-slate-500 font-semibold mb-1">Facturé à</h3>
              <p className="font-medium">{inv.guest.prenom} {inv.guest.nom}</p>
              {inv.guest.email && <p className="text-sm text-slate-600">{inv.guest.email}</p>}
              {inv.guest.telephone && <p className="text-sm text-slate-600">{inv.guest.telephone}</p>}
              {inv.guest.adresse && <p className="text-sm text-slate-600 whitespace-pre-line">{inv.guest.adresse}</p>}
            </div>
          )}

          <table className="w-full mb-6">
            <thead className="border-b-2 border-slate-300">
              <tr className="text-xs uppercase text-slate-500">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2 w-20">Qté</th>
                <th className="text-right py-2 w-32">Prix unit.</th>
                <th className="text-right py-2 w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.lines?.map((l: any) => (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="py-3 text-sm">{l.libelle}</td>
                  <td className="py-3 text-sm text-right">{l.quantite}</td>
                  <td className="py-3 text-sm text-right">{formatMoney(Number(l.prix_unitaire))}</td>
                  <td className="py-3 text-sm text-right font-medium">{formatMoney(Number(l.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Sous-total</span><span>{formatMoney(Number(inv.sous_total))}</span></div>
              {Number(inv.taxe) > 0 && <div className="flex justify-between"><span className="text-slate-600">Taxe</span><span>+ {formatMoney(Number(inv.taxe))}</span></div>}
              {Number(inv.remise) > 0 && <div className="flex justify-between text-emerald-700"><span>Remise</span><span>- {formatMoney(Number(inv.remise))}</span></div>}
              <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-slate-300">
                <span>TOTAL</span><span>{formatMoney(Number(inv.total))}</span>
              </div>
              <div className="flex justify-between text-emerald-700 pt-2">
                <span>Payé</span><span>{formatMoney(Number(inv.montant_paye))}</span>
              </div>
              <div className={`flex justify-between font-bold ${restant > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                <span>Restant dû</span><span>{formatMoney(restant)}</span>
              </div>
            </div>
          </div>

          {inv.notes && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-slate-600">
              <strong>Notes :</strong> {inv.notes}
            </div>
          )}

          <div className="mt-12 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 print:block">
            Merci de votre confiance · Document généré par GestHotel
          </div>
        </div>

        {/* Panneau paiements */}
        <div className="space-y-4 print:hidden">
          {restant > 0 && inv.statut !== 'annulee' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold mb-3">Enregistrer un paiement</h3>
              <PaymentForm invoiceId={inv.id} maxAmount={restant} allowMobileMoney={limits.mobileMoney} />
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold mb-3">Historique des paiements</h3>
            {inv.payments?.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun paiement enregistré.</p>
            ) : (
              <ul className="space-y-3">
                {inv.payments?.map((p: any) => (
                  <li key={p.id} className="flex items-start justify-between text-sm border-l-2 border-emerald-400 pl-3">
                    <div>
                      <div className="font-medium">{PAY_METHOD_LABELS[p.methode]}</div>
                      <div className="text-xs text-slate-500">{formatDateTime(p.encaisse_at)}</div>
                      {p.reference_transaction && (
                        <div className="text-xs text-slate-500 font-mono">{p.reference_transaction}</div>
                      )}
                    </div>
                    <div className="font-semibold text-emerald-600">+ {formatMoney(Number(p.montant))}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
