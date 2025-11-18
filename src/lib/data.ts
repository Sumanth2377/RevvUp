'use client';
import type { MaintenanceTask, ServiceRecord, Vehicle } from './types';
import {
  useCollection,
  useDoc,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useVehicles(userId?: string) {
  const firestore = useFirestore();
  const vehiclesQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return collection(firestore, 'users', userId, 'vehicles');
  }, [firestore, userId]);

  const {
    data: vehicles,
    isLoading,
    error,
  } = useCollection<Vehicle>(vehiclesQuery);

  return { vehicles, isLoading, error };
}

export function useVehicleById(userId?: string, vehicleId?: string) {
  const firestore = useFirestore();

  // 1. Fetch the main vehicle document
  const vehicleRef = useMemoFirebase(() => {
    if (!firestore || !userId || !vehicleId) return null;
    return doc(firestore, 'users', userId, 'vehicles', vehicleId);
  }, [firestore, userId, vehicleId]);
  const {
    data: vehicle,
    isLoading: isVehicleLoading,
    error: vehicleError,
  } = useDoc<Omit<Vehicle, 'maintenanceTasks' | 'serviceHistory'>>(vehicleRef);

  // 2. Fetch the maintenanceTasks subcollection
  const maintenanceTasksQuery = useMemoFirebase(() => {
    if (!vehicleRef) return null;
    return collection(vehicleRef, 'maintenanceTasks');
  }, [vehicleRef]);
  const {
    data: maintenanceTasks,
    isLoading: areTasksLoading,
    error: tasksError,
  } = useCollection<MaintenanceTask>(maintenanceTasksQuery);

  // 3. Fetch all service history records for all tasks
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [areServicesLoading, setAreServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<Error | null>(null);

  useEffect(() => {
    if (!maintenanceTasks || !firestore || !userId || !vehicleId) {
      // If there are no tasks or required IDs, we're not loading services.
      if (!areTasksLoading) {
        setAreServicesLoading(false);
      }
      return;
    }
    
    if (maintenanceTasks.length === 0) {
        setServiceHistory([]);
        setAreServicesLoading(false);
        return;
    }


    const fetchAllServiceHistory = async () => {
      setAreServicesLoading(true);
      setServicesError(null);
      try {
        const allHistory: ServiceRecord[] = [];
        // This is not perfectly efficient as it creates N listeners for N tasks.
        // A more advanced implementation might use a single query if the data model allowed.
        const listeners = maintenanceTasks.map(task => {
          const historyQuery = query(collection(firestore, `users/${userId}/vehicles/${vehicleId}/maintenanceTasks/${task.id}/serviceHistory`));
          
          return new Promise<ServiceRecord[]>((resolve, reject) => {
             // In a real app, you would manage these listeners more carefully
            const { data: historyData, error } = useCollection(historyQuery);
            if (error) return reject(error);
            if(historyData) {
                resolve(historyData as ServiceRecord[]);
            }
          });
        });

        // This approach is simplified for the hook structure. A more robust solution
        // might involve a different pattern to avoid useCollection inside a loop.
        // For this context, we will fetch them once.
        const taskHistoryArrays = await Promise.all(
          maintenanceTasks.map(task => {
            const historyQuery = query(collection(firestore, `users/${userId}/vehicles/${vehicleId}/maintenanceTasks/${task.id}/serviceHistory`));
            const { data } = useCollection(historyQuery);
            return Promise.resolve(data || []);
          })
        );
        
        const flattenedHistory = taskHistoryArrays.flat();
        setServiceHistory(flattenedHistory as ServiceRecord[]);

      } catch (e: any) {
        setServicesError(e);
      } finally {
        setAreServicesLoading(false);
      }
    };

    fetchAllServiceHistory();
  }, [maintenanceTasks, firestore, userId, vehicleId, areTasksLoading]);
  
  // 4. Combine all data
  const [combinedVehicle, setCombinedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (vehicle) {
      setCombinedVehicle({
        ...vehicle,
        maintenanceTasks: maintenanceTasks || [],
        serviceHistory: serviceHistory || [],
      });
    } else {
      setCombinedVehicle(null);
    }
  }, [vehicle, maintenanceTasks, serviceHistory]);

  const isLoading = isVehicleLoading || areTasksLoading || areServicesLoading;
  const error = vehicleError || tasksError || servicesError;

  return { vehicle: combinedVehicle, isLoading, error };
}