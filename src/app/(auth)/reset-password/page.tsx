import Link from 'next/link';
import { Hotel } from 'lucide-react';
import { ResetForm } from './reset-form';

export const metadata = { title: 'Nouveau mot de passe — GestHotel' };

export default function ResetPasswordPage() {
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
          <ResetForm />
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
