import DashboardClient from '@/components/dashboard-client';
import { getVehicles } from '@/lib/data';

export default async function DashboardPage() {
  const vehicles = await getVehicles();

  return <DashboardClient vehicles={vehicles} />;
}
