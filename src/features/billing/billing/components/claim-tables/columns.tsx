'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Claim } from '@/types/ehr';
import { ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';
import { CLAIM_STATUS_OPTIONS } from './options';

const statusVariantMap: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  draft: 'secondary',
  submitted: 'outline',
  accepted: 'default',
  rejected: 'destructive',
  denied: 'destructive',
  paid: 'default',
  partial_paid: 'default',
  appealed: 'outline',
  void: 'secondary'
};

export const columns: ColumnDef<Claim>[] = [
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
      placeholder: 'Search claims...',
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
    accessorKey: 'claim_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Claim #' />
    ),
    cell: ({ row }) => row.original.claim_number
  },
  {
    accessorKey: 'payer_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Insurance' />
    ),
    cell: ({ row }) => row.original.payer_name
  },
  {
    accessorKey: 'total_charges',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total' />
    ),
    cell: ({ row }) => {
      const amount = row.original.total_charges;
      return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      const variant = statusVariantMap[status] ?? 'secondary';
      const opt = CLAIM_STATUS_OPTIONS.find((o) => o.value === status);
      return (
        <Badge variant={variant} className='capitalize'>
          {opt?.label ?? status}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect' as const,
      options: CLAIM_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'service_date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Service Date' />
    ),
    cell: ({ row }) => {
      const d = new Date(row.original.service_date);
      return d.toLocaleDateString();
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
