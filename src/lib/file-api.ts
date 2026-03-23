// ============================================================================
// File Management API Client
// Talks to the EHR backend's /api/v1/files/ proxy endpoints
// which forward to the standalone file-management microservice.
// ============================================================================

import type {
  PatientFile,
  UploadInitResult,
  UploadChunkResult,
  VirusScannerHealth
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const FILES_BASE = `${API_URL}/v1/files`;

// ── Helpers ──────────────────────────────────────────────────────────────────

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`File API ${res.status}: ${body}`);
  }
  const json: ApiEnvelope<T> = await res.json();
  if (!json.success) throw new Error(json.message || 'File API error');
  return json.data;
}

// ── Upload Flow ──────────────────────────────────────────────────────────────

/**
 * Phase 1: Initialise a chunked upload session.
 * Returns an upload_id and the max chunk_size in bytes.
 */
export async function uploadInit(): Promise<UploadInitResult> {
  const res = await fetch(`${FILES_BASE}/upload/init`, { method: 'POST' });
  return unwrap<UploadInitResult>(res);
}

/**
 * Phase 2: Upload a single chunk.
 */
export async function uploadChunk(
  uploadId: string,
  chunkIndex: number,
  chunkSize: number,
  chunk: Blob,
  filename: string
): Promise<UploadChunkResult> {
  const form = new FormData();
  form.append('upload_id', uploadId);
  form.append('chunk_index', String(chunkIndex));
  form.append('chunk_size', String(chunkSize));
  form.append('file', chunk, filename);

  const res = await fetch(`${FILES_BASE}/upload/chunk`, {
    method: 'POST',
    body: form
  });
  return unwrap<UploadChunkResult>(res);
}

/**
 * Phase 3: Assemble chunks → virus scan → store in MinIO.
 */
export async function uploadComplete(params: {
  uploadId: string;
  totalChunks: number;
  totalSize: number;
  fileExtension: string;
  contentType: string;
  filename: string;
  encounterId?: string;
  patientId: string;
  detail?: Record<string, unknown>;
}): Promise<PatientFile> {
  const res = await fetch(`${FILES_BASE}/upload/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      upload_id: params.uploadId,
      total_chunks: params.totalChunks,
      total_size: params.totalSize,
      file_extension: params.fileExtension,
      content_type: params.contentType,
      filename: params.filename,
      encounter_id: params.encounterId || null,
      patient_id: params.patientId,
      detail: params.detail
    })
  });
  return unwrap<PatientFile>(res);
}

/**
 * Full upload flow: init → chunk → complete.
 * Reports progress via callback.
 */
export async function uploadFile(
  file: File,
  patientId: string,
  encounterId?: string,
  onProgress?: (pct: number) => void,
  detail?: Record<string, unknown>
): Promise<PatientFile> {
  // Phase 1
  const { upload_id, chunk_size } = await uploadInit();

  // Phase 2: slice & upload chunks
  const totalChunks = Math.ceil(file.size / chunk_size);
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunk_size;
    const end = Math.min(start + chunk_size, file.size);
    const chunk = file.slice(start, end);
    await uploadChunk(upload_id, i, end - start, chunk, file.name);
    onProgress?.(Math.round(((i + 1) / totalChunks) * 90)); // 0-90% for chunking
  }

  // Phase 3
  onProgress?.(95);
  const ext = file.name.split('.').pop() || 'bin';
  const result = await uploadComplete({
    uploadId: upload_id,
    totalChunks: totalChunks,
    totalSize: file.size,
    fileExtension: ext,
    contentType: file.type || 'application/octet-stream',
    filename: file.name,
    encounterId,
    patientId,
    detail
  });
  onProgress?.(100);
  return result;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getFile(fileId: string): Promise<PatientFile> {
  const res = await fetch(`${FILES_BASE}/${fileId}`);
  return unwrap<PatientFile>(res);
}

export async function getUploadStatus(
  fileId: string
): Promise<{ status: string }> {
  const res = await fetch(`${FILES_BASE}/status/${fileId}`);
  return unwrap<{ status: string }>(res);
}

export async function listFilesForEncounter(
  encounterId: string
): Promise<PatientFile[]> {
  const res = await fetch(`${FILES_BASE}/encounter/${encounterId}`);
  return unwrap<PatientFile[]>(res);
}

export async function listFilesForPatient(
  patientId: string
): Promise<PatientFile[]> {
  const res = await fetch(`${FILES_BASE}/patient/${patientId}`);
  return unwrap<PatientFile[]>(res);
}

export async function deleteFile(fileId: string): Promise<void> {
  const res = await fetch(`${FILES_BASE}/${fileId}`, { method: 'DELETE' });
  await unwrap(res);
}

export async function retryUpload(fileId: string): Promise<PatientFile> {
  const res = await fetch(`${FILES_BASE}/retry/${fileId}`, { method: 'POST' });
  return unwrap<PatientFile>(res);
}

export async function scannerHealth(): Promise<VirusScannerHealth> {
  const res = await fetch(`${FILES_BASE}/scanner/health`);
  return unwrap<VirusScannerHealth>(res);
}

// ── Utilities ────────────────────────────────────────────────────────────────

const FILE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'image/svg+xml': '🖼️',
  'video/mp4': '🎬',
  'audio/mpeg': '🎵',
  'audio/wav': '🎵',
  'text/plain': '📝',
  'text/csv': '📊',
  'application/json': '📋',
  'application/xml': '📋',
  'application/zip': '📦'
};

export function fileIcon(contentType: string | null): string {
  if (!contentType) return '📎';
  return FILE_ICONS[contentType] || '📎';
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function scanStatusLabel(status: string | null): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  switch (status) {
    case 'clean':
      return { label: 'Clean', variant: 'default' };
    case 'infected':
      return { label: 'Infected', variant: 'destructive' };
    case 'error':
      return { label: 'Scan Error', variant: 'destructive' };
    case 'pending':
      return { label: 'Scanning…', variant: 'secondary' };
    case 'disabled':
      return { label: 'No Scan', variant: 'outline' };
    default:
      return { label: 'Unknown', variant: 'outline' };
  }
}
