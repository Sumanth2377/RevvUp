'use client';
import type { MaintenanceTask, ServiceRecord, Vehicle, Notification } from './types';
import {
  useCollection,
  useDoc,
  useFirestore,
  useMemoFirebase,
  setDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, query, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, formatISO } from 'date-fns';

const defaultTasks = [
    {
        name: 'Oil Change',
        description: 'Standard engine oil and filter change.',
        intervalType: 'Time',
        intervalValue: 6, // months
        nextDueMileageInterval: 5000, // miles
    },
    {
        name: 'Tire Rotation',
        description: 'Rotate tires to ensure even wear.',
        intervalType: 'Time',
        intervalValue: 6, // months
        nextDueMileageInterval: 7500, // miles
    },
    {
        name: 'Brake Inspection',
        description: 'Inspect brake pads, rotors, and fluid.',
        intervalType: 'Time',
        intervalValue: 12, // months
        nextDueMileageInterval: 12000, // miles
    },
    {
        name: 'Routine Inspection',
        description: 'Check fluid levels, belts, hoses, and lights.',
        intervalType: 'Time',
        intervalValue: 3, // months
        nextDueMileageInterval: 3000, // miles
    },
    {
        name: 'Preventive Maintenance',
        description: 'Scheduled services to prevent future issues.',
        intervalType: 'Time',
        intervalValue: 12, // months
        nextDueMileageInterval: 15000, // miles
    },
    {
        name: 'Repairs & Replacements',
        description: 'Address any necessary repairs or part replacements.',
        intervalType: 'Time',
        intervalValue: 12, // months
        nextDueMileageInterval: 0, // Ad-hoc
    },
    {
        name: 'Safety Checks',
        description: 'Inspect airbags, seatbelts, and other safety systems.',
        intervalType: 'Time',
        intervalValue: 24, // months
        nextDueMileageInterval: 24000, // miles
    },
    {
        name: 'System Updates',
        description: 'Check for software or firmware updates for the vehicle systems.',
        intervalType: 'Time',
        intervalValue: 12, // months
        nextDueMileageInterval: 0, // Not mileage dependent
    },
    {
        name: 'Documentation',
        description: 'Update service records, registration, or insurance.',
        intervalType: 'Time',
        intervalValue: 12,
        nextDueMileageInterval: 0,
    },
    {
        name: 'Emergency Tasks',
        description: 'Tasks related to unforeseen events like flat tires or battery issues.',
        intervalType: 'Time',
        intervalValue: 12,
        nextDueMileageInterval: 0,
    },
];

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
        data: vehicle,
        isLoading: isVehicleLoading,
        error: vehicleError,
    } = useDoc<Omit<Vehicle, 'maintenanceTasks' | 'serviceHistory'>>(vehicleRef);

    return { vehicle, isLoading: isVehicleLoading, error: vehicleError };
}

export function useVehicleDetails(userId?: string, baseVehicle?: Vehicle | null) {
  const firestore = useFirestore();
  const vehicleId = baseVehicle?.id;

  const maintenanceTasksQuery = useMemoFirebase(() => {
    if (!firestore || !userId || !vehicleId) return null;
    return query(collection(firestore, 'users', userId, 'vehicles', vehicleId, 'maintenanceTasks'));
  }, [firestore, userId, vehicleId]);

  const {
    data: maintenanceTasks,
    isLoading: areTasksLoading,
    error: tasksError,
  } = useCollection<MaintenanceTask>(maintenanceTasksQuery);

  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [areServicesLoading, setAreServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<Error | null>(null);

  // Effect to backfill default tasks for existing vehicles
  useEffect(() => {
    if (!firestore || !userId || !vehicleId || !maintenanceTasks || !baseVehicle || areTasksLoading) {
      return;
    }

    const existingTaskNames = new Set(maintenanceTasks.map(t => t.name));
    const missingTasks = defaultTasks.filter(dt => !existingTaskNames.has(dt.name));

    if (missingTasks.length > 0) {
      console.log(`Adding ${missingTasks.length} missing default tasks to vehicle ${vehicleId}`);
      missingTasks.forEach(taskInfo => {
        const taskId = uuidv4();
        const taskRef = doc(firestore, `users/${userId}/vehicles/${vehicleId}/maintenanceTasks`, taskId);
        const nextDueDate = addMonths(new Date(), taskInfo.intervalValue);

        const newTask = {
          id: taskId,
          vehicleId: vehicleId,
          name: taskInfo.name,
          description: taskInfo.description,
          intervalType: taskInfo.intervalType,
          intervalValue: taskInfo.intervalValue,
          lastPerformedDate: null,
          lastPerformedMileage: null,
          nextDueDate: formatISO(nextDueDate),
          nextDueMileage: taskInfo.nextDueMileageInterval > 0 ? baseVehicle.mileage + taskInfo.nextDueMileageInterval : null,
          status: 'due',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        // This will trigger the useCollection hook to update
        setDocumentNonBlocking(taskRef, newTask, { merge: false });
      });
    }
  }, [maintenanceTasks, areTasksLoading, firestore, userId, vehicleId, baseVehicle]);


  useEffect(() => {
    // We can't start fetching service history until we have tasks.
    if (!firestore || !userId || !vehicleId || maintenanceTasks === null) {
      // If tasks are finished loading and there are none, we can stop loading services.
      if (!areTasksLoading && maintenanceTasks === null) {
        setAreServicesLoading(false);
      }
      return;
    }

    setAreServicesLoading(true);
    
    // If there are no tasks, there's no history to fetch.
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
                    // Replace the history for this task with the new snapshot data
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
    
    // All listeners are attached, so we can consider this part of loading complete.
    // The data will flow in via the snapshots.
    setAreServicesLoading(false);
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  // Rerun when the list of tasks changes (e.g., after backfilling)
  }, [maintenanceTasks, areTasksLoading, firestore, userId, vehicleId]);


  const combinedVehicle = useMemo(() => {
    if (!baseVehicle) {
      return null;
    }

    // Only combine when tasks are loaded and not null.
    // Service history can be empty initially.
    if (maintenanceTasks === null) {
      return null;
    }

    return {
      ...baseVehicle,
      maintenanceTasks: maintenanceTasks || [],
      // Sort history here to ensure consistent order
      serviceHistory: (serviceHistory || []).sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()),
    };
  }, [baseVehicle, maintenanceTasks, serviceHistory]);

  // Combined loading state. We are loading if tasks are loading or services are loading.
  const isLoading = areTasksLoading || areServicesLoading;
  const isHistoryLoading = areServicesLoading;
  const error = tasksError || servicesError;

  return { vehicle: combinedVehicle, isLoading, isHistoryLoading, error };
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
