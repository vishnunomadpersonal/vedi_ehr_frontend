'use client';

import * as React from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
  flexRender,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState
} from '@tanstack/react-table';
import type { PatientFile } from '@/types';
import type { Option } from '@/types/data-table';
import { createFileColumns } from './columns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X
} from 'lucide-react';
import { DataTableFacetedFilter } from '@/components/ui/table/data-table-faceted-filter';
import { DataTableViewOptions } from '@/components/ui/table/data-table-view-options';
import { SCAN_STATUS_OPTIONS, SOURCE_OPTIONS } from './options';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────

interface FileTableProps {
  data: PatientFile[];
  loading?: boolean;
  docTypeOptions: Option[];
  onFileDeleted?: (fileId: string) => void;
  onFileRetried?: (file: PatientFile) => void;
}

export function FileTable({
  data,
  loading,
  docTypeOptions,
  onFileDeleted,
  onFileRetried
}: FileTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // Memoise columns so they don't re-create every render
  const columns = React.useMemo(
    () =>
      createFileColumns(docTypeOptions, {
        onDeleted: onFileDeleted,
        onRetried: onFileRetried
      }),
    [docTypeOptions, onFileDeleted, onFileRetried]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      pagination: { pageSize: 10 }
    }
  });

  if (loading) {
    return (
      <div className='text-muted-foreground animate-pulse py-8 text-center text-sm'>
        Loading files…
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex flex-1 flex-wrap items-center gap-2'>
          <Input
            placeholder='Search files…'
            value={
              (table.getColumn('filename')?.getFilterValue() as string) ?? ''
            }
            onChange={(e) =>
              table.getColumn('filename')?.setFilterValue(e.target.value)
            }
            className='h-8 w-40 lg:w-64'
          />
          {table.getColumn('document_type') && (
            <DataTableFacetedFilter
              column={table.getColumn('document_type')}
              title='Type'
              options={docTypeOptions}
              multiple
            />
          )}
          {table.getColumn('source') && (
            <DataTableFacetedFilter
              column={table.getColumn('source')}
              title='Source'
              options={SOURCE_OPTIONS}
              multiple
            />
          )}
          {table.getColumn('virus_scan_status') && (
            <DataTableFacetedFilter
              column={table.getColumn('virus_scan_status')}
              title='Scan'
              options={SCAN_STATUS_OPTIONS}
              multiple
            />
          )}
          {columnFilters.length > 0 && (
            <Button
              variant='ghost'
              onClick={() => table.resetColumnFilters()}
              className='h-8 px-2 lg:px-3'
            >
              <X className='mr-1 h-4 w-4' />
              Reset
            </Button>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    row.original.is_quarantined && 'bg-destructive/5 opacity-60'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      <div className='flex items-center justify-between px-2'>
        <div className='text-muted-foreground flex-1 text-sm'>
          {table.getFilteredRowModel().rows.length} file(s) total
        </div>
        <div className='flex items-center space-x-6 lg:space-x-8'>
          <div className='flex items-center space-x-2'>
            <p className='text-sm font-medium whitespace-nowrap'>
              Rows per page
            </p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className='h-8 w-17.5'>
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side='top'>
                {[10, 20, 30, 50].map((ps) => (
                  <SelectItem key={ps} value={`${ps}`}>
                    {ps}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex w-25 items-center justify-center text-sm font-medium'>
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              className='hidden h-8 w-8 p-0 lg:flex'
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className='sr-only'>Go to first page</span>
              <ChevronsLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className='sr-only'>Go to previous page</span>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className='sr-only'>Go to next page</span>
              <ChevronRight className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='hidden h-8 w-8 p-0 lg:flex'
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className='sr-only'>Go to last page</span>
              <ChevronsRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
