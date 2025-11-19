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
    return query(collection(firestore, 'users', userId, 'vehicles'));
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
      setIsTasksLoading(true);
      try {
        const hydratedVehicles = await Promise.all(vehicles.map(async (v) => {
          const tasksRef = collection(firestore, 'users', userId, 'vehicles', v.id, 'maintenanceTasks');
          const tasksSnapshot = await getDocs(tasksRef);
          const maintenanceTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MaintenanceTask[];
          
          // Simplified status logic for card view
          const overdueCount = maintenanceTasks.filter(t => t.status === 'overdue').length;
          const dueCount = maintenanceTasks.filter(t => t.status === 'due').length;

          return {
              ...v,
              maintenanceTasks: maintenanceTasks || [],
              serviceHistory: [], // Not needed for the main list view
              overdueCount,
              dueCount,
          };
        }));
        setVehiclesWithTasks(hydratedVehicles);
      } catch (error) {
        console.error("Error fetching tasks for vehicles:", error);
      } finally {
        setIsTasksLoading(false);
      }
    }
    fetchTasksForVehicles();
    

  }, [vehicles, firestore, userId, isLoading]);
  
  const finalIsLoading = isLoading || isTasksLoading;

  return { vehicles: vehiclesWithTasks, isLoading: finalIsLoading, error };
}


export function useVehicleById(userId?: string, vehicleId?: string) {
  const firestore = useFirestore();

  const vehicleRef = useMemoFirebase(() => {
    if (!firestore || !userId || !vehicleId) return null;
    return doc(firestore, 'users', userId, 'vehicles', vehicleId);
  }, [firestore, userId, vehicleId]);

  const {
    data: vehicleData,
    isLoading: isVehicleLoading,
    error: vehicleError,
  } = useDoc<Omit<Vehicle, 'maintenanceTasks' | 'serviceHistory'>>(vehicleRef);

  const maintenanceTasksQuery = useMemoFirebase(() => {
    if (!vehicleRef) return null;
    return query(collection(vehicleRef, 'maintenanceTasks'));
  }, [vehicleRef]);

  const {
    data: maintenanceTasks,
    isLoading: areTasksLoading,
    error: tasksError,
  } = useCollection<MaintenanceTask>(maintenanceTasksQuery);

  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [areServicesLoading, setAreServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore || !userId || !vehicleId || !maintenanceTasks) {
      if(!areTasksLoading) {
        setAreServicesLoading(false);
      }
      return;
    }

    setAreServicesLoading(true);
    
    if (maintenanceTasks.length === 0) {
      setServiceHistory([]);
      setAreServicesLoading(false);
      return;
    }

    const unsubscribers = maintenanceTasks.map(task => {
        const historyQuery = query(
            collection(firestore, `users/${userId}/vehicles/${vehicleId}/maintenanceTasks/${task.id}/serviceHistory`)
        );
        return onSnapshot(historyQuery, 
            (snapshot) => {
                setServiceHistory(prevHistory => {
                    const otherTasksHistory = prevHistory.filter(h => h.maintenanceTaskId !== task.id);
                    const thisTaskHistory = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ServiceRecord));
                    return [...otherTasksHistory, ...thisTaskHistory];
                });
            },
            (error) => {
                console.error(`Error fetching service history for task ${task.id}: `, error);
                setServicesError(error);
            }
        );
    });

    setAreServicesLoading(false);
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [maintenanceTasks, areTasksLoading, firestore, userId, vehicleId]);


  const combinedVehicle = useMemo(() => {
    if (isVehicleLoading || areTasksLoading || areServicesLoading || !vehicleData) {
      return null;
    }

    return {
      ...vehicleData,
      maintenanceTasks: maintenanceTasks || [],
      serviceHistory: serviceHistory || [],
    };
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
