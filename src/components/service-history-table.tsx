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
  // Sort history by date descending
  const sortedHistory = history.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Task</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedHistory.length === 0 ? (
           <TableRow>
            <TableCell colSpan={3} className="h-24 text-center">
              No service history records found.
            </TableCell>
          </TableRow>
        ) : (
        sortedHistory.map(record => (
          <TableRow key={record.id}>
            <TableCell className="font-medium">
              {format(parseISO(record.serviceDate), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
              <div className="font-medium">{record.taskName}</div>
            </TableCell>
             <TableCell>
                {record.notes}
            </TableCell>
          </TableRow>
        )))}
      </TableBody>
    </Table>
  );
}
