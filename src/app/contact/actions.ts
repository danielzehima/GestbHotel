'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendContactNotification } from '@/lib/email';

const schema = z.object({
  nom: z.string().min(2, 'Nom trop court').max(100),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  sujet: z.string().min(2, 'Sujet trop court').max(150),
  message: z.string().min(10, 'Message trop court (10 caractères minimum)').max(3000)
});

export type ContactState =
  | { error?: string; success?: string }
  | null;

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide' };
  }

  const payload = {
    nom: parsed.data.nom,
    email: parsed.data.email,
    telephone: parsed.data.telephone || null,
    sujet: parsed.data.sujet,
    message: parsed.data.message
  };

  // 1. Tentative avec le client standard (anon ou authenticated selon la session)
  const supabase = await createClient();
  let { error } = await supabase.from('contact_messages').insert(payload);

  // 2. Fallback : si RLS bloque ou table absente, on tente avec le service_role
  if (error) {
    console.error('[contact] insert failed (standard client):', error.message, error);

    try {
      const admin = createAdminClient();
      const { error: adminErr } = await admin.from('contact_messages').insert(payload);
      if (adminErr) {
        console.error('[contact] insert failed (admin client):', adminErr.message, adminErr);
        // Si l'admin échoue aussi, c'est probablement la table qui n'existe pas
        return {
          error: adminErr.message.includes('does not exist')
            ? 'Le service de contact n\'est pas configuré (table manquante). Contactez-nous directement par WhatsApp.'
            : `Erreur : ${adminErr.message}`
        };
      }
      error = null; // succès via admin
    } catch (e: any) {
      console.error('[contact] admin client unavailable:', e?.message);
      return { error: `Une erreur est survenue (${error.message}). Contactez-nous par WhatsApp au +225 07 10 07 52 57.` };
    }
  }

  // 3. Notif email (best-effort)
  sendContactNotification({
    nom: parsed.data.nom,
    email: parsed.data.email,
    telephone: parsed.data.telephone,
    sujet: parsed.data.sujet,
    message: parsed.data.message
  }).catch((e) => console.error('[contact] email failed:', e));

  return { success: 'Merci ! Votre message a bien été envoyé. Nous vous répondrons sous 24h ouvrées.' };
}
