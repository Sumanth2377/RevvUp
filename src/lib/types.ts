export type ServiceRecord = {
  id: string;
  maintenanceTaskId: string; 
  serviceDate: string;
  taskName: string;
  notes: string;
};

export type MaintenanceTask = {
  id: string;
  vehicleId: string;
  name: string;
  description: string;
  intervalType: 'Time' | 'Distance' | null;
  intervalValue: number | null;
  status: 'ok' | 'due' | 'overdue';
  nextDueDate: string | null;
  nextDueMileage: number | null;
  lastPerformedDate: string | null;
  lastPerformedMileage: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  licensePlate: string;
  imageUrl: string;
  imageHint: string;
  maintenanceTasks: MaintenanceTask[];
  serviceHistory: ServiceRecord[];
};

export type Notification = {
  id: string;
  userId: string;
  maintenanceTaskId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type UserProfile = {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    photoURL?: string;
    createdAt: string;
    updatedAt: string;
}
