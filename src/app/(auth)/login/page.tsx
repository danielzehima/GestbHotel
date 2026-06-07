import Link from 'next/link';
import { Hotel, CheckCircle2, CalendarCheck, LayoutGrid, BarChart3 } from 'lucide-react';
import { LoginForm } from './login-form';

export const metadata = { title: 'Connexion — GestHotel' };

const FEATURES = [
  {
    icon: CalendarCheck,
    title: 'Réservations en ligne',
    desc: 'Recevez des réservations directes, sans commission OTA'
  },
  {
    icon: LayoutGrid,
    title: 'Gestion tout-en-un',
    desc: 'Chambres, restaurant, facturation et personnel'
  },
  {
    icon: BarChart3,
    title: 'Pilotage en temps réel',
    desc: "Taux d'occupation, revenus et performances"
  }
];

export default function LoginPage({ searchParams }: { searchParams: { redirect?: string } }) {
  const redirectTo = searchParams?.redirect || '/dashboard';
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* PANNEAU GAUCHE — branding */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-10 xl:p-14 text-white">
        {/* halos décoratifs */}
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 bottom-10 w-56 h-56 bg-white/5 rounded-full blur-2xl" />

        {/* logo */}
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Hotel className="w-6 h-6" />
          </span>
          <span className="text-2xl font-bold tracking-tight">GestHotel</span>
        </Link>

        {/* accroche + features */}
        <div className="relative">
          <h1 className="text-4xl xl:text-[2.75rem] font-bold leading-tight">
            Bienvenue sur GestHotel
          </h1>
          <p className="mt-4 text-brand-100 text-lg max-w-md">
            La plateforme tout-en-un pour gérer votre hôtel et booster vos revenus.
          </p>

          <div className="mt-10 space-y-3 max-w-md">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4"
              >
                <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {title}
                  </p>
                  <p className="text-sm text-brand-100">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-brand-100/80">
          © {new Date().getFullYear()} GestHotel — La gestion hôtelière simplifiée.
        </p>
      </div>

      {/* PANNEAU DROIT — formulaire */}
      <div className="flex items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          {/* logo compact (mobile uniquement) */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2 text-brand-700 mb-8">
            <span className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center">
              <Hotel className="w-5 h-5" />
            </span>
            <span className="text-xl font-bold">GestHotel</span>
          </Link>

          <h2 className="text-2xl font-bold text-slate-900">Se connecter</h2>
          <p className="text-slate-500 mt-1 mb-7">Entrez vos identifiants pour continuer</p>

          <LoginForm redirectTo={redirectTo} />

          <p className="text-center text-sm text-slate-500 mt-6">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-brand-600 hover:underline font-semibold">
              Créer un compte
            </Link>
          </p>
          <p className="text-center text-xs text-slate-400 mt-2">
            Employé d'un hôtel existant ? Demandez à votre administrateur de vous inscrire.
          </p>
        </div>
      </div>
    </main>
  );
}
