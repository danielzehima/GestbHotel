import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Callback d'authentification Supabase.
 * Gère les deux formats de lien email :
 *   - PKCE : ?code=... → exchangeCodeForSession
 *   - OTP  : ?token_hash=...&type=recovery → verifyOtp
 * Puis redirige vers `next` (ex : /reset-password).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') ?? '/dashboard';
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error('[auth/callback] exchangeCodeForSession:', error.message);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error('[auth/callback] verifyOtp:', error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=lien_invalide`);
}
