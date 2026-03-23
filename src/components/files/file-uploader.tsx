'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Upload,
  X,
  FileUp,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { uploadFile, formatFileSize } from '@/lib/file-api';
import type { PatientFile } from '@/types';

interface FileUploaderProps {
  patientId: string;
  encounterId?: string;
  detail?: Record<string, unknown>;
  onUploadComplete?: (file: PatientFile) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status:
    | 'pending'
    | 'uploading'
    | 'scanning'
    | 'complete'
    | 'error'
    | 'infected';
  result?: PatientFile;
  error?: string;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'audio/mpeg',
  'audio/wav',
  'video/mp4',
  'application/zip'
].join(',');

export function FileUploader({
  patientId,
  encounterId,
  detail,
  onUploadComplete,
  onError,
  className
}: FileUploaderProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const items: UploadItem[] = Array.from(files).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        progress: 0,
        status: 'pending' as const
      }));

      setUploads((prev) => [...prev, ...items]);

      for (const item of items) {
        try {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id ? { ...u, status: 'uploading' } : u
            )
          );

          const result = await uploadFile(
            item.file,
            patientId,
            encounterId,
            (pct) => {
              const status = pct >= 90 ? 'scanning' : 'uploading';
              setUploads((prev) =>
                prev.map((u) =>
                  u.id === item.id ? { ...u, progress: pct, status } : u
                )
              );
            },
            detail
          );

          const isInfected = result.virus_scan_status === 'infected';
          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id
                ? {
                    ...u,
                    progress: 100,
                    status: isInfected ? 'infected' : 'complete',
                    result
                  }
                : u
            )
          );

          if (!isInfected) {
            onUploadComplete?.(result);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed';
          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id ? { ...u, status: 'error', error: message } : u
            )
          );
          onError?.(message);
        }
      }
    },
    [patientId, encounterId, detail, onUploadComplete, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const removeItem = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const activeUploads = uploads.filter(
    (u) =>
      u.status === 'uploading' ||
      u.status === 'scanning' ||
      u.status === 'pending'
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      <div
        className={cn(
          'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className='text-muted-foreground/50 mx-auto mb-2 h-8 w-8' />
        <p className='text-sm font-medium'>
          Drop files here or click to browse
        </p>
        <p className='text-muted-foreground mt-1 text-xs'>
          PDF, images, documents, audio/video — max 100MB per file
        </p>
        <input
          ref={inputRef}
          type='file'
          multiple
          accept={ACCEPTED_TYPES}
          className='hidden'
          onChange={(e) => {
            if (e.target.files?.length) {
              processFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* Upload items */}
      {uploads.length > 0 && (
        <div className='space-y-2'>
          {activeUploads.length > 0 && (
            <p className='text-muted-foreground text-xs'>
              Uploading {activeUploads.length} file
              {activeUploads.length > 1 ? 's' : ''}…
            </p>
          )}
          {uploads.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 rounded-md border px-3 py-2 text-sm',
                item.status === 'error' &&
                  'border-destructive/50 bg-destructive/5',
                item.status === 'infected' &&
                  'border-orange-500/50 bg-orange-500/5',
                item.status === 'complete' &&
                  'border-green-500/30 bg-green-500/5'
              )}
            >
              <div className='shrink-0'>
                {(item.status === 'uploading' || item.status === 'pending') && (
                  <FileUp className='text-primary h-4 w-4 animate-pulse' />
                )}
                {item.status === 'scanning' && (
                  <Loader2 className='text-primary h-4 w-4 animate-spin' />
                )}
                {item.status === 'complete' && (
                  <CheckCircle2 className='h-4 w-4 text-green-600' />
                )}
                {item.status === 'error' && (
                  <AlertTriangle className='text-destructive h-4 w-4' />
                )}
                {item.status === 'infected' && (
                  <AlertTriangle className='h-4 w-4 text-orange-500' />
                )}
              </div>

              <div className='min-w-0 flex-1'>
                <p className='truncate font-medium'>{item.file.name}</p>
                <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                  <span>{formatFileSize(item.file.size)}</span>
                  {item.status === 'scanning' && <span>• Virus scanning…</span>}
                  {item.status === 'complete' && (
                    <span className='text-green-600'>
                      •{' '}
                      {item.result?.virus_scan_status === 'clean'
                        ? 'Clean'
                        : 'Uploaded'}
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className='text-destructive'>• {item.error}</span>
                  )}
                  {item.status === 'infected' && (
                    <span className='text-orange-600'>
                      • Virus detected — file quarantined
                    </span>
                  )}
                </div>
                {(item.status === 'uploading' ||
                  item.status === 'scanning') && (
                  <Progress value={item.progress} className='mt-1 h-1' />
                )}
              </div>

              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6 shrink-0'
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.id);
                }}
              >
                <X className='h-3 w-3' />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
