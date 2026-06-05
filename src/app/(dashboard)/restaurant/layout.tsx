import { requireUser } from '@/lib/auth';
import { getHotelPlanLimits } from '@/lib/plan-limits';
import { FeatureLocked } from '@/components/feature-locked';

export default async function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  if (user.profile.hotel_id) {
    const { limits, isExpired } = await getHotelPlanLimits(user.profile.hotel_id);

    if (isExpired) {
      return (
        <FeatureLocked
          feature="Restaurant"
          description="Votre forfait a expiré. Renouvelez-le pour réactiver l'accès au module Restaurant."
        />
      );
    }

    if (!limits.restaurant) {
      return (
        <FeatureLocked
          feature="Restaurant"
          requiredPlan="Standard"
          description="Le module Restaurant (menus, QR code, interface cuisine, commandes) est inclus à partir du forfait Standard."
        />
      );
    }
  }

  return <>{children}</>;
}
