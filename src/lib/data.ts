import type { Vehicle } from './types';
import { subMonths, format, addMonths } from 'date-fns';

const today = new Date();

const mockVehicles: Vehicle[] = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2021,
    mileage: 25680,
    licensePlate: '8XYZ123',
    imageUrl: 'https://picsum.photos/seed/1/600/400',
    imageHint: 'silver sedan',
    maintenanceTasks: [
      {
        id: 't1',
        name: 'Oil Change',
        intervalMonths: 6,
        intervalMiles: 5000,
        status: 'due',
        lastServiceDate: format(subMonths(today, 5), 'yyyy-MM-dd'),
        lastServiceMileage: 20500,
        nextDueDate: format(addMonths(subMonths(today, 5), 6), 'yyyy-MM-dd'),
        nextDueMileage: 25500,
      },
      {
        id: 't2',
        name: 'Tire Rotation',
        intervalMonths: 6,
        intervalMiles: 7500,
        status: 'ok',
        lastServiceDate: format(subMonths(today, 2), 'yyyy-MM-dd'),
        lastServiceMileage: 23000,
        nextDueDate: format(addMonths(subMonths(today, 2), 6), 'yyyy-MM-dd'),
        nextDueMileage: 30500,
      },
      {
        id: 't3',
        name: 'Brake Check',
        intervalMonths: 12,
        intervalMiles: 15000,
        status: 'overdue',
        lastServiceDate: format(subMonths(today, 14), 'yyyy-MM-dd'),
        lastServiceMileage: 10000,
        nextDueDate: format(addMonths(subMonths(today, 14), 12), 'yyyy-MM-dd'),
        nextDueMileage: 25000,
      },
    ],
    serviceHistory: [
      {
        id: 's1',
        date: format(subMonths(today, 5), 'yyyy-MM-dd'),
        mileage: 20500,
        task: 'Oil Change',
        notes: 'Synthetic oil used.',
        cost: 75.0,
      },
      {
        id: 's2',
        date: format(subMonths(today, 14), 'yyyy-MM-dd'),
        mileage: 10000,
        task: 'Brake Check',
        notes: 'Pads at 50%.',
        cost: 50.0,
      },
    ],
  },
  {
    id: '2',
    make: 'Ford',
    model: 'F-150',
    year: 2022,
    mileage: 15200,
    licensePlate: 'TRUCKIN',
    imageUrl: 'https://picsum.photos/seed/3/600/400',
    imageHint: 'red truck',
    maintenanceTasks: [
       {
        id: 't4',
        name: 'Oil Change',
        intervalMonths: 6,
        intervalMiles: 5000,
        status: 'ok',
        lastServiceDate: format(subMonths(today, 3), 'yyyy-MM-dd'),
        lastServiceMileage: 12000,
        nextDueDate: format(addMonths(subMonths(today, 3), 6), 'yyyy-MM-dd'),
        nextDueMileage: 17000,
      },
      {
        id: 't5',
        name: 'Air Filter Replacement',
        intervalMonths: 24,
        intervalMiles: 30000,
        status: 'ok',
        lastServiceDate: format(subMonths(today, 1), 'yyyy-MM-dd'),
        lastServiceMileage: 15000,
        nextDueDate: format(addMonths(subMonths(today, 1), 24), 'yyyy-MM-dd'),
        nextDueMileage: 45000,
      },
    ],
    serviceHistory: [
      {
        id: 's3',
        date: format(subMonths(today, 3), 'yyyy-MM-dd'),
        mileage: 12000,
        task: 'Oil Change',
        notes: 'Regular oil.',
        cost: 60,
      }
    ],
  },
];

export async function getVehicles(): Promise<Vehicle[]> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockVehicles;
}

export async function getVehicleById(id: string): Promise<Vehicle | undefined> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockVehicles.find(v => v.id === id);
}
