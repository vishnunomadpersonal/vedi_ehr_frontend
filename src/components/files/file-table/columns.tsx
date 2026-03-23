'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { documentTypeLabel } from '@/lib/document-types';
import { formatFileSize, scanStatusLabel } from '@/lib/file-api';
import type { PatientFile } from '@/types';
import type { Column, ColumnDef } from '@tanstack/react-table';
import {
  FileText,
  Image,
  Film,
  Music,
  FileArchive,
  File as FileIcon,
  FileSpreadsheet,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  CalendarDays,
  FolderOpen
} from 'lucide-react';
import { CellAction } from './cell-action';
import { SCAN_STATUS_OPTIONS, SOURCE_OPTIONS } from './options';
import type { Option } from '@/types/data-table';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

function contentTypeIcon(ct: string | null) {
  if (!ct) return <FileIcon className='text-muted-foreground h-4 w-4' />;
  if (ct.startsWith('image/'))
    return <Image className='h-4 w-4 text-blue-500' />;
  if (ct.startsWith('video/'))
    return <Film className='h-4 w-4 text-purple-500' />;
  if (ct.startsWith('audio/'))
    return <Music className='h-4 w-4 text-pink-500' />;
  if (ct === 'application/pdf')
    return <FileText className='h-4 w-4 text-red-500' />;
  if (ct.includes('spreadsheet') || ct.includes('excel') || ct === 'text/csv')
    return <FileSpreadsheet className='h-4 w-4 text-green-600' />;
  if (ct.includes('word') || ct.includes('document'))
    return <FileText className='h-4 w-4 text-blue-600' />;
  if (ct.includes('zip') || ct.includes('tar') || ct.includes('rar'))
    return <FileArchive className='h-4 w-4 text-yellow-600' />;
  return <FileIcon className='text-muted-foreground h-4 w-4' />;
}

/** Derive upload source from file metadata */
function deriveSource(file: PatientFile): 'appointment' | 'patient_files' {
  if (file.upload_source === 'appointment') return 'appointment';
  if (file.upload_source === 'patient_files') return 'patient_files';
  // Fallback for older files without upload_source
  const src = file.detail?.upload_source as string | undefined;
  if (src === 'appointment') return 'appointment';
  return 'patient_files';
}

function sourceLabel(source: 'appointment' | 'patient_files'): string {
  return source === 'appointment' ? 'Appointment' : 'Patient Files';
}

function ScanBadge({ status }: { status: string | null }) {
  const { label, variant } = scanStatusLabel(status);
  const Icon =
    status === 'clean'
      ? ShieldCheck
      : status === 'infected'
        ? ShieldAlert
        : ShieldQuestion;
  return (
    <Badge variant={variant} className='gap-1 text-[10px]'>
      <Icon className='h-3 w-3' />
      {label}
    </Badge>
  );
}

// ── Column factory ───────────────────────────────────────────────────────────
// Accepts dynamic document-type options so the faceted filter
// shows labels fetched from the backend.

