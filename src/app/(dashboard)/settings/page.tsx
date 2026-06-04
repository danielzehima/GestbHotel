import { Hotel, User, KeyRound } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { HotelForm } from './hotel-form';
import { ProfileForm } from './profile-form';
import { PasswordForm } from './password-form';

export const metadata = { title: 'Paramètres — GestHotel' };

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, nom, adresse, ville, pays, telephone, email, devise, logo_url, slug')
    .eq('id', user.profile.hotel_id!)
    .single();

  const isAdmin = user.profile.role === 'admin';

  return (
    <div>
      <PageHeader title="Paramètres" description="Configurez votre hôtel et votre compte." />

      <div className="space-y-6 max-w-3xl">
        {/* Hôtel — admin uniquement */}
        {isAdmin && hotel && (
          <Section icon={Hotel} title="Informations de l'hôtel" description="Apparaît sur les factures et le menu public.">
            <HotelForm initial={hotel as any} />
          </Section>
        )}

        {/* Profil utilisateur */}
        <Section icon={User} title="Mon profil" description="Vos informations personnelles.">
          <ProfileForm
            initial={{
              nom: user.profile.nom,
              prenom: user.profile.prenom,
              telephone: '',
              email: user.email
            }}
          />
        </Section>

        {/* Mot de passe */}
        <Section icon={KeyRound} title="Mot de passe" description="Modifier votre mot de passe de connexion.">
          <PasswordForm />
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
