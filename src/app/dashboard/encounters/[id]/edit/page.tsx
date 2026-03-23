'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useEhrList, useEhrShow, useEhrUpdate } from '@/hooks/use-ehr-data';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Save,
  User,
  Stethoscope,
  FileText,
  Clock,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Patient } from '@/types';
import { PatientCombobox } from '@/components/encounter/patient-combobox';
import { PatientSummary } from '@/components/clinical/patient-summary';

// ── Schema — allows null from backend reset() ──────────────────────────────
const encounterSchema = z
  .object({
    // Required
    patient_id: z.string().min(1, 'Patient is required'),
    encounter_type: z.enum([
      'office_visit',
      'telemedicine',
      'follow_up',
      'urgent_care',
      'annual_physical',
      'consultation'
    ]),
    scheduled_at: z.string().min(1, 'Scheduled date & time is required'),
    chief_complaint: z.string().min(1, 'Chief complaint is required'),
    // Visit info — optional
    status: z
      .enum([
        'scheduled',
        'checked_in',
        'in_progress',
        'completed',
        'cancelled',
        'no_show'
      ])
      .default('scheduled'),
    priority_display: z.string().nullish(),
    service_type_display: z.string().nullish(),
    reason_display: z.string().nullish(),
    // Timing — optional
    started_at: z.string().nullish(),
    ended_at: z.string().nullish(),
    period_start: z.string().nullish(),
    period_end: z.string().nullish(),
    length_value: z.coerce.number().nullish(),
    length_unit: z.string().nullish(),
    // FHIR / Classification — optional
    fhir_class_code: z.string().nullish(),
    fhir_class_display: z.string().nullish(),
    encounter_type_code: z.string().nullish(),
    encounter_type_display: z.string().nullish(),
    location_id: z.string().nullish(),
    location_status: z.string().nullish(),
    // SOAP Notes — optional
    subjective_notes: z.string().nullish(),
    objective_notes: z.string().nullish(),
    assessment_notes: z.string().nullish(),
    plan_notes: z.string().nullish(),
    // Diagnosis & Notes — optional
    _diagnosis_codes_str: z.string().nullish(),
    summary: z.string().nullish(),
    notes: z.string().nullish()
  })
  .passthrough();

type EncounterFormValues = z.infer<typeof encounterSchema>;

/** Convert an ISO / backend datetime string to `datetime-local` input value */
function toDatetimeLocal(val: unknown): string {
  if (!val || typeof val !== 'string') return '';
  const clean = val.replace(/Z$/i, '').replace(/\.\d+$/, '');
  return clean.slice(0, 16);
}

