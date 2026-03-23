'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Prescription } from '@/types/ehr';
import { ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';
import { RX_STATUS_OPTIONS } from './options';

export const columns: ColumnDef<Prescription>[] = [
  {
    accessorKey: 'patient_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Patient' />
    ),
    cell: ({ row }) => (
      <div className='font-medium'>{row.original.patient_name}</div>
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
    accessorKey: 'medication_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Medication' />
    ),
    cell: ({ row }) => (
      <div className='font-bold'>{row.original.medication.name}</div>
    )
  },
  {
    id: 'dosage_frequency',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Dosage / Frequency' />
    ),
    cell: ({ row }) => (
      <div>
        <div>
          {row.original.medication.dose} {row.original.medication.dose_unit}
        </div>
        <div className='text-muted-foreground text-xs'>
          {row.original.medication.frequency}
        </div>
      </div>
    )
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const variant =
        status === 'active'
          ? 'default'
          : status === 'expired'
            ? 'destructive'
            : status === 'on_hold'
              ? 'outline'
              : status === 'cancelled'
                ? 'destructive'
                : 'secondary';
      return (
        <Badge variant={variant} className='capitalize'>
          {status.replace('_', ' ')}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect' as const,
      options: RX_STATUS_OPTIONS
    }
  },
  {
    id: 'refills',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Refills' />
    ),
    cell: ({ row }) => (
      <span>
        {row.original.refills_remaining} / {row.original.refills_authorized}
      </span>
    )
  },
  {
    accessorKey: 'start_date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Start Date' />
    ),
    cell: ({ row }) => {
      const date = row.original.start_date;
      return date ? new Date(date).toLocaleDateString() : '—';
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
