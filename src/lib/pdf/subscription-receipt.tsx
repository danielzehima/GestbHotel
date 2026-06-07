/**
 * Génère un PDF de reçu d'abonnement GestHotel.
 * Compatible Vercel serverless (Node.js runtime).
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    padding: 48,
    fontSize: 11,
    color: '#0f172a',
  },
  // En-tête
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 36,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  brand: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
  },
  brandSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  receiptTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  receiptNum: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 3,
  },
  // Badge statut
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  badge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    color: '#15803d',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  // Bloc hôtel
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  hotelName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  hotelSub: {
    fontSize: 10,
    color: '#64748b',
  },
  // Tableau récapitulatif
  table: {
    marginTop: 28,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  tableTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  rowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  rowValue: {
    fontSize: 11,
    color: '#0f172a',
    fontFamily: 'Helvetica-Bold',
  },
  rowValueMono: {
    fontSize: 10,
    color: '#0f172a',
    fontFamily: 'Courier',
  },
  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#2563eb',
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 36,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  // Note
  note: {
    marginTop: 24,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    padding: 12,
  },
  noteText: {
    fontSize: 9,
    color: '#1d4ed8',
    lineHeight: 1.5,
  },
});

const PLAN_LABELS: Record<string, string> = {
  basique: 'Forfait Basique',
  standard: 'Forfait Standard',
  premium: 'Forfait Premium',
};

type ReceiptData = {
  hotelNom: string;
  plan: string;
  months: number;
  amount: number;
  reference: string;
  expiresAt: Date;
  paidAt?: Date;
};

function SubscriptionReceiptDocument({ data }: { data: ReceiptData }) {
  const planLabel = PLAN_LABELS[data.plan] ?? data.plan;
  const montant = data.amount.toLocaleString('fr-FR') + ' FCFA';
  const echeance = data.expiresAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const datePaiement = (data.paidAt ?? new Date()).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const duree = `${data.months} mois`;

  return (
    <Document
      title={`Reçu GestHotel — ${planLabel}`}
      author="GestHotel"
      subject="Reçu d'abonnement"
    >
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>GestHotel</Text>
            <Text style={styles.brandSub}>La gestion hôtelière simplifiée</Text>
          </View>
          <View>
            <Text style={styles.receiptTitle}>REÇU DE PAIEMENT</Text>
            <Text style={styles.receiptNum}>Réf. {data.reference}</Text>
            <Text style={styles.receiptNum}>Date : {datePaiement}</Text>
          </View>
        </View>

        {/* Badge */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓  Paiement confirmé</Text>
          </View>
        </View>

        {/* Hôtel bénéficiaire */}
        <Text style={styles.sectionTitle}>Hôtel bénéficiaire</Text>
        <Text style={styles.hotelName}>{data.hotelNom}</Text>
        <Text style={styles.hotelSub}>Abonnement SaaS GestHotel</Text>

        {/* Tableau récap */}
        <View style={styles.table}>
          <Text style={styles.tableTitle}>Détails de l'abonnement</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Forfait</Text>
            <Text style={styles.rowValue}>{planLabel}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Durée</Text>
            <Text style={styles.rowValue}>{duree}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Valable jusqu'au</Text>
            <Text style={styles.rowValue}>{echeance}</Text>
          </View>

          <View style={styles.rowLast}>
            <Text style={styles.rowLabel}>Référence transaction</Text>
            <Text style={styles.rowValueMono}>{data.reference}</Text>
          </View>

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Montant total payé</Text>
            <Text style={styles.totalValue}>{montant}</Text>
          </View>
        </View>

        {/* Note */}
        <View style={styles.note}>
          <Text style={styles.noteText}>
            Ce document fait foi de votre paiement. Conservez-le pour vos archives.{'\n'}
            Pour toute question, contactez-nous via gestb-hotel.vercel.app
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>GestHotel — gestb-hotel.vercel.app</Text>
          <Text style={styles.footerText}>Reçu généré automatiquement le {datePaiement}</Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Génère un Buffer PDF du reçu d'abonnement.
 */
export async function generateSubscriptionReceiptPDF(data: ReceiptData): Promise<Buffer> {
  const buffer = await renderToBuffer(<SubscriptionReceiptDocument data={data} />);
  return Buffer.from(buffer);
}
