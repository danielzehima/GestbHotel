import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { InviteForm } from './invite-form';

export const metadata = { title: 'Inviter un membre — GestHotel' };

export default async function NewMemberPage() {
  await requireRole(['admin']);
  return (
    <div>
      <PageHeader
        title="Inviter un nouveau membre"
        description="Créez le compte de votre employé et attribuez-lui un rôle. Les identifiants seront affichés une seule fois."
      />
      <InviteForm />
    </div>
  );
}
