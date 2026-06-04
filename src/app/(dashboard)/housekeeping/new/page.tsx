import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { TaskForm } from './task-form';

export const metadata = { title: 'Nouvelle tâche — GestHotel' };

export default async function NewTaskPage() {
  const user = await requireRole(['admin', 'receptionniste']);
  const supabase = await createClient();

  const [{ data: rooms }, { data: staff }] = await Promise.all([
    supabase
      .from('rooms')
      .select('id, numero, statut')
      .eq('hotel_id', user.profile.hotel_id!)
      .order('numero'),
    supabase
      .from('profiles')
      .select('id, nom, prenom')
      .eq('hotel_id', user.profile.hotel_id!)
      .in('role', ['menage', 'admin'])
      .order('nom')
  ]);

  return (
    <div>
      <PageHeader title="Nouvelle tâche de ménage" />
      <TaskForm rooms={(rooms ?? []) as any} staff={(staff ?? []) as any} />
    </div>
  );
}
