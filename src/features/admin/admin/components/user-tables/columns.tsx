'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { User } from '@/types/ehr';
import { ColumnDef } from '@tanstack/react-table';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';
import { USER_ROLE_OPTIONS } from './options';

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => <div className='font-medium'>{row.original.name}</div>,
    meta: {
      label: 'Name',
      placeholder: 'Search users...',
      variant: 'text' as const,
      icon: Text
    },
    enableColumnFilter: true,
    filterFn: (row, _id, filterValue) => {
      return row.original.name
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    }
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <span className='text-muted-foreground'>{row.original.email}</span>
    )
  },
  {
    id: 'role',
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => (
      <Badge variant='outline' className='capitalize'>
        {row.original.role.replace('_', ' ')}
      </Badge>
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Role',
      variant: 'multiSelect' as const,
      options: USER_ROLE_OPTIONS
    }
  },
  {
    accessorKey: 'department',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Department' />
    ),
    cell: ({ row }) => row.original.department || '—'
  },
  {
    id: 'is_active',
    accessorKey: 'is_active',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const active = row.original.is_active;
      return (
        <Badge
          variant={active ? 'default' : 'destructive'}
          className={
            active
              ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
              : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
          }
        >
          {active ? 'Active' : 'Inactive'}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'last_login',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Last Login' />
    ),
    cell: ({ row }) => {
      const lastLogin = row.original.last_login;
      if (!lastLogin)
        return <span className='text-muted-foreground'>Never</span>;
      return (
        <span className='text-muted-foreground text-sm'>
          {new Date(lastLogin).toLocaleDateString()}{' '}
          {new Date(lastLogin).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
