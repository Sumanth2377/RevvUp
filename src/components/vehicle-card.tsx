
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Vehicle } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

function getStatusVariant(status: 'ok' | 'due' | 'overdue'): 'default' | 'secondary' | 'destructive' {
    switch (status) {
        case 'overdue':
            return 'destructive';
        case 'due':
            return 'secondary';
        default:
            return 'default';
    }
}


export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
    const overdueCount = (vehicle.maintenanceTasks || []).filter(t => t.status === 'overdue').length;
    const dueCount = (vehicle.maintenanceTasks || []).filter(t => t.status === 'due').length;

  return (
    <Card className="flex flex-col">
      <CardHeader className="p-0">
        <div className="relative h-40 w-full">
            <Image
                src={vehicle.imageUrl}
                alt={`${vehicle.make} ${vehicle.model}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="rounded-t-lg object-cover"
                data-ai-hint={vehicle.imageHint}
            />
        </div>
        <div className="p-6 pb-0">
            <CardTitle className="font-headline text-xl">
            {vehicle.make} {vehicle.model}
            </CardTitle>
            <CardDescription>
            {vehicle.year} &bull; {vehicle.mileage.toLocaleString()} miles
            </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6">
        <div className="flex flex-wrap gap-2">
            {overdueCount > 0 && <Badge variant="destructive">{overdueCount} Overdue</Badge>}
            {dueCount > 0 && <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600 text-white">{dueCount} Due Soon</Badge>}
            {overdueCount === 0 && dueCount === 0 && <Badge variant="default" className="bg-green-600 hover:bg-green-700">All Good</Badge>}
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full" variant="outline">
          <Link href={`/vehicles/${vehicle.id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

    