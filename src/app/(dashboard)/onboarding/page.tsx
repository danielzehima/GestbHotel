import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { OnboardingWizard } from './wizard';

export const metadata = { title: 'Configuration — GestHotel' };
export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const user = await requireUser();

  // Seuls les admins peuvent configurer l'hôtel
  if (user.profile.role !== 'admin') redirect('/dashboard');
  if (!user.profile.hotel_id) redirect('/dashboard');

  const supabase = await createClient();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('nom, slug, ville, email, telephone, parametres')
    .eq('id', user.profile.hotel_id)
    .single();

  // Si l'onboarding est déjà terminé, rediriger vers le dashboard
  if ((hotel as any)?.parametres?.onboarding_done === true) {
    redirect('/dashboard');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gestb-hotel.vercel.app';

  return (
    <OnboardingWizard
      initialHotel={{
        nom: (hotel as any)?.nom ?? '',
        slug: (hotel as any)?.slug ?? '',
        ville: (hotel as any)?.ville ?? '',
        email: (hotel as any)?.email ?? '',
        telephone: (hotel as any)?.telephone ?? ''
      }}
      appUrl={appUrl}
    />
  );
}
