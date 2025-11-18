import type { ServiceRecord } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, parseISO } from 'date-fns';

export function ServiceHistoryTable({ history }: { history: ServiceRecord[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Task</TableHead>
          <TableHead className="text-right">Mileage</TableHead>
          <TableHead className="text-right">Cost</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.length === 0 ? (
           <TableRow>
            <TableCell colSpan={4} className="h-24 text-center">
              No service history records found.
            </TableCell>
          </TableRow>
        ) : (
        history.map(record => (
          <TableRow key={record.id}>
            <TableCell className="font-medium">
              {format(parseISO(record.date), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
              <div className="font-medium">{record.task}</div>
              <div className="text-sm text-muted-foreground">{record.notes}</div>
            </TableCell>
            <TableCell className="text-right">
              {record.mileage.toLocaleString()} mi
            </TableCell>
            <TableCell className="text-right">
              ${record.cost.toFixed(2)}
            </TableCell>
          </TableRow>
        )))}
      </TableBody>
    </Table>
  );
}
