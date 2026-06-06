import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Callback d'authentification Supabase.
 * Échange le `code` (lien email : confirmation, réinitialisation de mot de passe…)
 * contre une session, puis redirige vers `next`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('[auth/callback] exchange failed:', error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=lien_invalide`);
}
