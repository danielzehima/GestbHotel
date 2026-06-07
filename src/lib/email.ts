import { Resend } from 'resend';
import { createAdminClient } from './supabase/admin';
import { generateSubscriptionReceiptPDF } from './pdf/subscription-receipt';

/**
 * Helper d'envoi d'emails via Resend.
 *
 * Variables d'env requises :
 *   - RESEND_API_KEY     : clé API depuis https://resend.com/api-keys
 *   - RESEND_FROM        : "GestHotel <no-reply@ton-domaine.com>" — un domaine vérifié sur resend.com
 *   - RESEND_ADMIN_EMAIL : email où recevoir les notifications admin (toi)
 *
 * Si RESEND_API_KEY n'est pas définie, les emails sont ignorés silencieusement
 * (utile pour le dev local sans clé).
 */

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string }>;
};

export type EmailResult = { ok: true } | { ok: false; error: string };

export type HotelEmailSettings = {
  logo_url?: string | null;
  primary_color?: string | null;
  hotel_name_header?: string | null;
  footer_signature?: string | null;
  reply_to?: string | null;
};

const FROM = process.env.RESEND_FROM ?? 'GestHotel <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.RESEND_ADMIN_EMAIL ?? 'danielzehima@gmail.com';

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// ============================================================================
// EMAIL CUSTOMIZATION HELPERS
// ============================================================================

/**
 * Retourne les settings par défaut (GestHotel)
 */
function getDefaultEmailSettings(): HotelEmailSettings {
  return {
    logo_url: null,
    primary_color: '#2563eb',
    hotel_name_header: 'GestHotel',
    footer_signature: 'La gestion hôtelière simplifiée',
    reply_to: null
  };
}

/**
 * Récupère les settings email customisés d'un hôtel, avec fallback aux defaults
 */
async function getHotelEmailSettings(hotelId: string): Promise<HotelEmailSettings> {
  try {
    const supabase = createAdminClient();
    const { data: hotel, error } = await supabase
      .from('hotels')
      .select('parametres')
      .eq('id', hotelId)
      .single();

    if (error) {
      console.warn(`[email] failed to fetch settings for hotel ${hotelId}:`, error.message);
      return getDefaultEmailSettings();
    }

    if (!hotel) {
      console.warn(`[email] hotel ${hotelId} not found, using defaults`);
      return getDefaultEmailSettings();
    }

    const customSettings = ((hotel as any)?.parametres?.email ?? {}) as Partial<HotelEmailSettings>;

    // Merge avec defaults
    const merged = {
      logo_url: customSettings.logo_url ?? null,
      primary_color: customSettings.primary_color ?? '#2563eb',
      hotel_name_header: customSettings.hotel_name_header ?? 'GestHotel',
      footer_signature: customSettings.footer_signature ?? 'La gestion hôtelière simplifiée',
      reply_to: customSettings.reply_to ?? null
    };

    if (customSettings.hotel_name_header || customSettings.primary_color) {
      console.info(`[email] loaded custom settings for hotel ${hotelId}`);
    }

    return merged;
  } catch (e) {
    console.error('[email] error fetching hotel settings:', (e as any)?.message);
    return getDefaultEmailSettings();
  }
}

export async function sendEmail(args: SendArgs): Promise<EmailResult> {
  const client = getClient();
  if (!client) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[email] RESEND_API_KEY non définie — email simulé :', args.subject);
    }
    return { ok: false, error: 'RESEND_API_KEY non définie' };
  }

  try {
    const { error } = await client.emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
      ...(args.attachments?.length ? { attachments: args.attachments } : {})
    });
    if (error) {
      console.error('[email] Resend error:', error.message, '| subject:', args.subject, '| to:', args.to);
      return { ok: false, error: error.message };
    }
    console.info('[email] sent successfully ✓', args.subject, 'to', args.to);
    return { ok: true };
  } catch (e: any) {
    console.error('[email] exception:', e?.message, '| subject:', args.subject);
    return { ok: false, error: e?.message ?? 'Erreur Resend' };
  }
}

// ============================================================================
// TEMPLATES HTML
// ============================================================================

