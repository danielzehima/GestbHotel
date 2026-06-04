import { Mail, MapPin, Phone, Clock, MessageSquare } from 'lucide-react';
import { PublicShell } from '@/components/landing/public-shell';
import { ContactForm } from './contact-form';

export const metadata = {
  title: 'Contact — GestHotel',
  description: 'Contactez l\'équipe GestHotel pour toute question, démonstration ou demande d\'accès gratuit.'
};

export default function ContactPage() {
  return (
    <PublicShell
      title="Parlons de votre projet"
      description="Une question, une démo, un besoin spécifique ? Notre équipe vous répond sous 24h ouvrées."
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
        {/* Infos contact */}
        <aside className="lg:col-span-2 space-y-4">
          <InfoCard icon={Mail} title="Email" color="bg-brand-50 text-brand-700">
            <a href="mailto:danielzehima@gmail.com" className="text-brand-700 hover:underline font-medium">
              danielzehima@gmail.com
            </a>
            <p className="text-xs text-slate-500 mt-1">Réponse sous 24h ouvrées</p>
          </InfoCard>

          <InfoCard icon={Phone} title="Téléphone / WhatsApp" color="bg-emerald-50 text-emerald-700">
            <a href="tel:+2250710075257" className="block text-slate-900 hover:text-emerald-700 font-medium">
              +225 07 10 07 52 57
            </a>
            <a href="tel:+2250564149092" className="block text-slate-900 hover:text-emerald-700 font-medium">
              +225 05 64 14 90 92
            </a>
          </InfoCard>

          <InfoCard icon={MapPin} title="Adresse" color="bg-amber-50 text-amber-700">
            <p className="text-slate-700">Abidjan, Côte d'Ivoire</p>
          </InfoCard>

          <InfoCard icon={Clock} title="Horaires" color="bg-rose-50 text-rose-700">
            <p className="text-slate-700 text-sm">Lundi – Vendredi : 8h – 18h</p>
            <p className="text-slate-700 text-sm">Samedi : 9h – 13h</p>
          </InfoCard>

          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 text-white rounded-xl p-5">
            <MessageSquare className="w-6 h-6 mb-2" />
            <h3 className="font-bold">Besoin urgent ?</h3>
            <p className="text-sm text-brand-100 mt-1">
              Appelez-nous directement ou écrivez sur WhatsApp pour une réponse immédiate.
            </p>
          </div>
        </aside>

        {/* Formulaire */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Envoyez-nous un message</h2>
            <p className="text-sm text-slate-500 mb-6">Tous les champs marqués d'un * sont obligatoires.</p>
            <ContactForm />
          </div>
        </div>
      </div>
    </PublicShell>
  );
}

function InfoCard({
  icon: Icon,
  title,
  color,
  children
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-1.5">{title}</h3>
      <div className="text-sm">{children}</div>
    </div>
  );
}
