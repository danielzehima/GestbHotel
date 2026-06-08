import { requireSuperadmin } from '@/lib/superadmin-auth';
import { SuperadminShell } from './superadmin-shell';

export default async function SuperadminProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireSuperadmin();

  return <SuperadminShell>{children}</SuperadminShell>;
}
