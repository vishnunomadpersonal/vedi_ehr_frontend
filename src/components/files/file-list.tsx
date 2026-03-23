'use client';

import { useState } from 'react';
import {
  Download,
  Trash2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  RefreshCw,
  FileText,
  Image,
  Film,
  Music,
  FileArchive,
  File as FileIcon,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  deleteFile,
  retryUpload,
  formatFileSize,
  scanStatusLabel
} from '@/lib/file-api';
import { documentTypeLabel } from '@/lib/document-types';
import type { PatientFile } from '@/types';

interface FileListProps {
  files: PatientFile[];
  onFileDeleted?: (fileId: string) => void;
  onFileRetried?: (file: PatientFile) => void;
  loading?: boolean;
}

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

export function FileList({
  files,
  onFileDeleted,
  onFileRetried,
  loading
}: FileListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      await deleteFile(fileId);
      onFileDeleted?.(fileId);
    } catch {
      // Silently fail — user can retry
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (fileId: string) => {
    setRetryingId(fileId);
    try {
      const updated = await retryUpload(fileId);
      onFileRetried?.(updated);
    } catch {
      // Silently fail
    } finally {
      setRetryingId(null);
    }
  };

  if (loading) {
    return (
      <div className='text-muted-foreground animate-pulse py-8 text-center text-sm'>
        Loading files…
      </div>
    );
  }

  if (!files.length) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[35%]'>File</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Scan</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow
                key={file.id}
                className={cn(
                  file.is_quarantined && 'bg-destructive/5 opacity-60'
                )}
              >
                <TableCell>
                  <div className='flex min-w-0 items-center gap-2'>
                    {contentTypeIcon(file.content_type)}
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>
                        {file.filename}
                      </p>
                      <p className='text-muted-foreground truncate text-xs'>
                        {file.content_type || 'Unknown type'}
                        {file.encounter_id && (
                          <> · Encounter #{file.encounter_id}</>
                        )}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {(() => {
                    const docType = documentTypeLabel(
                      file.detail?.document_type as string | undefined
                    );
                    return docType ? (
                      <Badge
                        variant='outline'
                        className='text-[10px] font-normal whitespace-nowrap'
                      >
                        {docType}
                      </Badge>
                    ) : (
                      <span className='text-muted-foreground text-xs'>—</span>
                    );
                  })()}
                </TableCell>
                <TableCell className='text-sm'>
                  {formatFileSize(file.size)}
                </TableCell>
                <TableCell>
                  <ScanBadge status={file.virus_scan_status} />
                  {file.quarantine_reason && (
                    <p className='text-destructive mt-0.5 text-[10px]'>
                      {file.quarantine_reason}
                    </p>
                  )}
                </TableCell>
                <TableCell className='text-muted-foreground text-sm'>
                  {file.created_at
                    ? new Date(file.created_at).toLocaleDateString()
                    : '—'}
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex items-center justify-end gap-1'>
                    {/* Download */}
                    {file.download_url && !file.is_quarantined && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7'
                            asChild
                          >
                            <a
                              href={file.download_url}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              <Download className='h-3.5 w-3.5' />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download</TooltipContent>
                      </Tooltip>
                    )}

                    {/* Open in new tab (for PDFs/images) */}
                    {file.download_url &&
                      !file.is_quarantined &&
                      (file.content_type?.startsWith('image/') ||
                        file.content_type === 'application/pdf') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-7 w-7'
                              asChild
                            >
                              <a
                                href={file.download_url}
                                target='_blank'
                                rel='noopener noreferrer'
                              >
                                <ExternalLink className='h-3.5 w-3.5' />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Preview</TooltipContent>
                        </Tooltip>
                      )}

                    {/* Retry (for failed uploads) */}
                    {file.virus_scan_status === 'error' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7'
                            onClick={() => handleRetry(file.id)}
                            disabled={retryingId === file.id}
                          >
                            <RefreshCw
                              className={cn(
                                'h-3.5 w-3.5',
                                retryingId === file.id && 'animate-spin'
                              )}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Retry Upload</TooltipContent>
                      </Tooltip>
                    )}

                    {/* Delete */}
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='text-destructive hover:text-destructive h-7 w-7'
                              disabled={deletingId === file.id}
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete file?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete{' '}
                            <strong>{file.filename}</strong> from storage. This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(file.id)}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
