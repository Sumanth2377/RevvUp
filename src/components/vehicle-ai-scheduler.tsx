'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { suggestMaintenanceScheduleAction } from '@/lib/actions';
import type { Vehicle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WandSparkles, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <WandSparkles className="mr-2 h-4 w-4" />
          Get AI Suggestions
        </>
      )}
    </Button>
  );
}

export function VehicleAiScheduler({ vehicle }: { vehicle: Vehicle }) {
  const initialState = {
    suggestedMaintenanceSchedule: '',
    error: '',
  };

  const [state, formAction] = useActionState(
    suggestMaintenanceScheduleAction,
    initialState
  );

  return (
    <Card>
      <form action={formAction}>
        <CardHeader>
          <CardTitle>AI-Powered Maintenance Suggestions</CardTitle>
          <CardDescription>
            Get an optimal maintenance schedule based on your vehicle&apos;s usage
            and history, powered by generative AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input type="hidden" name="vehicleMake" value={vehicle.make} />
          <input type="hidden" name="vehicleModel" value={vehicle.model} />
          <input type="hidden" name="vehicleYear" value={String(vehicle.year)} />
          <input
            type="hidden"
            name="currentMileage"
            value={String(vehicle.mileage)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="lastServiceDate">Last Service Date</Label>
              <Input
                id="lastServiceDate"
                name="lastServiceDate"
                type="date"
                defaultValue={vehicle.maintenanceTasks[0]?.lastServiceDate || ''}
                required
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="drivingStyle">Driving Style</Label>
              <Input
                id="drivingStyle"
                name="drivingStyle"
                placeholder="e.g., mostly city, aggressive, long commutes"
                defaultValue="Normal city and highway mix"
                required
              />
            </div>
          </div>
         
          <div className="space-y-2">
            <Label htmlFor="maintenanceHistory">
              Additional Maintenance History or Notes
            </Label>
            <Textarea
              id="maintenanceHistory"
              name="maintenanceHistory"
              placeholder="e.g., Replaced alternator at 20,000 miles. Noticed a slight noise from the front left wheel."
              rows={4}
            />
          </div>

          {state.error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state.suggestedMaintenanceSchedule && (
            <Alert>
              <WandSparkles className="h-4 w-4" />
              <AlertTitle>Suggested Schedule</AlertTitle>
              <AlertDescription>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {state.suggestedMaintenanceSchedule}
                </div>
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
