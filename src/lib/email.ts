import { Resend } from 'resend';

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
};

export type EmailResult = { ok: true } | { ok: false; error: string };

const FROM = process.env.RESEND_FROM ?? 'GestHotel <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.RESEND_ADMIN_EMAIL ?? 'danielzehima@gmail.com';

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
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
      replyTo: args.replyTo
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Erreur Resend' };
  }
}

// ============================================================================
// TEMPLATES HTML
// ============================================================================

const layout = (title: string, body: string) => `
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
            <td style="background:linear-gradient(135deg,#2563eb,#4f46e5); padding:24px 32px; color:#ffffff;">
              <div style="font-size:20px; font-weight:700; letter-spacing:-0.02em;">
                🏨 GestHotel
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
              GestHotel — La gestion hôtelière simplifiée<br>
              <a href="https://gestb-hotel.vercel.app" style="color:#2563eb; text-decoration:none;">gestb-hotel.vercel.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

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

// ----- UTIL -----

function escape(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
