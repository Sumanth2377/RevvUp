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
  } = useCollection<Omit<Vehicle, 'maintenanceTasks' | 'serviceHistory'>>(vehiclesQuery);
  
  const [vehiclesWithTasks, setVehiclesWithTasks] = useState<Vehicle[] | null>(null);
  const [isTasksLoading, setIsTasksLoading] = useState(true);

  useEffect(() => {
    if (!vehicles || !firestore || !userId) {
        if (!isLoading) {
            setIsTasksLoading(false);
            setVehiclesWithTasks(vehicles);
        }
        return;
    };

    if (vehicles.length === 0) {
        setIsTasksLoading(false);
        setVehiclesWithTasks([]);
        return;
    }

    Promise.all(vehicles.map(async v => {
      const tasksRef = collection(firestore, 'users', userId, 'vehicles', v.id, 'maintenanceTasks');
      const { data: tasks } = await new Promise<any>(resolve => {
        const { data, isLoading } = useCollection(tasksRef);
        if (!isLoading) resolve({data});
      });
      // This is a simplified fetch for the overview card, so we won't load service history here.
      return {
          ...v,
          maintenanceTasks: tasks || [],
          serviceHistory: []
      }
    })).then(hydratedVehicles => {
        // This is tricky because useCollection is async. A better implementation
        // would involve a more complex state management or dedicated sub-components.
        // For now, we will re-fetch to update the state.
        setVehiclesWithTasks(hydratedVehicles);
        setIsTasksLoading(false);
    });
    
    // A simplified approach for now. We will just get the vehicles and their tasks for the main list.
    const getTasks = async () => {
        const vehiclesWithHydratedTasks: Vehicle[] = [];
        for (const v of vehicles) {
            const tasksRef = query(collection(firestore, `users/${userId}/vehicles/${v.id}/maintenanceTasks`));
            const { data } = useCollection(tasksRef);
            // This is a simplification and might not be fully reactive.
            const tasks = data || []; 
            vehiclesWithHydratedTasks.push({
                ...v,
                maintenanceTasks: tasks as MaintenanceTask[],
                serviceHistory: [],
            });
        }
        setVehiclesWithTasks(vehiclesWithHydratedTasks);
        setIsTasksLoading(false);
    }
    
    getTasks();

  }, [vehicles, firestore, userId, isLoading]);
  
  const finalIsLoading = isLoading || isTasksLoading;

  // This is a workaround for the data re-fetching. In a real app, you'd want a more robust solution.
  // We'll return the vehicles with tasks if available, otherwise the base vehicles.
  const dataToReturn = vehiclesWithTasks || vehicles?.map(v => ({...v, maintenanceTasks: [], serviceHistory: []})) || [];

  return { vehicles: dataToReturn, isLoading: finalIsLoading, error };
}

function useSubCollections<T>(
  docRef: firebase.firestore.DocumentReference | null,
  subCollectionName: string
) {
  const subCollectionRef = useMemoFirebase(() => {
    if (!docRef) return null;
    return collection(docRef, subCollectionName);
  }, [docRef, subCollectionName]);

  return useCollection<T>(subCollectionRef);
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
  const maintenanceTasksRef = useMemoFirebase(() => {
      if (!vehicleRef) return null;
      return collection(vehicleRef, 'maintenanceTasks');
  }, [vehicleRef]);

  const { data: maintenanceTasks, isLoading: areTasksLoading, error: tasksError } = useCollection<MaintenanceTask>(maintenanceTasksRef);

  // 3. Fetch all service history records for all tasks
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [areServicesLoading, setAreServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<Error | null>(null);

  useEffect(() => {
    setAreServicesLoading(true);
    if (!maintenanceTasks || !firestore || !userId || !vehicleId) {
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

    const unsubscribers = maintenanceTasks.map(task => {
        const historyQuery = query(collection(firestore, `users/${userId}/vehicles/${vehicleId}/maintenanceTasks/${task.id}/serviceHistory`));
        return onSnapshot(historyQuery, (snapshot) => {
            const histories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
            setServiceHistory(prev => {
                const otherHistories = prev.filter(h => h.maintenanceTaskId !== task.id);
                return [...otherHistories, ...histories];
            });
        }, (error) => {
            console.error(`Error fetching service history for task ${task.id}: `, error);
            setServicesError(error);
        });
    });

    setAreServicesLoading(false);

    return () => unsubscribers.forEach(unsub => unsub());

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