export default function EditEncounterPage() {
  const params = useParams();
  const router = useRouter();

  const { result: patientsResult } = useEhrList<Patient>({
    resource: 'patients',
    pagination: { currentPage: 1, pageSize: 200 }
  });
  const patients = (patientsResult?.data || []) as Patient[];

  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const hasInitializedRef = useRef(false);

  // Fetch full patient data for sidebar when a patient is selected
  const { query: selectedPatientQuery } = useEhrShow<Patient>({
    resource: 'patients',
    id: selectedPatientId || '',
    queryOptions: { enabled: !!selectedPatientId }
  });
  const selectedPatient = selectedPatientQuery.data?.data as
    | Patient
    | undefined;

  // Fetch existing encounter
  const { query: editQuery } = useEhrShow<Record<string, unknown>>({
    resource: 'encounters',
    id: params.id as string
  });
  const record = editQuery.data?.data;
  const [formLoading, setFormLoading] = useState(false);
  const { mutate: updateEncounter } = useEhrUpdate();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors }
  } = useForm<EncounterFormValues>({
    resolver: zodResolver(encounterSchema) as any
  });

  // Pre-fill form when record loads
  useEffect(() => {
    if (!record || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Reset form with record data
    const formData: Record<string, unknown> = {};
    for (const key of Object.keys(encounterSchema.shape)) {
      if (key in record && record[key] !== null && record[key] !== undefined) {
        formData[key] = record[key];
      }
    }
    reset(formData as any);

    // Patient sidebar + form field sync
    if (record.patient_id) {
      const pid = String(record.patient_id);
      setSelectedPatientId(pid);
      setValue('patient_id', pid);
    }

    // Date fields → datetime-local format
    const dateFields = [
      'scheduled_at',
      'started_at',
      'ended_at',
      'period_start',
      'period_end'
    ] as const;
    for (const f of dateFields) {
      const v = toDatetimeLocal(record[f]);
      if (v) setValue(f, v);
    }

    // Diagnosis codes array → comma-separated string
    if (record.diagnosis_codes && Array.isArray(record.diagnosis_codes)) {
      setValue(
        '_diagnosis_codes_str',
        (record.diagnosis_codes as string[]).join(', ')
      );
    }
  }, [record]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (data: any) => {
    const patient = patients.find((p) => p.id === data.patient_id);
    const diagCodes = data._diagnosis_codes_str
      ? data._diagnosis_codes_str
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined;
    const { _diagnosis_codes_str, ...rest } = data;

    // Strip empty-string optional fields
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rest)) {
      if (val !== '' && val !== undefined && val !== null) {
        cleaned[key] = val;
      }
    }

    const payload = {
      ...cleaned,
      patient_name: patient
        ? `${patient.first_name} ${patient.last_name}`
        : record?.patient_name || '',
      provider_id: 'doc-001',
      provider_name: 'Dr. Sarah Chen',
      ...(diagCodes && diagCodes.length > 0
        ? { diagnosis_codes: diagCodes }
        : {})
    };

    setFormLoading(true);
    updateEncounter(
      { resource: 'encounters', id: params.id as string, values: payload },
      {
        onSuccess: () => {
          toast.success('Encounter updated successfully');
          router.push(`/dashboard/encounters/${params.id}`);
        },
        onError: (error: unknown) => {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Failed to update encounter: ${msg}`);
          setFormLoading(false);
        }
      }
    );
  };

  // Loading skeleton while record loads
  if (editQuery.isLoading && !record) {
    return (
      <div className='max-w-4xl space-y-4'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-64 w-full' />
        <Skeleton className='h-48 w-full' />
      </div>
    );
  }

  return (
    <div className='flex h-[calc(100vh-8rem)] gap-6'>
      {/* Left: Patient Summary Sidebar */}
      <aside className='bg-card hidden w-72 shrink-0 overflow-hidden rounded-lg border lg:block'>
        {selectedPatient ? (
          <PatientSummary patient={selectedPatient} />
        ) : (
          <div className='text-muted-foreground flex h-full flex-col items-center justify-center p-6 text-center'>
            <User className='mb-3 h-10 w-10 opacity-30' />
            <p className='text-sm font-medium'>No Patient Selected</p>
            <p className='mt-1 text-xs'>
              Select a patient to see their clinical summary
            </p>
          </div>
        )}
      </aside>

      {/* Right: Form Content */}
      <div className='scrollbar-hide min-w-0 flex-1 overflow-auto'>
        <div className='space-y-4'>
          {/* Header */}
          <div className='flex items-center gap-4'>
            <Button asChild variant='ghost' size='icon'>
              <Link href={`/dashboard/encounters/${params.id}`}>
                <ArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                Edit Encounter
              </h1>
              <p className='text-muted-foreground'>
                Update encounter details
                {record?.encounter_number
                  ? ` — ${record.encounter_number}`
                  : ''}
              </p>
            </div>
          </div>

          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className='space-y-4'
          >
            {/* ── Visit Information ── */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='h-4 w-4' /> Visit Information
                </CardTitle>
                <CardDescription>
                  Link a patient and describe the visit
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='patient_id'>Patient *</Label>
                    <input type='hidden' {...register('patient_id')} />
                    <PatientCombobox
                      patients={patients}
                      value={selectedPatientId}
                      onSelect={(id) => {
                        setSelectedPatientId(id);
                        setValue('patient_id', id);
                      }}
                    />
                    {errors.patient_id && (
                      <p className='text-destructive text-sm'>
                        {String(errors.patient_id.message)}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='scheduled_at'>
                      Scheduled Date & Time *
                    </Label>
                    <Input
                      id='scheduled_at'
                      type='datetime-local'
                      {...register('scheduled_at')}
                    />
                    {errors.scheduled_at && (
                      <p className='text-destructive text-sm'>
                        {String(errors.scheduled_at.message)}
                      </p>
                    )}
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='encounter_type'>Type *</Label>
                    <Controller
                      name='encounter_type'
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || 'office_visit'}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id='encounter_type'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='office_visit'>
                              Office Visit
                            </SelectItem>
                            <SelectItem value='telemedicine'>
                              Telemedicine
                            </SelectItem>
                            <SelectItem value='follow_up'>Follow Up</SelectItem>
                            <SelectItem value='urgent_care'>
                              Urgent Care
                            </SelectItem>
                            <SelectItem value='annual_physical'>
                              Annual Physical
                            </SelectItem>
                            <SelectItem value='consultation'>
                              Consultation
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='status'>Status</Label>
                    <Controller
                      name='status'
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || 'scheduled'}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id='status'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='scheduled'>Scheduled</SelectItem>
                            <SelectItem value='checked_in'>
                              Checked In
                            </SelectItem>
                            <SelectItem value='in_progress'>
                              In Progress
                            </SelectItem>
                            <SelectItem value='completed'>Completed</SelectItem>
                            <SelectItem value='cancelled'>Cancelled</SelectItem>
                            <SelectItem value='no_show'>No Show</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='priority_display'>Priority</Label>
                    <Controller
                      name='priority_display'
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id='priority_display'>
                            <SelectValue placeholder='Select priority' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Routine'>Routine</SelectItem>
                            <SelectItem value='Urgent'>Urgent</SelectItem>
                            <SelectItem value='ASAP'>ASAP</SelectItem>
                            <SelectItem value='STAT'>STAT</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='service_type_display'>Service Type</Label>
                    <Input
                      id='service_type_display'
                      placeholder='e.g. General Practice'
                      {...register('service_type_display')}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='chief_complaint'>Chief Complaint *</Label>
                  <Input
                    id='chief_complaint'
                    placeholder='What brings the patient in today?'
                    {...register('chief_complaint')}
                  />
                  {errors.chief_complaint && (
                    <p className='text-destructive text-sm'>
                      {String(errors.chief_complaint.message)}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='reason_display'>Reason for Visit</Label>
                  <Input
                    id='reason_display'
                    placeholder='Reason for encounter...'
                    {...register('reason_display')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Scheduling & Timing ── */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='h-4 w-4' /> Scheduling & Timing
                </CardTitle>
                <CardDescription>
                  Set visit dates, times, and duration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <div className='space-y-2'>
                    <Label htmlFor='started_at'>Started At</Label>
                    <Input
                      id='started_at'
                      type='datetime-local'
                      {...register('started_at')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='ended_at'>Ended At</Label>
                    <Input
                      id='ended_at'
                      type='datetime-local'
                      {...register('ended_at')}
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='length_value'>Duration</Label>
                      <Input
                        id='length_value'
                        type='number'
                        placeholder='30'
                        {...register('length_value')}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='length_unit'>Unit</Label>
                      <Controller
                        name='length_unit'
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value || 'min'}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger id='length_unit'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='min'>Minutes</SelectItem>
                              <SelectItem value='h'>Hours</SelectItem>
                              <SelectItem value='d'>Days</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>
                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='period_start'>Period Start</Label>
                    <Input
                      id='period_start'
                      type='datetime-local'
                      {...register('period_start')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='period_end'>Period End</Label>
                    <Input
                      id='period_end'
                      type='datetime-local'
                      {...register('period_end')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── FHIR / Classification ── */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Stethoscope className='h-4 w-4' /> Classification & FHIR
                </CardTitle>
                <CardDescription>
                  FHIR encounter class, type codes, and location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <div className='space-y-2'>
                    <Label htmlFor='fhir_class_code'>Class Code</Label>
                    <Controller
                      name='fhir_class_code'
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ''}
                          onValueChange={(v) => {
                            field.onChange(v);
                            const displayMap: Record<string, string> = {
                              AMB: 'Ambulatory',
                              IMP: 'Inpatient',
                              EMER: 'Emergency',
                              VR: 'Virtual'
                            };
                            setValue('fhir_class_display', displayMap[v] || v);
                          }}
                        >
                          <SelectTrigger id='fhir_class_code'>
                            <SelectValue placeholder='Select class' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='AMB'>
                              AMB — Ambulatory
                            </SelectItem>
                            <SelectItem value='IMP'>IMP — Inpatient</SelectItem>
                            <SelectItem value='EMER'>
                              EMER — Emergency
                            </SelectItem>
                            <SelectItem value='VR'>VR — Virtual</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='encounter_type_code'>Type Code</Label>
                    <Input
                      id='encounter_type_code'
                      placeholder='e.g. 270427003'
                      {...register('encounter_type_code')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='encounter_type_display'>Type Display</Label>
                    <Input
                      id='encounter_type_display'
                      placeholder='e.g. Patient-initiated encounter'
                      {...register('encounter_type_display')}
                    />
                  </div>
                </div>
                <Separator className='my-4' />
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='location_id'>Location ID</Label>
                    <Input
                      id='location_id'
                      placeholder='e.g. loc-001'
                      {...register('location_id')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='location_status'>Location Status</Label>
                    <Controller
                      name='location_status'
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id='location_status'>
                            <SelectValue placeholder='Select location status' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='planned'>Planned</SelectItem>
                            <SelectItem value='active'>Active</SelectItem>
                            <SelectItem value='completed'>Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── SOAP Notes ── */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ClipboardList className='h-4 w-4' /> SOAP Notes
                </CardTitle>
                <CardDescription>Clinical documentation</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='subjective_notes'>Subjective</Label>
                    <Textarea
                      id='subjective_notes'
                      placeholder="Patient's reported symptoms and history..."
                      rows={3}
                      {...register('subjective_notes')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='objective_notes'>Objective</Label>
                    <Textarea
                      id='objective_notes'
                      placeholder='Examination findings, vital signs...'
                      rows={3}
                      {...register('objective_notes')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='assessment_notes'>Assessment</Label>
                    <Textarea
                      id='assessment_notes'
                      placeholder='Diagnosis and clinical assessment...'
                      rows={3}
                      {...register('assessment_notes')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='plan_notes'>Plan</Label>
                    <Textarea
                      id='plan_notes'
                      placeholder='Treatment plan, follow-up, orders...'
                      rows={3}
                      {...register('plan_notes')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Diagnosis & Notes ── */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-4 w-4' /> Diagnosis & Notes
                </CardTitle>
                <CardDescription>
                  Diagnosis codes, summary, and additional notes
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='_diagnosis_codes_str'>Diagnosis Codes</Label>
                  <Input
                    id='_diagnosis_codes_str'
                    placeholder='Comma-separated ICD codes, e.g. J44.1, R06.00'
                    {...register('_diagnosis_codes_str')}
                  />
                  <p className='text-muted-foreground text-[11px]'>
                    Enter ICD-10 codes separated by commas
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='summary'>Summary</Label>
                  <Textarea
                    id='summary'
                    placeholder='Brief encounter summary...'
                    rows={2}
                    {...register('summary')}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='notes'>Notes</Label>
                  <Textarea
                    id='notes'
                    placeholder='Additional visit notes...'
                    rows={3}
                    {...register('notes')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className='flex justify-end gap-3 pb-8'>
              <Button asChild variant='outline'>
                <Link href={`/dashboard/encounters/${params.id}`}>Cancel</Link>
              </Button>
              <Button type='submit' disabled={formLoading}>
                <Save className='mr-2 h-4 w-4' />
                {formLoading ? 'Saving...' : 'Update Encounter'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
