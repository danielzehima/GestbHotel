import Link from 'next/link';
import { Hotel, Check } from 'lucide-react';
import { RegisterForm } from './register-form';

export const metadata = { title: 'Créer un compte — GestHotel' };

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-brand-50 to-white">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Pitch côté gauche */}
        <div className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-2 text-brand-700 mb-6">
            <Hotel className="w-8 h-8" />
            <span className="text-2xl font-bold">GestHotel</span>
          </Link>

          <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-4">
            Digitalisez votre hôtel<br />en quelques minutes.
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Chambres, réservations, restaurant QR, facturation et mobile money — tout dans une seule plateforme.
          </p>

          <ul className="space-y-3 text-slate-700">
            {[
              'Gestion des chambres et réservations',
              'Calendrier interactif des disponibilités',
              'Restaurant avec QR code et interface cuisine',
              'Facturation + paiements Wave / OM / MTN / Moov',
              'Multi-utilisateurs avec rôles (réception, ménage, cuisine…)'
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Formulaire côté droit */}
        <div>
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2 text-brand-700 mb-6">
            <Hotel className="w-8 h-8" />
            <span className="text-2xl font-bold">GestHotel</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Créer votre compte</h2>
            <p className="text-slate-500 mb-6">Vous serez automatiquement administrateur de votre hôtel.</p>

            <RegisterForm />

            <p className="text-center text-sm text-slate-500 mt-6">
              Déjà inscrit ?{' '}
              <Link href="/login" className="text-brand-600 hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
