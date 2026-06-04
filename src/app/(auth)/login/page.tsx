import Link from 'next/link';
import { Hotel } from 'lucide-react';
import { LoginForm } from './login-form';

export const metadata = { title: 'Connexion — GestHotel' };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-brand-50 to-white">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 text-brand-700 mb-8">
          <Hotel className="w-8 h-8" />
          <span className="text-2xl font-bold">GestHotel</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Connexion</h1>
          <p className="text-slate-500 mb-6">Accédez à votre espace de gestion.</p>

          <LoginForm />
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-brand-600 hover:underline font-medium">
            Créer un compte
          </Link>
        </p>
        <p className="text-center text-xs text-slate-400 mt-2">
          Vous êtes employé d'un hôtel existant ? Demandez à votre administrateur de vous inscrire.
        </p>
      </div>
    </main>
  );
}
