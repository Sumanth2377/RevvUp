export type ServiceRecord = {
  id: string;
  maintenanceTaskId: string; // Added to link back to the task
  date: string;
  mileage: number;
  task: string;
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
