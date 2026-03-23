'use client';

import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef
} from 'react';
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

// ── Public handle exposed via ref ────────────────────────────────────────────
export interface StagedFileUploaderHandle {
  /** Number of staged files waiting to be uploaded */
  stagedCount: number;
  /** Trigger the actual upload for all staged files. Returns uploaded PatientFiles. */
  uploadAll: (
    patientId: string,
    encounterId: string,
    detail?: Record<string, unknown>
  ) => Promise<PatientFile[]>;
  /** True while uploads are in-flight */
  isUploading: boolean;
}

interface StagedItem {
  id: string;
  file: File;
  progress: number;
  status:
    | 'staged'
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

export const StagedFileUploader = forwardRef<
  StagedFileUploaderHandle,
  { className?: string }
>(function StagedFileUploader({ className }, ref) {
  const [items, setItems] = useState<StagedItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Stage files locally (no upload yet) ────────────────────────────
  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: StagedItem[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      progress: 0,
      status: 'staged' as const
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ── Upload all staged files (called by parent after record created) ─
  const uploadAll = useCallback(
    async (
      patientId: string,
      encounterId: string,
      detail?: Record<string, unknown>
    ): Promise<PatientFile[]> => {
      const staged = items.filter((i) => i.status === 'staged');
      if (staged.length === 0) return [];

      setIsUploading(true);
      const results: PatientFile[] = [];

      for (const item of staged) {
        try {
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: 'uploading' } : i
            )
          );

          const result = await uploadFile(
            item.file,
            patientId,
            encounterId,
            (pct) => {
              const status = pct >= 90 ? 'scanning' : 'uploading';
              setItems((prev) =>
                prev.map((i) =>
                  i.id === item.id
                    ? {
                        ...i,
                        progress: pct,
                        status: status as StagedItem['status']
                      }
                    : i
                )
              );
            },
            detail
          );

          const isInfected = result.virus_scan_status === 'infected';
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    progress: 100,
                    status: isInfected ? 'infected' : 'complete',
                    result
                  }
                : i
            )
          );
          if (!isInfected) results.push(result);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed';
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: 'error', error: message } : i
            )
          );
        }
      }

      setIsUploading(false);
      return results;
    },
    [items]
  );

  // ── Expose imperative API to parent ────────────────────────────────
  useImperativeHandle(
    ref,
    () => ({
      get stagedCount() {
        return items.filter((i) => i.status === 'staged').length;
      },
      uploadAll,
      isUploading
    }),
    [items, uploadAll, isUploading]
  );

  // ── Drop handler ───────────────────────────────────────────────────
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const stagedCount = items.filter((i) => i.status === 'staged').length;

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
          PDF, images, documents, audio/video — max 100 MB per file
        </p>
        <input
          ref={inputRef}
          type='file'
          multiple
          accept={ACCEPTED_TYPES}
          className='hidden'
          onChange={(e) => {
            if (e.target.files?.length) {
              addFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* Staged / uploading items */}
      {items.length > 0 && (
        <div className='space-y-2'>
          {stagedCount > 0 && !isUploading && (
            <p className='text-muted-foreground text-xs'>
              {stagedCount} file{stagedCount !== 1 ? 's' : ''} staged — will
              upload when you save
            </p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 rounded-md border px-3 py-2 text-sm',
                item.status === 'staged' && 'border-blue-500/30 bg-blue-500/5',
                item.status === 'error' &&
                  'border-destructive/50 bg-destructive/5',
                item.status === 'infected' &&
                  'border-orange-500/50 bg-orange-500/5',
                item.status === 'complete' &&
                  'border-green-500/30 bg-green-500/5'
              )}
            >
              {/* Icon */}
              <div className='shrink-0'>
                {item.status === 'staged' && (
                  <FileUp className='h-4 w-4 text-blue-500' />
                )}
                {(item.status === 'uploading' ||
                  item.status === 'scanning') && (
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

              {/* Info */}
              <div className='min-w-0 flex-1'>
                <p className='truncate font-medium'>{item.file.name}</p>
                <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                  <span>{formatFileSize(item.file.size)}</span>
                  {item.status === 'staged' && (
                    <span className='text-blue-500'>• Staged</span>
                  )}
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
                      • Virus detected — quarantined
                    </span>
                  )}
                </div>
                {(item.status === 'uploading' ||
                  item.status === 'scanning') && (
                  <Progress value={item.progress} className='mt-1 h-1' />
                )}
              </div>

              {/* Remove (only for staged / error / complete) */}
              {item.status !== 'uploading' && item.status !== 'scanning' && (
                <Button
                  type='button'
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
