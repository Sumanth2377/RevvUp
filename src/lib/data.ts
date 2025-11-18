'use client';
import type { MaintenanceTask, ServiceRecord, Vehicle } from './types';
import {
  useCollection,
  useDoc,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, query, onSnapshot } from 'firebase/firestore';
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
    if (isLoading || !vehicles) {
      if (!isLoading) {
        setIsTasksLoading(false);
        setVehiclesWithTasks(vehicles);
      }
      return;
    };

    if (vehicles.length === 0) {
        setVehiclesWithTasks([]);
        setIsTasksLoading(false);
        return;
    }
    
    const fetchTasksForVehicles = async () => {
      if (!firestore || !userId) return;
      const hydratedVehicles = await Promise.all(vehicles.map(async (v) => {
        // This is a simplified fetch for the overview card, so we won't load service history here.
        // We're also not using a hook here since this is a one-time fetch for the list view.
        // A more complex app might use real-time listeners for the task counts.
        const tasksRef = collection(firestore, 'users', userId, 'vehicles', v.id, 'maintenanceTasks');
        return {
            ...v,
            // For the card, we only need to know if tasks exist and their status.
            // A full fetch isn't required, but we're doing it for simplicity here.
            maintenanceTasks: (await new Promise<any[]>(resolve => {
                onSnapshot(tasksRef, (snapshot) => {
                    resolve(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });
            })) || [],
            serviceHistory: []
        };
      }));
      setVehiclesWithTasks(hydratedVehicles);
      setIsTasksLoading(false);
    }
    fetchTasksForVehicles();
    

  }, [vehicles, firestore, userId, isLoading]);
  
  const finalIsLoading = isLoading || isTasksLoading;

  return { vehicles: vehiclesWithTasks, isLoading: finalIsLoading, error };
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

  const {
    data: maintenanceTasks,
    isLoading: areTasksLoading,
    error: tasksError,
  } = useCollection<MaintenanceTask>(maintenanceTasksRef);

  // 3. Fetch all service history records for all tasks
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [areServicesLoading, setAreServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<Error | null>(null);

  useEffect(() => {
    if (areTasksLoading || !maintenanceTasks || !firestore || !userId || !vehicleId) {
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
    
    setAreServicesLoading(true);
    const allHistories: ServiceRecord[] = [];
    let processedTasks = 0;

    const unsubscribers = maintenanceTasks.map(task => {
      const historyQuery = query(
        collection(
          firestore,
          `users/${userId}/vehicles/${vehicleId}/maintenanceTasks/${task.id}/serviceHistory`
        )
      );
      return onSnapshot(
        historyQuery,
        snapshot => {
          snapshot.docChanges().forEach(change => {
            const docData = { id: change.doc.id, ...change.doc.data() } as ServiceRecord;
            const existingIndex = allHistories.findIndex(h => h.id === docData.id);

            if (change.type === 'added' || change.type === 'modified') {
              if (existingIndex !== -1) {
                allHistories[existingIndex] = docData;
              } else {
                allHistories.push(docData);
              }
            } else if (change.type === 'removed') {
              if (existingIndex !== -1) {
                allHistories.splice(existingIndex, 1);
              }
            }
          });
          
          processedTasks++;
          if(processedTasks === maintenanceTasks.length){
             setServiceHistory([...allHistories]);
          }
        },
        error => {
          console.error(`Error fetching service history for task ${task.id}: `, error);
          setServicesError(error);
          processedTasks++;
          if(processedTasks === maintenanceTasks.length){
             setServiceHistory([...allHistories]);
          }
        }
      );
    });
    
    setAreServicesLoading(false);

    return () => unsubscribers.forEach(unsub => unsub());
  }, [maintenanceTasks, areTasksLoading, firestore, userId, vehicleId]);

  // 4. Combine all data
  const [combinedVehicle, setCombinedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (vehicle && maintenanceTasks) {
      setCombinedVehicle({
        ...vehicle,
        maintenanceTasks: maintenanceTasks,
        serviceHistory: serviceHistory,
      });
    } else {
      setCombinedVehicle(null);
    }
  }, [vehicle, maintenanceTasks, serviceHistory]);

  const isLoading = isVehicleLoading || areTasksLoading || areServicesLoading;
  const error = vehicleError || tasksError || servicesError;

  return { vehicle: combinedVehicle, isLoading, error };
}