export function createFileColumns(
  docTypeOptions: Option[],
  callbacks: {
    onDeleted?: (fileId: string) => void;
    onRetried?: (file: PatientFile) => void;
  }
): ColumnDef<PatientFile>[] {
  return [
    // ── File name ──────────────────────────────────────────────────────────
    {
      id: 'filename',
      accessorKey: 'filename',
      header: ({ column }: { column: Column<PatientFile, unknown> }) => (
        <DataTableColumnHeader column={column} title='File' />
      ),
      cell: ({ row }) => {
        const file = row.original;
        return (
          <div className='flex min-w-0 items-center gap-2'>
            {contentTypeIcon(file.content_type)}
            <div className='min-w-0'>
              <p className='max-w-65 truncate text-sm font-medium'>
                {file.filename}
              </p>
              <p className='text-muted-foreground truncate text-xs'>
                {file.content_type || 'Unknown type'}
              </p>
            </div>
          </div>
        );
      },
      meta: {
        label: 'File',
        placeholder: 'Search files…',
        variant: 'text' as const
      },
      enableColumnFilter: true
    },

    // ── Document Type ──────────────────────────────────────────────────────
    {
      id: 'document_type',
      accessorFn: (row) => (row.detail?.document_type as string) ?? '',
      header: ({ column }: { column: Column<PatientFile, unknown> }) => (
        <DataTableColumnHeader column={column} title='Type' />
      ),
      cell: ({ row }) => {
        const file = row.original;
        // Prefer the enriched label from the backend, then local lookup
        const label =
          file.document_type_label ||
          documentTypeLabel(file.detail?.document_type as string | undefined);
        return label ? (
          <Badge
            variant='outline'
            className='text-[10px] font-normal whitespace-nowrap'
          >
            {label}
          </Badge>
        ) : (
          <span className='text-muted-foreground text-xs'>—</span>
        );
      },
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue?.length) return true;
        const val = row.getValue(columnId) as string;
        return filterValue.includes(val);
      },
      enableColumnFilter: true,
      meta: {
        label: 'Type',
        variant: 'multiSelect' as const,
        options: docTypeOptions
      }
    },

    // ── Upload Source ──────────────────────────────────────────────────────
    {
      id: 'source',
      accessorFn: (row) => deriveSource(row),
      header: ({ column }: { column: Column<PatientFile, unknown> }) => (
        <DataTableColumnHeader column={column} title='Source' />
      ),
      cell: ({ row }) => {
        const file = row.original;
        const src = deriveSource(file);
        const Icon = src === 'appointment' ? CalendarDays : FolderOpen;
        return (
          <div className='flex items-center gap-1.5'>
            <Icon className='text-muted-foreground h-3.5 w-3.5' />
            <span className='text-xs'>{sourceLabel(src)}</span>
          </div>
        );
      },
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue?.length) return true;
        return filterValue.includes(row.getValue(columnId) as string);
      },
      enableColumnFilter: true,
      meta: {
        label: 'Source',
        variant: 'multiSelect' as const,
        options: SOURCE_OPTIONS
      }
    },

    // ── Encounter ──────────────────────────────────────────────────────────
    {
      id: 'encounter_id',
      accessorKey: 'encounter_id',
      header: ({ column }: { column: Column<PatientFile, unknown> }) => (
        <DataTableColumnHeader column={column} title='Encounter' />
      ),
      cell: ({ row }) => {
        const encId = row.original.encounter_id;
        if (!encId)
          return <span className='text-muted-foreground text-xs'>—</span>;
        return <span className='font-mono text-xs'>#{encId}</span>;
      },
      enableColumnFilter: false
    },

    // ── Size ───────────────────────────────────────────────────────────────
    {
      id: 'size',
      accessorKey: 'size',
      header: ({ column }: { column: Column<PatientFile, unknown> }) => (
        <DataTableColumnHeader column={column} title='Size' />
      ),
      cell: ({ row }) => (
        <span className='text-sm'>{formatFileSize(row.original.size)}</span>
      ),
      enableColumnFilter: false
    },

    // ── Scan Status ────────────────────────────────────────────────────────
    {
      id: 'virus_scan_status',
      accessorKey: 'virus_scan_status',
      header: ({ column }: { column: Column<PatientFile, unknown> }) => (
        <DataTableColumnHeader column={column} title='Scan' />
      ),
      cell: ({ row }) => {
        const file = row.original;
        return (
          <div>
            <ScanBadge status={file.virus_scan_status} />
            {file.quarantine_reason && (
              <p className='text-destructive mt-0.5 text-[10px]'>
                {file.quarantine_reason}
              </p>
            )}
          </div>
        );
      },
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue?.length) return true;
        return filterValue.includes(row.getValue(columnId) as string);
      },
      enableColumnFilter: true,
      meta: {
        label: 'Scan',
        variant: 'multiSelect' as const,
        options: SCAN_STATUS_OPTIONS
      }
    },

    // ── Uploaded date ──────────────────────────────────────────────────────
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: ({ column }: { column: Column<PatientFile, unknown> }) => (
        <DataTableColumnHeader column={column} title='Uploaded' />
      ),
      cell: ({ row }) => {
        const val = row.original.created_at;
        return (
          <span className='text-muted-foreground text-sm whitespace-nowrap'>
            {val ? new Date(val).toLocaleDateString() : '—'}
          </span>
        );
      },
      enableColumnFilter: false
    },

    // ── Actions ────────────────────────────────────────────────────────────
    {
      id: 'actions',
      cell: ({ row }) => (
        <CellAction
          file={row.original}
          onDeleted={callbacks.onDeleted}
          onRetried={callbacks.onRetried}
        />
      ),
      enableSorting: false,
      enableColumnFilter: false
    }
  ];
}
