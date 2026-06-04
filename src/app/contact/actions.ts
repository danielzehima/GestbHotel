'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

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

  const supabase = await createClient();
  const { error } = await supabase.from('contact_messages').insert({
    nom: parsed.data.nom,
    email: parsed.data.email,
    telephone: parsed.data.telephone || null,
    sujet: parsed.data.sujet,
    message: parsed.data.message
  });

  if (error) return { error: 'Une erreur est survenue. Réessayez ou contactez-nous par email.' };

  return { success: 'Merci ! Votre message a bien été envoyé. Nous vous répondrons sous 24h ouvrées.' };
}
