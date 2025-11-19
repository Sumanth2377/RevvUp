'use client';
import type { MaintenanceTask, ServiceRecord, Vehicle, Notification } from './types';
import {
  useCollection,
  useDoc,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, query, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
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
        const tasksRef = collection(firestore, 'users', userId, 'vehicles', v.id, 'maintenanceTasks');
        const tasksSnapshot = await getDocs(tasksRef);
        const maintenanceTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MaintenanceTask[];
        return {
            ...v,
            maintenanceTasks: maintenanceTasks,
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
    data: vehicleData,
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
    if (areTasksLoading || !maintenanceTasks) {
      if (!areTasksLoading) {
        setAreServicesLoading(false);
        setServiceHistory([]); // No tasks, no history.
      }
      return;
    }

    if (maintenanceTasks.length === 0) {
      setServiceHistory([]);
      setAreServicesLoading(false);
      return;
    }
    
    setAreServicesLoading(true);

    const unsubscribers = maintenanceTasks.map(task => {
      const historyQuery = query(
        collection(
          firestore,
          `users/${userId}/vehicles/${vehicleId}/maintenanceTasks/${task.id}/serviceHistory`
        )
      );
      
      // onSnapshot sets up the real-time listener
      return onSnapshot(
        historyQuery,
        snapshot => {
          setServiceHistory(prevHistory => {
            let nextHistory = [...prevHistory];

            snapshot.docChanges().forEach(change => {
              const docData = { id: change.doc.id, ...change.doc.data() } as ServiceRecord;
              const existingIndex = nextHistory.findIndex(h => h.id === docData.id);

              if (change.type === 'removed') {
                if (existingIndex > -1) {
                  nextHistory.splice(existingIndex, 1);
                }
              } else { // added or modified
                if (existingIndex > -1) {
                  nextHistory[existingIndex] = docData; // Update
                } else {
                  nextHistory.push(docData); // Add
                }
              }
            });
            return nextHistory;
          });
        },
        error => {
          console.error(`Error fetching service history for task ${task.id}: `, error);
          setServicesError(error);
        }
      );
    });

    setAreServicesLoading(false);

    // Cleanup function to unsubscribe from all listeners on unmount
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [maintenanceTasks, areTasksLoading, firestore, userId, vehicleId]);

  // 4. Combine all data into a final vehicle object
  const [combinedVehicle, setCombinedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (isVehicleLoading || areTasksLoading || areServicesLoading) return;
    
    if (vehicleData) {
      setCombinedVehicle({
        ...vehicleData,
        maintenanceTasks: maintenanceTasks || [],
        serviceHistory: serviceHistory || [],
      });
    } else {
      setCombinedVehicle(null);
    }
  }, [vehicleData, maintenanceTasks, serviceHistory, isVehicleLoading, areTasksLoading, areServicesLoading]);

  const isLoading = isVehicleLoading || areTasksLoading || areServicesLoading;
  const error = vehicleError || tasksError || servicesError;

  return { vehicle: combinedVehicle, isLoading, error };
}

export function useNotifications(userId?: string) {
  const firestore = useFirestore();
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, userId]);

  const { data: notifications, isLoading, error } = useCollection<Notification>(notificationsQuery);

  return { notifications, isLoading, error };
}
