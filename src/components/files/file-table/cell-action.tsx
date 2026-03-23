'use client';

import { useState } from 'react';
import {
  Download,
  Trash2,
  ExternalLink,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { deleteFile, retryUpload } from '@/lib/file-api';
import type { PatientFile } from '@/types';

interface CellActionProps {
  file: PatientFile;
  onDeleted?: (fileId: string) => void;
  onRetried?: (file: PatientFile) => void;
}

export function CellAction({ file, onDeleted, onRetried }: CellActionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const canPreview =
    !file.is_quarantined &&
    file.download_url &&
    (file.content_type?.startsWith('image/') ||
      file.content_type === 'application/pdf');

  const canDownload = !file.is_quarantined && !!file.download_url;
  const canRetry = file.virus_scan_status === 'error';

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteFile(file.id);
      onDeleted?.(file.id);
    } catch {
      // user can retry
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    try {
      const updated = await retryUpload(file.id);
      onRetried?.(updated);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {canDownload && (
            <DropdownMenuItem asChild>
              <a
                href={file.download_url!}
                target='_blank'
                rel='noopener noreferrer'
              >
                <Download className='mr-2 h-3.5 w-3.5' />
                Download
              </a>
            </DropdownMenuItem>
          )}
          {canPreview && (
            <DropdownMenuItem asChild>
              <a
                href={file.download_url!}
                target='_blank'
                rel='noopener noreferrer'
              >
                <ExternalLink className='mr-2 h-3.5 w-3.5' />
                Preview
              </a>
            </DropdownMenuItem>
          )}
          {canRetry && (
            <DropdownMenuItem onClick={handleRetry} disabled={loading}>
              <RefreshCw className='mr-2 h-3.5 w-3.5' />
              Retry Upload
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setOpen(true)}
            className='text-destructive focus:text-destructive'
          >
            <Trash2 className='mr-2 h-3.5 w-3.5' />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{file.filename}</strong> from
              storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {loading ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
