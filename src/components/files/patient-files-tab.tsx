'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderOpen, Upload, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { FileUploader } from '@/components/files/file-uploader';
import { FileTable } from '@/components/files/file-table';
import { Label } from '@/components/ui/label';
import { listFilesForPatient, scannerHealth } from '@/lib/file-api';
import {
  fetchDocumentCategories,
  DOCUMENT_TYPES_FALLBACK
} from '@/lib/document-types';
import type { PatientFile, VirusScannerHealth } from '@/types';
import type { Option } from '@/types/data-table';

interface PatientFilesTabProps {
  patientId: string;
  encounters: {
    id: string | number;
    encounter_type: string;
    scheduled_at?: string;
    status: string;
  }[];
}

export function PatientFilesTab({
  patientId,
  encounters
}: PatientFilesTabProps) {
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanner, setScanner] = useState<VirusScannerHealth | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState<string>('');
  const [documentType, setDocumentType] = useState('');
  const [docCategories, setDocCategories] = useState<Option[]>([
    ...DOCUMENT_TYPES_FALLBACK
  ]);

  // Active / recent encounters for the dropdown
  const validEncounters = encounters.filter(
    (e) => e.status !== 'cancelled' && e.status !== 'no_show'
  );

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFilesForPatient(patientId);
      setFiles(data);
    } catch {
      // File service might be down — show empty
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const fetchScannerHealth = useCallback(async () => {
    try {
      const health = await scannerHealth();
      setScanner(health);
    } catch {
      // Ignore — scanner info is optional
    }
  }, []);

  useEffect(() => {
    fetchFiles();
    fetchScannerHealth();
  }, [fetchFiles, fetchScannerHealth]);

  // Default to "no encounter" for patient files upload
  useEffect(() => {
    if (!selectedEncounter) {
      setSelectedEncounter('__none__');
    }
  }, [selectedEncounter]);

  // Fetch document categories from backend
  useEffect(() => {
    fetchDocumentCategories().then((cats) => {
      setDocCategories(cats);
      if (!documentType && cats.length > 0) setDocumentType(cats[0].value);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUploadComplete = useCallback((file: PatientFile) => {
    setFiles((prev) => [file, ...prev]);
  }, []);

  const handleFileDeleted = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const handleFileRetried = useCallback((updated: PatientFile) => {
    setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  }, []);

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
        <div className='flex items-center gap-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <FolderOpen className='h-4 w-4' />
            Patient Files
          </CardTitle>
          <Badge variant='secondary' className='text-xs'>
            {files.length} file{files.length !== 1 ? 's' : ''}
          </Badge>
          {scanner?.enabled && (
            <Badge variant='outline' className='gap-1 text-[10px]'>
              <ShieldCheck className='h-3 w-3' />
              ClamAV {scanner.status === 'ok' ? 'Active' : scanner.status}
            </Badge>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={fetchFiles}
          >
            <RefreshCw className='h-3.5 w-3.5' />
          </Button>

          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button size='sm'>
                <Upload className='mr-1.5 h-3.5 w-3.5' />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-lg'>
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
              </DialogHeader>
              <div className='space-y-4'>
                {/* Encounter selector (optional) */}
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium'>
                    Link to Encounter{' '}
                    <span className='text-muted-foreground font-normal'>
                      (optional)
                    </span>
                  </label>
                  {validEncounters.length > 0 ? (
                    <Select
                      value={selectedEncounter}
                      onValueChange={setSelectedEncounter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='No encounter (general upload)' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='__none__'>
                          No encounter (general upload)
                        </SelectItem>
                        {validEncounters.map((enc) => (
                          <SelectItem key={enc.id} value={String(enc.id)}>
                            #{enc.id} — {enc.encounter_type.replace(/_/g, ' ')}{' '}
                            {enc.scheduled_at
                              ? `(${new Date(enc.scheduled_at).toLocaleDateString()})`
                              : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className='text-muted-foreground text-sm'>
                      No encounters available — file will be uploaded without
                      encounter link.
                    </p>
                  )}
                </div>

                {/* Document Type */}
                <div className='space-y-1.5'>
                  <Label className='text-sm font-medium'>Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select document type…' />
                    </SelectTrigger>
                    <SelectContent>
                      {docCategories.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>
                          {dt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Uploader — always available (encounter is optional) */}
                <FileUploader
                  patientId={patientId}
                  encounterId={
                    selectedEncounter && selectedEncounter !== '__none__'
                      ? selectedEncounter
                      : undefined
                  }
                  detail={{
                    document_type: documentType,
                    upload_source: 'patient_files',
                    patient_name: '',
                    encounter_type:
                      selectedEncounter && selectedEncounter !== '__none__'
                        ? (validEncounters.find(
                            (e) => String(e.id) === selectedEncounter
                          )?.encounter_type ?? '')
                        : ''
                  }}
                  onUploadComplete={handleUploadComplete}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {files.length === 0 && !loading ? (
          <div className='text-muted-foreground py-8 text-center'>
            <FolderOpen className='mx-auto mb-2 h-8 w-8 opacity-50' />
            <p className='font-medium'>No files uploaded</p>
            <p className='mt-1 text-xs'>
              Patient documents, lab results, and imaging files will appear
              here.
            </p>
            <p className='mt-1 text-xs'>
              Files are uploaded during encounters and scanned for viruses
              automatically.
            </p>
          </div>
        ) : (
          <FileTable
            data={files}
            loading={loading}
            docTypeOptions={docCategories}
            onFileDeleted={handleFileDeleted}
            onFileRetried={handleFileRetried}
          />
        )}
      </CardContent>
    </Card>
  );
}
