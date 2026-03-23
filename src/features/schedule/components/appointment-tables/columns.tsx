'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Appointment } from '@/types/ehr';
import { ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';
import {
  APPOINTMENT_STATUS_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS
} from './options';

function statusVariant(
  status: Appointment['status']
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'scheduled':
    case 'confirmed':
      return 'secondary';
    case 'checked_in':
    case 'in_progress':
      return 'outline';
    case 'cancelled':
    case 'no_show':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export const columns: ColumnDef<Appointment>[] = [
  {
    accessorKey: 'patient_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Patient' />
    ),
    cell: ({ row }) => (
      <span className='font-medium'>{row.original.patient_name}</span>
    ),
    meta: {
      label: 'Patient',
      placeholder: 'Search patients...',
      variant: 'text' as const,
      icon: Text
    },
    enableColumnFilter: true,
    filterFn: (row, _id, filterValue) => {
      return row.original.patient_name
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    }
  },
  {
    accessorKey: 'provider_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Provider' />
    ),
    cell: ({ row }) => row.original.provider_name
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => {
      const opt = APPOINTMENT_TYPE_OPTIONS.find(
        (o) => o.value === row.original.type
      );
      return <span>{opt?.label ?? row.original.type}</span>;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Type',
      variant: 'multiSelect' as const,
      options: APPOINTMENT_TYPE_OPTIONS
    }
  },
  {
    accessorKey: 'start_time',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date / Time' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.date);
      return (
        <div>
          <div>{date.toLocaleDateString()}</div>
          <div className='text-muted-foreground text-xs'>
            {row.original.start_time} – {row.original.end_time}
          </div>
        </div>
      );
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={statusVariant(status)} className='capitalize'>
          {status.replace('_', ' ')}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect' as const,
      options: APPOINTMENT_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
    cell: ({ row }) => {
      const reason = row.original.reason ?? '';
      return (
        <span className='line-clamp-1 max-w-[200px]' title={reason}>
          {reason || '—'}
        </span>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
