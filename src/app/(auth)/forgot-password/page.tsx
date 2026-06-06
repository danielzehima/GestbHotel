import Link from 'next/link';
import { Hotel } from 'lucide-react';
import { ForgotForm } from './forgot-form';

export const metadata = { title: 'Mot de passe oublié — GestHotel' };

export default function ForgotPasswordPage() {
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
          <h1 className="text-2xl font-bold text-slate-900">Mot de passe oublié ?</h1>
          <p className="text-slate-500 mt-1 mb-6">
            Saisissez votre email : nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
          <ForgotForm />
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
