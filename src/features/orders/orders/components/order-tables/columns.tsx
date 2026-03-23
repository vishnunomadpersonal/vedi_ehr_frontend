'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Order } from '@/types/ehr';
import { ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';
import {
  ORDER_STATUS_OPTIONS,
  ORDER_TYPE_OPTIONS,
  ORDER_PRIORITY_OPTIONS
} from './options';

export const columns: ColumnDef<Order>[] = [
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
    id: 'order_type',
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => (
      <Badge variant='outline' className='capitalize'>
        {row.original.type}
      </Badge>
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Type',
      variant: 'multiSelect' as const,
      options: ORDER_TYPE_OPTIONS
    }
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Description' />
    ),
    cell: ({ row }) => {
      const desc = row.original.description;
      return (
        <span title={desc}>
          {desc.length > 50 ? `${desc.slice(0, 50)}…` : desc}
        </span>
      );
    }
  },
  {
    id: 'priority',
    accessorKey: 'priority',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Priority' />
    ),
    cell: ({ row }) => {
      const priority = row.original.priority;
      const variant =
        priority === 'stat'
          ? 'destructive'
          : priority === 'urgent'
            ? 'outline'
            : 'secondary';
      return (
        <Badge variant={variant} className='capitalize'>
          {priority}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Priority',
      variant: 'multiSelect' as const,
      options: ORDER_PRIORITY_OPTIONS
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
      const variant =
        status === 'completed'
          ? 'default'
          : status === 'cancelled'
            ? 'destructive'
            : status === 'in_progress'
              ? 'secondary'
              : 'outline';
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
      options: ORDER_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Ordered Date' />
    ),
    cell: ({ row }) => {
      const date = row.original.created_at;
      return date ? new Date(date).toLocaleDateString() : '—';
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
