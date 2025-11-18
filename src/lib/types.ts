export type ServiceRecord = {
  id: string;
  maintenanceTaskId: string; 
  serviceDate: string; // Changed from 'date' to 'serviceDate'
  mileage: number;
  taskName: string; // Changed from 'task'
  notes: string;
  cost: number;
};

export type MaintenanceTask = {
  id: string;
  name: string;
  intervalMonths: number | null;
  intervalMiles: number | null;
  status: 'ok' | 'due' | 'overdue';
  nextDueDate: string | null;
  nextDueMileage: number | null;
  lastServiceDate: string;
  lastServiceMileage: number;
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
