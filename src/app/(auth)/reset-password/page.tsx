import Link from 'next/link';
import { Hotel, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ResetForm } from './reset-form';

export const metadata = { title: 'Nouveau mot de passe — GestHotel' };
export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-white px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 text-brand-700 mb-8">
          <span className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center">
            <Hotel className="w-5 h-5" />
          </span>
          <span className="text-xl font-bold">GestHotel</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          {!user ? (
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
              <h1 className="mt-3 text-xl font-bold text-slate-900">Lien invalide ou expiré</h1>
              <p className="text-sm text-slate-600 mt-2">
                Le lien de réinitialisation n'est plus valide. Veuillez refaire une demande.
              </p>
              <Link
                href="/forgot-password"
                className="mt-5 inline-block bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition"
              >
                Nouvelle demande
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900">Nouveau mot de passe</h1>
              <p className="text-slate-500 mt-1 mb-6">Choisissez un mot de passe sécurisé (8 caractères min.).</p>
              <ResetForm />
            </>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link href="/login" className="text-brand-600 hover:underline font-semibold">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
