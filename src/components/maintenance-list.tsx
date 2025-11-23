'use client';
import type { MaintenanceTask } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar, Gauge } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const statusConfig = {
  ok: {
    label: 'OK',
    variant: 'default',
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
  },
  due: {
    label: 'Due Soon',
    variant: 'secondary',
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800',
  },
  overdue: {
    label: 'Overdue',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
  },
};

export function MaintenanceList({ tasks }: { tasks: MaintenanceTask[] }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No maintenance tasks found for this vehicle.
      </div>
    )
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    const statusOrder = { overdue: 0, due: 1, ok: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });


  return (
    <div className="space-y-4">
      {sortedTasks.map(task => {
        const config = statusConfig[task.status];
        const hasDetails = task.nextDueDate || task.nextDueMileage;

        return (
          <div
            key={task.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border p-4"
          >
            <div className="flex-grow">
              <p className="font-semibold">{task.name}</p>
              {hasDetails && (
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                  {task.nextDueDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {format(parseISO(task.nextDueDate), 'MMM d, yyyy')}
                    </span>
                  )}
                  {task.nextDueMileage && (
                    <span className="flex items-center gap-1.5">
                      <Gauge className="h-4 w-4" />
                      {task.nextDueMileage.toLocaleString()} mi
                    </span>
                  )}
                </div>
              )}
            </div>
            <Badge variant={config.variant} className={cn('font-semibold shrink-0', config.className)}>
              {config.label}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
