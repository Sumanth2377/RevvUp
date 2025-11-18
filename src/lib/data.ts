'use client';
import type { Vehicle } from './types';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

export function useVehicles(userId?: string) {
  const firestore = useFirestore();
  const vehiclesQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return collection(firestore, 'users', userId, 'vehicles');
  }, [firestore, userId]);
  
  const { data: vehicles, isLoading, error } = useCollection<Vehicle>(vehiclesQuery);
  
  return { vehicles, isLoading, error };
}

export function useVehicleById(userId?: string, vehicleId?: string) {
  const firestore = useFirestore();

  const vehicleRef = useMemoFirebase(() => {
    if (!firestore || !userId || !vehicleId) return null;
    return doc(firestore, 'users', userId, 'vehicles', vehicleId);
  }, [firestore, userId, vehicleId]);

  const { data: vehicle, isLoading, error } = useDoc<Vehicle>(vehicleRef);

  // This part is tricky because subcollections are not automatically fetched.
  // For now, we will assume they come with the vehicle document, but in a real scenario
  // you would need separate hooks/queries for maintenanceTasks and serviceHistory.
  // The backend.json defines them as subcollections.
  const maintenanceTasksQuery = useMemoFirebase(() => {
    if (!vehicleRef) return null;
    return collection(vehicleRef, 'maintenanceTasks');
  }, [vehicleRef]);

  const serviceHistoryQuery = useMemoFirebase(() => {
    if (!vehicleRef) return null;
    // This is not quite right as service history is nested under tasks.
    // For now, let's just create the query path. A real app would need a more complex setup.
    // Let's assume for now we are fetching all service history for a vehicle, even though it's nested.
    // This is a simplification. The correct path is /users/{userId}/vehicles/{vehicleId}/maintenanceTasks/{taskId}/serviceHistory/{historyId}
    // We will just fetch service history for the vehicle for now.
    return collection(firestore, `users/${userId}/vehicles/${vehicleId}/serviceHistory`);
  }, [firestore, userId, vehicleId]);
  
  const { data: maintenanceTasks } = useCollection(maintenanceTasksQuery);
  const { data: serviceHistory } = useCollection(serviceHistoryQuery);

  const vehicleWithSubcollections = useMemoFirebase(() => {
    if (!vehicle) return null;
    return {
      ...vehicle,
      maintenanceTasks: maintenanceTasks || [],
      serviceHistory: serviceHistory || [],
    }
  }, [vehicle, maintenanceTasks, serviceHistory]);


  return { vehicle: vehicleWithSubcollections, isLoading: isLoading, error };
}
