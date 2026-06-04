import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { AutoPrint } from './auto-print';

export const metadata = { title: 'Impression facture' };

export default async function PrintInvoicePage(props: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['admin', 'receptionniste', 'comptable']);
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: hotel }] = await Promise.all([
    supabase
      .from('invoices')
      .select(`*, guest:guests(nom, prenom, email, telephone, adresse), lines:invoice_lines(*)`)
      .eq('id', id)
      .eq('hotel_id', user.profile.hotel_id!)
      .single(),
    supabase
      .from('hotels')
      .select('nom, adresse, ville, pays, telephone, email')
      .eq('id', user.profile.hotel_id!)
      .single()
  ]);

  if (!invoice) notFound();
  const inv = invoice as any;
  const h = hotel as any;
  const restant = Number(inv.total) - Number(inv.montant_paye);

  return (
    <main className="bg-white min-h-screen p-10 max-w-3xl mx-auto text-slate-900">
      <AutoPrint />

      <div className="flex justify-between mb-8 border-b-2 border-slate-900 pb-6">
        <div>
          <h2 className="text-2xl font-bold">{h?.nom}</h2>
          {h?.adresse && <p className="text-sm">{h.adresse}</p>}
          {(h?.ville || h?.pays) && <p className="text-sm">{[h.ville, h.pays].filter(Boolean).join(', ')}</p>}
          {h?.telephone && <p className="text-sm">{h.telephone}</p>}
          {h?.email && <p className="text-sm">{h.email}</p>}
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold">FACTURE</h1>
          <p className="font-mono text-sm mt-1">{inv.numero}</p>
          <p className="text-sm mt-1">Émise le {formatDate(inv.date_emission)}</p>
          {inv.date_echeance && <p className="text-sm">Échéance : {formatDate(inv.date_echeance)}</p>}
        </div>
      </div>

      {inv.guest && (
        <div className="mb-6">
          <h3 className="text-xs uppercase font-semibold mb-1">Facturé à</h3>
          <p className="font-medium">{inv.guest.prenom} {inv.guest.nom}</p>
          {inv.guest.email && <p className="text-sm">{inv.guest.email}</p>}
          {inv.guest.telephone && <p className="text-sm">{inv.guest.telephone}</p>}
          {inv.guest.adresse && <p className="text-sm whitespace-pre-line">{inv.guest.adresse}</p>}
        </div>
      )}

      <table className="w-full mb-6">
        <thead className="border-b-2 border-slate-900">
          <tr className="text-xs uppercase">
            <th className="text-left py-2">Description</th>
            <th className="text-right py-2 w-20">Qté</th>
            <th className="text-right py-2 w-32">Prix unit.</th>
            <th className="text-right py-2 w-32">Total</th>
          </tr>
        </thead>
        <tbody>
          {inv.lines?.map((l: any) => (
            <tr key={l.id} className="border-b border-slate-200">
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
          <div className="flex justify-between"><span>Sous-total</span><span>{formatMoney(Number(inv.sous_total))}</span></div>
          {Number(inv.taxe) > 0 && <div className="flex justify-between"><span>Taxe</span><span>+ {formatMoney(Number(inv.taxe))}</span></div>}
          {Number(inv.remise) > 0 && <div className="flex justify-between"><span>Remise</span><span>- {formatMoney(Number(inv.remise))}</span></div>}
          <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-slate-900">
            <span>TOTAL</span><span>{formatMoney(Number(inv.total))}</span>
          </div>
          <div className="flex justify-between pt-2"><span>Payé</span><span>{formatMoney(Number(inv.montant_paye))}</span></div>
          <div className="flex justify-between font-bold"><span>Restant dû</span><span>{formatMoney(restant)}</span></div>
        </div>
      </div>

      {inv.notes && (
        <div className="mt-6 pt-4 border-t border-slate-200 text-sm">
          <strong>Notes :</strong> {inv.notes}
        </div>
      )}

      <div className="mt-16 text-center text-xs text-slate-500">
        Merci de votre confiance · Document généré par GestHotel
      </div>
    </main>
  );
}
