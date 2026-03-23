'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Patient } from '@/types';
import type { Column, ColumnDef } from '@tanstack/react-table';
import { Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { CellAction } from './cell-action';
import { STATUS_OPTIONS, GENDER_OPTIONS } from './options';

const statusVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'active':
      return 'default';
    case 'inactive':
      return 'secondary';
    case 'deceased':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const columns: ColumnDef<Patient>[] = [
  {
    id: 'name',
    accessorFn: (row) =>
      `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim(),
    header: ({ column }: { column: Column<Patient, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <div>
        <Link
          href={`/dashboard/patients/${row.original.id}`}
          className='font-medium hover:underline'
        >
          {row.original.first_name} {row.original.last_name}
        </Link>
        <div className='text-muted-foreground text-xs capitalize'>
          {row.original.gender}
        </div>
      </div>
    ),
    meta: {
      label: 'Name',
      placeholder: 'Search patients...',
      variant: 'text'
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'medical_record_number',
    header: ({ column }: { column: Column<Patient, unknown> }) => (
      <DataTableColumnHeader column={column} title='MRN' />
    ),
    cell: ({ cell }) => (
      <span className='font-mono text-sm'>{cell.getValue<string>()}</span>
    ),
    enableColumnFilter: false
  },
  {
    accessorKey: 'date_of_birth',
    header: ({ column }: { column: Column<Patient, unknown> }) => (
      <DataTableColumnHeader column={column} title='DOB' />
    ),
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      return val ? new Date(val).toLocaleDateString() : '—';
    },
    enableColumnFilter: false
  },
  {
    id: 'contact',
    header: 'Contact',
    cell: ({ row }) => (
      <div className='flex flex-col gap-0.5'>
        {row.original.phone && (
          <span className='text-muted-foreground flex items-center gap-1 text-xs'>
            <Phone className='h-3 w-3' />
            {row.original.phone}
          </span>
        )}
        {row.original.email && (
          <span className='text-muted-foreground flex items-center gap-1 text-xs'>
            <Mail className='h-3 w-3' />
            {row.original.email}
          </span>
        )}
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<Patient, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const val = cell.getValue<string>();
      return (
        <Badge variant={statusVariant(val)} className='capitalize'>
          {val}
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
    id: 'gender',
    accessorKey: 'gender',
    header: ({ column }: { column: Column<Patient, unknown> }) => (
      <DataTableColumnHeader column={column} title='Gender' />
    ),
    cell: ({ cell }) => (
      <span className='capitalize'>{cell.getValue<string>()}</span>
    ),
    filterFn: (row, columnId, filterValue: string[]) => {
      if (!filterValue?.length) return true;
      return filterValue.includes(row.getValue(columnId) as string);
    },
    enableColumnFilter: true,
    meta: {
      label: 'Gender',
      variant: 'multiSelect',
      options: GENDER_OPTIONS
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
    enableSorting: false,
    enableColumnFilter: false
  }
];