/**
 * Layout avec support pour customization par hôtel
 */
function layoutWithCustomization(
  title: string,
  body: string,
  settings: HotelEmailSettings = getDefaultEmailSettings()
) {
  const gradientColor = settings.primary_color || '#2563eb';
  const gradientDark = adjustColor(gradientColor, -20);
  const hotelName = settings.hotel_name_header || 'GestHotel';
  const signature = settings.footer_signature || 'La gestion hôtelière simplifiée';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background:#f1f5f9; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#0f172a;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="background:linear-gradient(135deg,${gradientColor},${gradientDark}); padding:24px 32px; color:#ffffff;">
              ${settings.logo_url ? `<div style="margin:0 0 12px;"><img src="${escape(settings.logo_url)}" alt="Logo" style="max-height:40px; max-width:200px;"></div>` : ''}
              <div style="font-size:20px; font-weight:700; letter-spacing:-0.02em;">
                🏨 ${escape(hotelName)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:12px; color:#64748b; text-align:center;">
              ${escape(signature)}<br>
              <a href="https://gestb-hotel.vercel.app" style="color:${gradientColor}; text-decoration:none;">gestb-hotel.vercel.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Layout classique (pour emails système : welcome, invite, password reset)
 */
const layout = (title: string, body: string) => layoutWithCustomization(title, body, getDefaultEmailSettings());

/**
 * Utilitaire : ajuste la teinte d'une couleur hex
 */
function adjustColor(hex: string, percent: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const r = Math.max(0, Math.min(255, (num >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
  } catch {
    return '#4f46e5';
  }
}

// ----- 1. Notification admin : nouveau message de contact -----

export async function sendContactNotification(data: {
  nom: string;
  email: string;
  telephone?: string | null;
  sujet: string;
  message: string;
}) {
  const html = layout('Nouveau message de contact', `
    <h2 style="margin:0 0 16px; font-size:22px; color:#0f172a;">📬 Nouveau message reçu</h2>
    <p style="margin:0 0 24px; color:#475569;">Un visiteur vient de remplir le formulaire de contact.</p>

    <table cellpadding="0" cellspacing="0" style="width:100%; background:#f8fafc; border-radius:8px; padding:16px;">
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Nom</td></tr>
      <tr><td style="padding:0 0 12px; font-size:15px; color:#0f172a;">${escape(data.nom)}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Email</td></tr>
      <tr><td style="padding:0 0 12px;"><a href="mailto:${escape(data.email)}" style="color:#2563eb;">${escape(data.email)}</a></td></tr>
      ${data.telephone ? `
        <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Téléphone</td></tr>
        <tr><td style="padding:0 0 12px;"><a href="tel:${escape(data.telephone)}" style="color:#2563eb;">${escape(data.telephone)}</a></td></tr>
      ` : ''}
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Sujet</td></tr>
      <tr><td style="padding:0 0 12px; font-size:15px; color:#0f172a; font-weight:500;">${escape(data.sujet)}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Message</td></tr>
      <tr><td style="padding:0; font-size:14px; color:#0f172a; line-height:1.6; white-space:pre-wrap;">${escape(data.message)}</td></tr>
    </table>

    <p style="margin:24px 0 0;">
      <a href="https://gestb-hotel.vercel.app/superadmin/messages" style="display:inline-block; background:#2563eb; color:#ffffff; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
        Voir dans le super admin →
      </a>
    </p>
  `);

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[GestHotel] Contact : ${data.sujet}`,
    html,
    replyTo: data.email
  });
}

// ----- 2. Bienvenue : nouvel hôtel inscrit -----

export async function sendWelcomeEmail(data: { email: string; prenom: string; hotelNom: string }) {
  const html = layout('Bienvenue sur GestHotel', `
    <h2 style="margin:0 0 16px; font-size:22px; color:#0f172a;">Bienvenue ${escape(data.prenom)} 🎉</h2>
    <p style="margin:0 0 16px; color:#475569; line-height:1.6;">
      Votre hôtel <strong>${escape(data.hotelNom)}</strong> est désormais enregistré sur GestHotel.
    </p>
    <p style="margin:0 0 16px; color:#475569; line-height:1.6;">
      Vous bénéficiez de <strong style="color:#10b981;">21 jours d'essai gratuit</strong> avec accès à toutes les fonctionnalités :
    </p>
    <ul style="margin:0 0 24px; padding-left:20px; color:#475569; line-height:1.8;">
      <li>📅 Gestion des chambres et réservations</li>
      <li>🍽️ Restaurant avec QR code & interface cuisine</li>
      <li>💰 Facturation Wave / Orange Money / MTN / Moov</li>
      <li>👥 Gestion d'équipe avec rôles fins</li>
      <li>📊 Tableau de bord temps réel</li>
    </ul>
    <p style="margin:24px 0;">
      <a href="https://gestb-hotel.vercel.app/dashboard" style="display:inline-block; background:linear-gradient(135deg,#2563eb,#4f46e5); color:#ffffff; padding:14px 24px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px;">
        Accéder à mon dashboard →
      </a>
    </p>
    <p style="margin:24px 0 0; font-size:13px; color:#64748b;">
      💡 <strong>Premier pas recommandé :</strong> créez vos types de chambres, puis vos chambres physiques en masse (Paramètres → Chambres).
    </p>
  `);

  return sendEmail({
    to: data.email,
    subject: `Bienvenue sur GestHotel, ${data.prenom} !`,
    html
  });
}

// ----- 3. Invitation d'un membre d'équipe -----

export async function sendTeamInviteEmail(data: {
  email: string;
  prenom: string;
  nom: string;
  role: string;
  password: string;
  hotelNom: string;
}) {
  const html = layout('Invitation à rejoindre GestHotel', `
    <h2 style="margin:0 0 16px; font-size:22px; color:#0f172a;">Bonjour ${escape(data.prenom)} 👋</h2>
    <p style="margin:0 0 16px; color:#475569; line-height:1.6;">
      Vous avez été ajouté à l'équipe de <strong>${escape(data.hotelNom)}</strong> sur GestHotel en tant que <strong>${escape(data.role)}</strong>.
    </p>
    <p style="margin:0 0 16px; color:#475569;">Voici vos identifiants de connexion :</p>

    <table cellpadding="0" cellspacing="0" style="width:100%; background:#f8fafc; border-radius:8px; padding:16px;">
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Email</td></tr>
      <tr><td style="padding:0 0 12px; font-size:15px; color:#0f172a;">${escape(data.email)}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Mot de passe</td></tr>
      <tr><td style="padding:0; font-family:'Courier New',monospace; font-size:16px; color:#0f172a; font-weight:700; background:#ffffff; border:1px dashed #cbd5e1; border-radius:6px; padding:10px; text-align:center;">${escape(data.password)}</td></tr>
    </table>

    <p style="margin:24px 0;">
      <a href="https://gestb-hotel.vercel.app/login" style="display:inline-block; background:#2563eb; color:#ffffff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
        Me connecter →
      </a>
    </p>

    <div style="margin-top:24px; padding:12px 16px; background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; font-size:13px; color:#78350f;">
      ⚠ <strong>Important :</strong> changez votre mot de passe dès votre première connexion dans <em>Paramètres</em>.
    </div>
  `);

  return sendEmail({
    to: data.email,
    subject: `Vos accès GestHotel — ${data.hotelNom}`,
    html
  });
}

// ----- 4. Mot de passe réinitialisé par admin -----

export async function sendPasswordResetEmail(data: {
  email: string;
  prenom: string;
  newPassword: string;
}) {
  const html = layout('Mot de passe réinitialisé', `
    <h2 style="margin:0 0 16px; font-size:22px; color:#0f172a;">Mot de passe mis à jour</h2>
    <p style="margin:0 0 16px; color:#475569; line-height:1.6;">
      Bonjour ${escape(data.prenom)}, votre administrateur a réinitialisé votre mot de passe GestHotel.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%; background:#f8fafc; border-radius:8px; padding:16px;">
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Nouveau mot de passe</td></tr>
      <tr><td style="padding:0; font-family:'Courier New',monospace; font-size:16px; color:#0f172a; font-weight:700; background:#ffffff; border:1px dashed #cbd5e1; border-radius:6px; padding:10px; text-align:center;">${escape(data.newPassword)}</td></tr>
    </table>
    <p style="margin:24px 0;">
      <a href="https://gestb-hotel.vercel.app/login" style="display:inline-block; background:#2563eb; color:#ffffff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
        Me connecter →
      </a>
    </p>
    <div style="margin-top:24px; padding:12px 16px; background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; font-size:13px; color:#78350f;">
      ⚠ Modifiez ce mot de passe après votre prochaine connexion dans <em>Paramètres</em>.
    </div>
  `);

  return sendEmail({
    to: data.email,
    subject: 'Votre mot de passe GestHotel a été réinitialisé',
    html
  });
}

// ----- 5. Notification admin : nouvel hôtel inscrit -----

export async function sendNewHotelAdminNotification(data: { hotelNom: string; email: string; prenom: string; nom: string }) {
  const html = layout('Nouvel hôtel inscrit', `
    <h2 style="margin:0 0 16px;">🎉 Nouvelle inscription</h2>
    <p style="margin:0 0 16px; color:#475569;">Un nouvel hôtel vient de rejoindre GestHotel.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%; background:#f8fafc; border-radius:8px; padding:16px;">
      <tr><td style="padding:4px 0; color:#64748b; font-size:12px;">HÔTEL</td></tr>
      <tr><td style="padding:0 0 10px; font-weight:600;">${escape(data.hotelNom)}</td></tr>
      <tr><td style="padding:4px 0; color:#64748b; font-size:12px;">ADMIN</td></tr>
      <tr><td style="padding:0 0 10px;">${escape(data.prenom)} ${escape(data.nom)} — <a href="mailto:${escape(data.email)}">${escape(data.email)}</a></td></tr>
    </table>
    <p style="margin:20px 0 0;">
      <a href="https://gestb-hotel.vercel.app/superadmin/hotels" style="display:inline-block; background:#0f172a; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
        Voir dans super admin →
      </a>
    </p>
  `);
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[GestHotel] Nouvel hôtel : ${data.hotelNom}`,
    html
  });
}

// ----- 6. Reçu de paiement d'abonnement (GeniusPay) -----

const PLAN_LABELS_EMAIL: Record<string, string> = {
  basique: 'Basique',
  standard: 'Standard',
  premium: 'Premium'
};

export async function sendSubscriptionReceiptEmail(data: {
  to: string;
  hotelNom: string;
  plan: 'basique' | 'standard' | 'premium';
  months: number;
  amount: number;
  reference: string;
  expiresAt: Date;
  paidAt?: Date;
}) {
  const planNom = PLAN_LABELS_EMAIL[data.plan] ?? data.plan;
  const montant = data.amount.toLocaleString('fr-FR');
  const echeance = data.expiresAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const html = layout('Reçu de paiement', `
    <h2 style="margin:0 0 8px; font-size:22px; color:#0f172a;">Paiement confirmé ✅</h2>
    <p style="margin:0 0 24px; color:#475569; line-height:1.6;">
      Merci ! Le forfait <strong>${escape(planNom)}</strong> de <strong>${escape(data.hotelNom)}</strong> est désormais actif.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%; background:#f8fafc; border-radius:8px; padding:16px;">
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Forfait</td>
          <td style="padding:6px 0; font-size:15px; color:#0f172a; font-weight:600; text-align:right;">${escape(planNom)}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Durée</td>
          <td style="padding:6px 0; font-size:15px; color:#0f172a; text-align:right;">${data.months} mois</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Montant</td>
          <td style="padding:6px 0; font-size:15px; color:#0f172a; font-weight:700; text-align:right;">${montant} FCFA</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Référence</td>
          <td style="padding:6px 0; font-size:13px; color:#0f172a; font-family:'Courier New',monospace; text-align:right;">${escape(data.reference)}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Valable jusqu'au</td>
          <td style="padding:6px 0; font-size:15px; color:#0f172a; font-weight:600; text-align:right;">${escape(echeance)}</td></tr>
    </table>

    <p style="margin:24px 0;">
      <a href="https://gestb-hotel.vercel.app/dashboard" style="display:inline-block; background:linear-gradient(135deg,#2563eb,#4f46e5); color:#ffffff; padding:14px 24px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px;">
        Accéder à mon dashboard →
      </a>
    </p>
    <p style="margin:8px 0 0; font-size:12px; color:#94a3b8;">
      Votre reçu PDF est joint à cet email. Conservez-le pour vos archives.
    </p>
  `);

  // Génération du PDF (non bloquant si échec)
  let pdfBuffer: Buffer | undefined;
  try {
    pdfBuffer = await generateSubscriptionReceiptPDF({
      hotelNom: data.hotelNom,
      plan: data.plan,
      months: data.months,
      amount: data.amount,
      reference: data.reference,
      expiresAt: data.expiresAt,
      paidAt: data.paidAt
    });
    console.info('[email] PDF reçu généré ✓ pour', data.reference);
  } catch (e: any) {
    console.error('[email] échec génération PDF reçu:', e?.message);
  }

  const filename = `recu-gesthotel-${data.reference.toLowerCase()}.pdf`;

  return sendEmail({
    to: data.to,
    subject: `Reçu GestHotel — Forfait ${planNom} activé`,
    html,
    ...(pdfBuffer ? { attachments: [{ filename, content: pdfBuffer }] } : {})
  });
}

// ----- 7. Relance avant expiration du forfait / essai -----

export async function sendExpiryReminderEmail(data: {
  to: string;
  hotelNom: string;
  prenom?: string;
  isTrial: boolean;
  daysLeft: number; // 7, 3 ou 1
}) {
  const urgent = data.daysLeft <= 1;
  const jours = `${data.daysLeft} jour${data.daysLeft > 1 ? 's' : ''}`;
  const titre = data.isTrial
    ? `Votre essai gratuit se termine dans ${jours}`
    : `Votre forfait expire dans ${jours}`;

  const html = layout(titre, `
    <h2 style="margin:0 0 8px; font-size:22px; color:${urgent ? '#dc2626' : '#0f172a'};">
      ${urgent ? '⏰ Dernier rappel' : '⏳ Bientôt l\'échéance'}
    </h2>
    <p style="margin:0 0 16px; color:#475569; line-height:1.6;">
      Bonjour${data.prenom ? ' ' + escape(data.prenom) : ''}, ${data.isTrial ? "l'essai gratuit" : 'le forfait'} de
      <strong>${escape(data.hotelNom)}</strong> ${data.isTrial ? 'se termine' : 'expire'} dans <strong>${jours}</strong>.
    </p>
    <p style="margin:0 0 24px; color:#475569; line-height:1.6;">
      Pour éviter toute interruption d'accès à votre hôtel (réservations, facturation, restaurant…),
      ${data.isTrial ? 'activez' : 'renouvelez'} votre forfait dès maintenant. Paiement en quelques secondes par
      Mobile Money ou carte.
    </p>
    <p style="margin:24px 0;">
      <a href="https://gestb-hotel.vercel.app/upgrade" style="display:inline-block; background:linear-gradient(135deg,#2563eb,#4f46e5); color:#ffffff; padding:14px 24px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px;">
        ${data.isTrial ? 'Choisir mon forfait' : 'Renouveler mon forfait'} →
      </a>
    </p>
  `);

  return sendEmail({
    to: data.to,
    subject: `${urgent ? '⏰ ' : ''}${titre} — GestHotel`,
    html
  });
}

// ----- 8. Forfait / essai expiré (jour J) -----

export async function sendExpiredEmail(data: {
  to: string;
  hotelNom: string;
  prenom?: string;
  isTrial: boolean;
}) {
  const html = layout('Accès suspendu', `
    <h2 style="margin:0 0 8px; font-size:22px; color:#dc2626;">Accès suspendu</h2>
    <p style="margin:0 0 16px; color:#475569; line-height:1.6;">
      Bonjour${data.prenom ? ' ' + escape(data.prenom) : ''}, ${data.isTrial ? "l'essai gratuit" : 'le forfait'} de
      <strong>${escape(data.hotelNom)}</strong> ${data.isTrial ? 'est terminé' : 'a expiré'}.
      L'accès au tableau de bord est temporairement suspendu.
    </p>
    <p style="margin:0 0 24px; color:#475569; line-height:1.6;">
      <strong>Vos données sont conservées.</strong> Activez un forfait pour retrouver immédiatement l'accès complet.
    </p>
    <p style="margin:24px 0;">
      <a href="https://gestb-hotel.vercel.app/upgrade" style="display:inline-block; background:linear-gradient(135deg,#2563eb,#4f46e5); color:#ffffff; padding:14px 24px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px;">
        Réactiver mon accès →
      </a>
    </p>
  `);

  return sendEmail({
    to: data.to,
    subject: `Accès suspendu — réactivez ${data.hotelNom} sur GestHotel`,
    html
  });
}

// ----- 9. Réservation en ligne : confirmation au client -----

type BookingEmailData = {
  to: string;
  reference: string;
  hotelNom: string;
  roomLabel: string;
  arrivee: string;
  depart: string;
  nights: number;
  prixTotal: number;
  devise: string;
  guestNom: string;
  guestPrenom: string;
  guestEmail: string;
  guestTel: string;
  paiement?: { numero?: string | null; nom?: string | null; acompte_pct?: number };
};

function fmtMoney(n: number, devise: string) {
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${n.toLocaleString('fr-FR')} ${devise}`;
  }
}
function fmtDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function bookingSummaryTable(d: BookingEmailData) {
  return `
    <table cellpadding="0" cellspacing="0" style="width:100%; background:#f8fafc; border-radius:8px; padding:16px;">
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Référence</td>
          <td style="padding:6px 0; font-size:14px; color:#0f172a; font-family:'Courier New',monospace; text-align:right;">${escape(d.reference)}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Chambre</td>
          <td style="padding:6px 0; font-size:15px; color:#0f172a; font-weight:600; text-align:right;">${escape(d.roomLabel)}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Arrivée</td>
          <td style="padding:6px 0; font-size:14px; color:#0f172a; text-align:right;">${escape(fmtDate(d.arrivee))}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Départ</td>
          <td style="padding:6px 0; font-size:14px; color:#0f172a; text-align:right;">${escape(fmtDate(d.depart))}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Nuits</td>
          <td style="padding:6px 0; font-size:14px; color:#0f172a; text-align:right;">${d.nights}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Total estimé</td>
          <td style="padding:6px 0; font-size:16px; color:#0f172a; font-weight:700; text-align:right;">${fmtMoney(d.prixTotal, d.devise)}</td></tr>
    </table>`;
}

function paymentInstructionsBlock(d: BookingEmailData): string {
  const p = d.paiement;
  if (!p || !p.numero) return '';
  const pct = p.acompte_pct ?? 0;
  const acompte = pct > 0 ? Math.round((d.prixTotal * pct) / 100) : 0;
  const montantTxt = pct > 0
    ? `un acompte de <strong>${fmtMoney(acompte, d.devise)}</strong> (${pct}%)`
    : `le règlement`;

  return `
    <div style="margin-top:16px; padding:16px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px;">
      <p style="margin:0 0 8px; font-size:14px; color:#065f46; font-weight:700;">💳 Pour garantir votre réservation</p>
      <p style="margin:0 0 10px; font-size:14px; color:#065f46; line-height:1.6;">
        Versez ${montantTxt} via <strong>Wave, Orange Money, MTN ou Moov</strong> au numéro ci-dessous,
        puis envoyez la capture à l'hôtel.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%; background:#ffffff; border-radius:6px; padding:12px;">
        <tr><td style="padding:4px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Numéro</td>
            <td style="padding:4px 0; font-size:16px; color:#0f172a; font-weight:700; text-align:right;">${escape(p.numero)}</td></tr>
        ${p.nom ? `<tr><td style="padding:4px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Bénéficiaire</td>
            <td style="padding:4px 0; font-size:14px; color:#0f172a; text-align:right;">${escape(p.nom)}</td></tr>` : ''}
      </table>
    </div>`;
}

export async function sendBookingGuestConfirmation(d: BookingEmailData, hotelId?: string) {
  const settings = hotelId ? await getHotelEmailSettings(hotelId) : getDefaultEmailSettings();
  const html = layoutWithCustomization('Demande de réservation reçue', `
    <h2 style="margin:0 0 8px; font-size:22px; color:#0f172a;">Merci ${escape(d.guestPrenom)} 🎉</h2>
    <p style="margin:0 0 20px; color:#475569; line-height:1.6;">
      Votre demande de réservation chez <strong>${escape(d.hotelNom)}</strong> a bien été reçue.
      Elle est <strong>en attente de confirmation</strong> par l'établissement, qui vous recontactera très vite.
    </p>
    ${bookingSummaryTable(d)}
    ${paymentInstructionsBlock(d)}
    <p style="margin:20px 0 0; font-size:13px; color:#64748b;">
      Conservez votre référence <strong>${escape(d.reference)}</strong> pour tout échange avec l'hôtel.
    </p>
  `, settings);
  return sendEmail({
    to: d.to,
    subject: `Votre réservation ${d.reference} — ${d.hotelNom}`,
    html,
    replyTo: settings.reply_to || undefined
  });
}

// ----- 10. Réservation en ligne : notification à l'hôtel -----

export async function sendBookingHotelNotification(d: BookingEmailData) {
  const html = layout('Nouvelle réservation en ligne', `
    <h2 style="margin:0 0 8px; font-size:22px; color:#0f172a;">🆕 Nouvelle réservation en ligne</h2>
    <p style="margin:0 0 20px; color:#475569; line-height:1.6;">
      Une demande vient d'arriver via votre site de réservation. Confirmez-la et assignez une chambre dans votre tableau de bord.
    </p>
    ${bookingSummaryTable(d)}
    <table cellpadding="0" cellspacing="0" style="width:100%; background:#f1f5f9; border-radius:8px; padding:16px; margin-top:12px;">
      <tr><td style="padding:4px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Client</td></tr>
      <tr><td style="padding:0 0 8px; font-size:15px; color:#0f172a; font-weight:600;">${escape(d.guestPrenom)} ${escape(d.guestNom)}</td></tr>
      <tr><td style="padding:0 0 4px;"><a href="mailto:${escape(d.guestEmail)}" style="color:#2563eb;">${escape(d.guestEmail)}</a></td></tr>
      <tr><td><a href="tel:${escape(d.guestTel)}" style="color:#2563eb;">${escape(d.guestTel)}</a></td></tr>
    </table>
    <p style="margin:24px 0 0;">
      <a href="https://gestb-hotel.vercel.app/reservations?filter=en_attente" style="display:inline-block; background:#2563eb; color:#ffffff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
        Voir les demandes en attente →
      </a>
    </p>
  `);
  return sendEmail({ to: d.to, subject: `[Réservation] ${d.reference} — ${d.guestPrenom} ${d.guestNom}`, html });
}

// ----- 11. Notifications client : confirmation / rappel / remerciement -----

export type GuestReservationEmail = {
  to: string;
  prenom: string;
  hotelNom: string;
  reference: string;
  roomLabel: string;
  arrivee: string;
  depart: string;
  nights: number;
  prixTotal: number;
  restant?: number;
  devise: string;
  hotelTel?: string | null;
};

function guestResaTable(d: GuestReservationEmail) {
  return `
    <table cellpadding="0" cellspacing="0" style="width:100%; background:#f8fafc; border-radius:8px; padding:16px;">
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Référence</td>
          <td style="padding:6px 0; font-size:14px; color:#0f172a; font-family:'Courier New',monospace; text-align:right;">${escape(d.reference)}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Chambre</td>
          <td style="padding:6px 0; font-size:15px; color:#0f172a; font-weight:600; text-align:right;">${escape(d.roomLabel)}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Arrivée</td>
          <td style="padding:6px 0; font-size:14px; color:#0f172a; text-align:right;">${escape(fmtDate(d.arrivee))}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Départ</td>
          <td style="padding:6px 0; font-size:14px; color:#0f172a; text-align:right;">${escape(fmtDate(d.depart))}</td></tr>
      <tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Total séjour</td>
          <td style="padding:6px 0; font-size:16px; color:#0f172a; font-weight:700; text-align:right;">${fmtMoney(d.prixTotal, d.devise)}</td></tr>
      ${typeof d.restant === 'number' ? `<tr><td style="padding:6px 0; font-size:12px; color:#64748b; text-transform:uppercase; font-weight:600;">Restant dû</td>
          <td style="padding:6px 0; font-size:14px; color:#0f172a; text-align:right;">${fmtMoney(d.restant, d.devise)}</td></tr>` : ''}
    </table>`;
}

export async function sendReservationConfirmedEmail(d: GuestReservationEmail, hotelId?: string) {
  const settings = hotelId ? await getHotelEmailSettings(hotelId) : getDefaultEmailSettings();
  const html = layoutWithCustomization('Réservation confirmée', `
    <h2 style="margin:0 0 8px; font-size:22px; color:#0f172a;">Votre réservation est confirmée ✅</h2>
    <p style="margin:0 0 20px; color:#475569; line-height:1.6;">
      Bonjour ${escape(d.prenom)}, nous avons le plaisir de confirmer votre séjour chez <strong>${escape(d.hotelNom)}</strong>.
      Nous avons hâte de vous accueillir !
    </p>
    ${guestResaTable(d)}
    ${d.hotelTel ? `<p style="margin:16px 0 0; font-size:13px; color:#64748b;">Une question ? Contactez-nous au <strong>${escape(d.hotelTel)}</strong>.</p>` : ''}
  `, settings);
  return sendEmail({
    to: d.to,
    subject: `Réservation confirmée ${d.reference} — ${d.hotelNom}`,
    html,
    replyTo: settings.reply_to || undefined
  });
}

export async function sendArrivalReminderEmail(d: GuestReservationEmail, hotelId?: string) {
  const settings = hotelId ? await getHotelEmailSettings(hotelId) : getDefaultEmailSettings();
  const html = layoutWithCustomization('Votre arrivée approche', `
    <h2 style="margin:0 0 8px; font-size:22px; color:#0f172a;">À très bientôt, ${escape(d.prenom)} 👋</h2>
    <p style="margin:0 0 20px; color:#475569; line-height:1.6;">
      Petit rappel : votre arrivée chez <strong>${escape(d.hotelNom)}</strong> est prévue <strong>demain</strong>.
      Voici le récapitulatif de votre séjour.
    </p>
    ${guestResaTable(d)}
    ${d.hotelTel ? `<p style="margin:16px 0 0; font-size:13px; color:#64748b;">Pour toute modification, appelez-nous au <strong>${escape(d.hotelTel)}</strong>.</p>` : ''}
  `, settings);
  return sendEmail({
    to: d.to,
    subject: `Rappel : votre arrivée demain — ${d.hotelNom}`,
    html,
    replyTo: settings.reply_to || undefined
  });
}

export async function sendThankYouEmail(d: GuestReservationEmail, hotelId?: string) {
  const settings = hotelId ? await getHotelEmailSettings(hotelId) : getDefaultEmailSettings();
  const html = layoutWithCustomization('Merci de votre visite', `
    <h2 style="margin:0 0 8px; font-size:22px; color:#0f172a;">Merci ${escape(d.prenom)} 🙏</h2>
    <p style="margin:0 0 16px; color:#475569; line-height:1.6;">
      Nous espérons que votre séjour chez <strong>${escape(d.hotelNom)}</strong> s'est très bien passé.
      Ce fut un plaisir de vous accueillir.
    </p>
    <p style="margin:0 0 16px; color:#475569; line-height:1.6;">
      Votre avis compte énormément. N'hésitez pas à nous faire part de vos impressions${d.hotelTel ? ` au <strong>${escape(d.hotelTel)}</strong>` : ''} —
      et au plaisir de vous revoir très vite !
    </p>
  `, settings);
  return sendEmail({
    to: d.to,
    subject: `Merci de votre visite — ${d.hotelNom}`,
    html,
    replyTo: settings.reply_to || undefined
  });
}

// ----- UTIL -----

function escape(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
