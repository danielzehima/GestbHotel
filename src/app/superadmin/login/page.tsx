import { ShieldCheck } from 'lucide-react';
import { isSuperadmin } from '@/lib/superadmin-auth';
import { redirect } from 'next/navigation';
import { SuperadminLoginForm } from './login-form';

export const metadata = { title: 'Super Admin — GestHotel' };

export default async function SuperadminLoginPage() {
  if (await isSuperadmin()) redirect('/superadmin');

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 text-white mb-8">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <span className="text-2xl font-bold tracking-tight">
            GestHotel <span className="text-rose-400">/superadmin</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Accès super administrateur</h1>
          <p className="text-sm text-slate-500 mb-6">
            Saisissez le mot de passe maître pour accéder au panneau de contrôle du SaaS.
          </p>
          <SuperadminLoginForm />
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          ⚠ Zone réservée. Toute tentative d'accès est journalisée.
        </p>
      </div>
    </main>
  );
}
