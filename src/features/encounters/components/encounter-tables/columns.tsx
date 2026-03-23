'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Encounter } from '@/types';
import type { Column, ColumnDef } from '@tanstack/react-table';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { CellAction } from './cell-action';
import { STATUS_OPTIONS, TYPE_OPTIONS } from './options';

const statusVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'scheduled':
      return 'secondary';
    case 'checked_in':
      return 'outline';
    case 'in_progress':
      return 'default';
    case 'completed':
      return 'default';
    case 'cancelled':
      return 'destructive';
    case 'no_show':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const columns: ColumnDef<Encounter>[] = [
  {
    id: 'patient',
    accessorKey: 'patient_name',
    header: ({ column }: { column: Column<Encounter, unknown> }) => (
      <DataTableColumnHeader column={column} title='Patient' />
    ),
    cell: ({ row }) => (
      <div>
        <Link
          href={`/dashboard/encounters/${row.original.id}`}
          className='font-medium hover:underline'
        >
          {row.original.patient_name || 'Unknown Patient'}
        </Link>
        {row.original.provider_name && (
          <div className='text-muted-foreground text-xs'>
            {row.original.provider_name}
          </div>
        )}
      </div>
    ),
    meta: {
      label: 'Patient',
      placeholder: 'Search by patient...',
      variant: 'text'
    },
    enableColumnFilter: true
  },
  {
    id: 'encounter_type',
    accessorKey: 'encounter_type',
    header: ({ column }: { column: Column<Encounter, unknown> }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ cell }) => (
      <span className='text-sm capitalize'>
        {(cell.getValue<string>() || '—').replace(/_/g, ' ')}
      </span>
    ),
    filterFn: (row, columnId, filterValue: string[]) => {
      if (!filterValue?.length) return true;
      return filterValue.includes(row.getValue(columnId) as string);
    },
    enableColumnFilter: true,
    meta: {
      label: 'Type',
      variant: 'multiSelect',
      options: TYPE_OPTIONS
    }
  },
  {
    accessorKey: 'chief_complaint',
    header: 'Chief Complaint',
    cell: ({ cell }) => (
      <span className='max-w-[200px] truncate text-sm'>
        {cell.getValue<string>() || '—'}
      </span>
    ),
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: 'includesString'
  },
  {
    accessorKey: 'scheduled_at',
    header: ({ column }: { column: Column<Encounter, unknown> }) => (
      <DataTableColumnHeader column={column} title='Scheduled' />
    ),
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      if (!val) return '—';
      return (
        <span className='flex items-center gap-1 text-sm'>
          <Clock className='text-muted-foreground h-3 w-3' />
          {new Date(val).toLocaleDateString()}{' '}
          {new Date(val).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      );
    },
    enableColumnFilter: false
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<Encounter, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      return (
        <Badge variant={statusVariant(val)} className='capitalize'>
          {val?.replace(/_/g, ' ') || '—'}
        </Badge>
      );
    },
    filterFn: (row, columnId, filterValue: string[]) => {
      if (!filterValue?.length) return true;
      return filterValue.includes(row.getValue(columnId) as string);
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect',
      options: STATUS_OPTIONS
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
    enableSorting: false,
    enableColumnFilter: false
  }
];
