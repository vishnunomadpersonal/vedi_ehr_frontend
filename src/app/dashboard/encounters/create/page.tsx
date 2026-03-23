'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useEhrList, useEhrShow, useEhrCreate } from '@/hooks/use-ehr-data';
import { useRouter } from 'next/navigation';
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
import {
  ArrowLeft,
  Save,
  User,
  Stethoscope,
  FileText,
  Clock,
  ClipboardList,
  FolderOpen,
  Activity,
  Pill,
  FlaskConical,
  Syringe,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Scissors,
  Sparkles,
  Loader2,
  MessageSquareText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Patient } from '@/types';
import { PatientCombobox } from '@/components/encounter/patient-combobox';
import { PatientSummary } from '@/components/clinical/patient-summary';
import { createAppointment } from '@/lib/schedule-service';
import {
  StagedFileUploader,
  type StagedFileUploaderHandle
} from '@/components/files/staged-file-uploader';
import {
  DocumentCategoryPicker,
  type DocumentCategory
} from '@/components/files/document-category-picker';
import { VitalEditFormContent } from '@/components/clinical/vital-edit-form-content';
import { Switch } from '@/components/ui/switch';

// ── Schema — required fields marked, everything else optional ───────────────
const encounterSchema = z.object({
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
  priority_display: z.string().optional(),
  service_type_display: z.string().optional(),
  reason_display: z.string().optional(),
  // Timing — optional
  started_at: z.string().optional(),
  ended_at: z.string().optional(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  length_value: z.coerce.number().optional(),
  length_unit: z.string().optional(),
  // FHIR / Classification — optional
  fhir_class_code: z.string().optional(),
  fhir_class_display: z.string().optional(),
  encounter_type_code: z.string().optional(),
  encounter_type_display: z.string().optional(),
  location_id: z.string().optional(),
  location_status: z.string().optional(),
  // SOAP Notes — optional
  subjective_notes: z.string().optional(),
  objective_notes: z.string().optional(),
  assessment_notes: z.string().optional(),
  plan_notes: z.string().optional(),
  // Diagnosis & Notes — optional
  _diagnosis_codes_str: z.string().optional(),
  summary: z.string().optional(),
  notes: z.string().optional()
});

type EncounterFormValues = z.infer<typeof encounterSchema>;

export default function CreateEncounterPage() {
  const router = useRouter();

  const { result: patientsResult } = useEhrList<Patient>({
    resource: 'patients',
    pagination: { currentPage: 1, pageSize: 100 },
    filters: [{ field: 'status', operator: 'eq', value: 'active' }]
  });

  const patients = patientsResult?.data || [];

  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  // Track the last-submitted payload so onMutationSuccess can read it
  const lastPayloadRef = useRef<Record<string, unknown> | null>(null);
  const uploaderRef = useRef<StagedFileUploaderHandle>(null);

  // ── Document category state ──
  const [docCategoryCode, setDocCategoryCode] = useState<string>('');
  const [docCategoryObj, setDocCategoryObj] = useState<DocumentCategory | null>(
    null
  );

  // ── Quick vitals state ──
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [quickVitals, setQuickVitals] = useState<Record<string, unknown>>({});
  const updateVital = (key: string, val: unknown) =>
    setQuickVitals((prev) => ({ ...prev, [key]: val }));

  // ── Staged Prescription state ──
  const [rxOpen, setRxOpen] = useState(false);
  const [stagedRx, setStagedRx] = useState<Record<string, string>[]>([]);
  const [rxDraft, setRxDraft] = useState<Record<string, string>>({});
  const addPrescription = () => {
    if (!rxDraft.medicationName?.trim()) {
      toast.error('Medication name is required');
      return;
    }
    setStagedRx((prev) => [...prev, { ...rxDraft }]);
    setRxDraft({});
    toast.success('Prescription staged');
  };

  // ── Staged Lab Result state ──
  const [labOpen, setLabOpen] = useState(false);
  const [stagedLabs, setStagedLabs] = useState<Record<string, string>[]>([]);
  const [labDraft, setLabDraft] = useState<Record<string, string>>({});
  const addLabResult = () => {
    if (!labDraft.testType?.trim()) {
      toast.error('Test type is required');
      return;
    }
    setStagedLabs((prev) => [...prev, { ...labDraft }]);
    setLabDraft({});
    toast.success('Lab result staged');
  };

  // ── Transcript paste + AI SOAP generation ──
  const [transcriptText, setTranscriptText] = useState('');
  const [generatingSOAP, setGeneratingSOAP] = useState(false);

  const handleGenerateSOAP = async () => {
    if (!transcriptText.trim()) {
      toast.error('Paste or type a transcript first');
      return;
    }
    setGeneratingSOAP(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${API}/v1/soap/generate-from-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcriptText })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const soap = json.data || json;
      if (soap.chief_complaint) {
        const current = watch('notes') || '';
        setValue(
          'notes',
          current
            ? `${current}\nChief Complaint: ${soap.chief_complaint}`
            : `Chief Complaint: ${soap.chief_complaint}`
        );
      }
      if (soap.subjective) setValue('subjective_notes', soap.subjective);
      if (soap.objective) setValue('objective_notes', soap.objective);
      if (soap.assessment) setValue('assessment_notes', soap.assessment);
      if (soap.plan) setValue('plan_notes', soap.plan);
      // Auto-populate diagnosis codes from AI
      if (
        soap.diagnosis_codes &&
        Array.isArray(soap.diagnosis_codes) &&
        soap.diagnosis_codes.length > 0
      ) {
        const codes = soap.diagnosis_codes
          .map((dx: { code?: string; display?: string }) => dx.code || '')
          .filter(Boolean)
          .join(', ');
        if (codes) setValue('_diagnosis_codes_str', codes);
      }
      // Auto-populate summary with chief complaint + treatment given
      const summaryParts: string[] = [];
      if (soap.chief_complaint) summaryParts.push(soap.chief_complaint);
      if (
        soap.treatment_given &&
        soap.treatment_given !== 'No specific treatment documented.'
      )
        summaryParts.push(`Treatment: ${soap.treatment_given}`);
      if (summaryParts.length > 0)
        setValue('summary', summaryParts.join('\n\n'));
      toast.success('SOAP notes & diagnosis codes generated from transcript');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate SOAP notes — check your API key');
    } finally {
      setGeneratingSOAP(false);
    }
  };

  // ── Staged Surgery state ──
  const [surgOpen, setSurgOpen] = useState(false);
  const [stagedSurgeries, setStagedSurgeries] = useState<
    Record<string, string>[]
  >([]);
  const [surgDraft, setSurgDraft] = useState<Record<string, string>>({});
  const addSurgery = () => {
    if (!surgDraft.surgeryType?.trim()) {
      toast.error('Procedure type is required');
      return;
    }
    setStagedSurgeries((prev) => [...prev, { ...surgDraft }]);
    setSurgDraft({});
    toast.success('Procedure staged');
  };

  // Fetch full patient data for sidebar when a patient is selected
  const { query: selectedPatientQuery } = useEhrShow<Patient>({
    resource: 'patients',
    id: selectedPatientId || '',
    queryOptions: { enabled: !!selectedPatientId }
  });
  const selectedPatient = selectedPatientQuery.data?.data as
    | Patient
    | undefined;

  const { mutate: createEncounter } = useEhrCreate<Record<string, unknown>>();
  const [formLoading, setFormLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EncounterFormValues>({
    resolver: zodResolver(encounterSchema) as any,
    defaultValues: {
      encounter_type: 'office_visit',
      status: 'scheduled',
      length_unit: 'min'
    }
  });

  // Watch status to conditionally adjust timing fields
  const selectedStatus = watch('status');

  const onSubmit = async (data: any) => {
    const patient = patients.find((p) => p.id === data.patient_id);
    // Build diagnosis_codes array from comma-separated string
    const diagCodes = data._diagnosis_codes_str
      ? data._diagnosis_codes_str
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined;
    const { _diagnosis_codes_str, ...rest } = data;

    // Strip empty-string optional fields so the backend receives null/undefined
    // instead of "" (which fails Pydantic datetime parsing)
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rest)) {
      if (val !== '' && val !== undefined && val !== null) {
        cleaned[key] = val;
      }
    }

    // If status is "in_progress" and no started_at, auto-fill with current time
    if (cleaned.status === 'in_progress' && !cleaned.started_at) {
      const now = new Date();
      cleaned.started_at = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    const payload: Record<string, unknown> = {
      ...cleaned,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : '',
      provider_id: 'doc-001',
      provider_name: 'Dr. Sarah Chen',
      ...(diagCodes && diagCodes.length > 0
        ? { diagnosis_codes: diagCodes }
        : {})
    };
    lastPayloadRef.current = payload;

    setFormLoading(true);
    createEncounter(
      { resource: 'encounters', values: payload },
      {
        onSuccess: async (response: any) => {
          const created = response?.data as Record<string, unknown> | undefined;
          const status = (payload?.status as string) || 'scheduled';

          toast.success('Encounter created successfully');

          // ── Upload staged files if any ──
          const encId = String(created?.id || '');
          const patId = String(payload?.patient_id || '');

          // ── Create vitals if any quick-vitals were entered ──
          const hasVitals = Object.values(quickVitals).some(
            (v) => v !== null && v !== undefined && String(v).trim() !== ''
          );
          if (hasVitals && encId && patId) {
            try {
              const vitalsBody: Record<string, unknown> = {
                patient_id: patId,
                encounter_id: Number(encId),
                recorded_at: new Date().toISOString(),
                status: 'final'
              };
              for (const [k, v] of Object.entries(quickVitals)) {
                if (v === null || v === undefined || String(v).trim() === '')
                  continue;
                vitalsBody[k] = typeof v === 'number' ? v : String(v);
              }
              const API = process.env.NEXT_PUBLIC_API_URL || '/api';
              await fetch(`${API}/v1/vitals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vitalsBody)
              });
              toast.success('Vitals recorded');
            } catch {
              toast.error('Encounter saved but vitals failed');
            }
          }

          // ── Create staged prescriptions ──
          if (stagedRx.length > 0 && encId && patId) {
            const API = process.env.NEXT_PUBLIC_API_URL || '/api';
            for (const rx of stagedRx) {
              try {
                const medId = `med-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                await fetch(`${API}/v1/medications`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    medication_id: medId,
                    medication_name: rx.medicationName,
                    dosage: rx.dosage || null,
                    frequency: rx.frequency || null,
                    instructions: rx.instructions || null,
                    status: 'active'
                  })
                });
                const rxId = `rx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                const rxBody: Record<string, unknown> = {
                  prescription_id: rxId,
                  patient_id: Number(patId),
                  doctor_id: 1,
                  encounter_id: Number(encId),
                  date_issued: new Date().toISOString().split('T')[0],
                  status: rx.status || 'active',
                  intent: rx.intent || 'order',
                  priority: rx.priority || 'routine',
                  medication_reference: `Medication/${medId}`,
                  medication_codeable_concept: { text: rx.medicationName }
                };
                if (rx.refills)
                  rxBody.dispense_request_number_of_repeats = parseInt(
                    rx.refills
                  );
                if (rx.quantity) {
                  rxBody.dispense_request_quantity_value = parseFloat(
                    rx.quantity
                  );
                  rxBody.dispense_request_quantity_unit =
                    rx.quantityUnit || 'tablets';
                }
                if (rx.notes) rxBody.fhir_note = rx.notes;
                await fetch(`${API}/v1/prescriptions`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(rxBody)
                });
                try {
                  await fetch(
                    `${API}/v1/prescriptions/${rxId}/medications/${medId}`,
                    { method: 'PUT' }
                  );
                } catch {}
              } catch {
                toast.error('Failed to create a prescription');
              }
            }
            toast.success(`${stagedRx.length} prescription(s) created`);
          }

          // ── Create staged lab results ──
          if (stagedLabs.length > 0 && encId && patId) {
            const API = process.env.NEXT_PUBLIC_API_URL || '/api';
            for (const lab of stagedLabs) {
              try {
                const labId = `lab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                await fetch(`${API}/v1/lab-results`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    lab_examination_id: labId,
                    patient_id: patId,
                    encounter_id: Number(encId),
                    test_type: lab.testType,
                    test_date: lab.testDate || null,
                    test_facility: lab.testFacility || null,
                    result_value: lab.resultValue || null,
                    result_unit: lab.resultUnit || null,
                    reference_range: lab.referenceRange || null,
                    status: lab.status || 'final',
                    critical_flag: lab.criticalFlag === 'true',
                    conclusion: lab.conclusion || null,
                    loinc_code: lab.loincCode || null,
                    performing_lab: lab.performingLab || null
                  })
                });
              } catch {
                toast.error('Failed to create a lab result');
              }
            }
            toast.success(`${stagedLabs.length} lab result(s) created`);
          }

          // ── Create staged surgeries ──
          if (stagedSurgeries.length > 0 && encId && patId) {
            const API = process.env.NEXT_PUBLIC_API_URL || '/api';
            for (const s of stagedSurgeries) {
              try {
                const sId = `surg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                const surgBody: Record<string, unknown> = {
                  surgery_id: sId,
                  patient_id: patId,
                  encounter_id: Number(encId),
                  surgery_type: s.surgeryType,
                  surgery_desc: s.surgeryDesc || null,
                  surgery_date: s.surgeryDate || null,
                  surgery_facility: s.surgeryFacility || null,
                  status: s.status || 'completed',
                  anesthesia_type: s.anesthesiaType || null,
                  cpt_code: s.cptCode || null,
                  fhir_note: s.notes || null,
                  performed_datetime: s.surgeryDate
                    ? new Date(s.surgeryDate).toISOString()
                    : null
                };
                if (s.estimatedBloodLoss)
                  surgBody.estimated_blood_loss_ml = parseInt(
                    s.estimatedBloodLoss
                  );
                await fetch(`${API}/v1/surgery`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(surgBody)
                });
              } catch {
                toast.error('Failed to create a procedure');
              }
            }
            toast.success(`${stagedSurgeries.length} procedure(s) created`);
          }

          if (
            uploaderRef.current &&
            uploaderRef.current.stagedCount > 0 &&
            encId &&
            patId
          ) {
            try {
              const uploadDetail: Record<string, unknown> = {
                upload_source: 'encounter_create'
              };
              if (docCategoryCode) {
                uploadDetail.document_type = docCategoryCode;
              }
              if (docCategoryObj?.id) {
                uploadDetail.category_id = docCategoryObj.id;
              }
              const uploaded = await uploaderRef.current.uploadAll(
                patId,
                encId,
                uploadDetail
              );
              if (uploaded.length > 0) {
                toast.success(
                  `${uploaded.length} file${uploaded.length > 1 ? 's' : ''} uploaded`
                );
              }
            } catch {
              toast.error('Encounter saved but some files failed to upload');
            }
          }

          // ── Auto-create calendar appointment for "scheduled" encounters ──
          if (status === 'scheduled' && created) {
            try {
              const startStr = String(payload?.scheduled_at || '');
              const endDate = new Date(startStr);
              endDate.setMinutes(endDate.getMinutes() + 30);

              await createAppointment({
                id: '',
                title: String(payload?.patient_name || 'Patient'),
                start: startStr,
                end: endDate.toISOString().slice(0, 16),
                extendedProps: {
                  patient_id: String(payload?.patient_id || ''),
                  patient_name: String(payload?.patient_name || ''),
                  provider_id: '1',
                  provider_name: String(
                    payload?.provider_name || 'Dr. Sarah Chen'
                  ),
                  encounter_type: String(
                    payload?.encounter_type || 'office_visit'
                  ),
                  chief_complaint: String(payload?.chief_complaint || ''),
                  notes: String(payload?.notes || ''),
                  status: 'scheduled',
                  encounter_id: String(created.id || '')
                }
              });
              toast.success('Calendar appointment created');
            } catch (err) {
              console.error('Failed to auto-create appointment:', err);
              toast.error('Encounter saved but appointment creation failed');
            }
            router.push('/dashboard/encounters');
            return;
          }

          // ── Auto-start recording session for "in_progress" encounters ──
          if (status === 'in_progress' && created?.id) {
            router.push(`/dashboard/sessions/${created.id}/record`);
            return;
          }

          router.push('/dashboard/encounters');
        },
        onError: (error: unknown) => {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Failed to create encounter: ${msg}`);
          setFormLoading(false);
        }
      }
    );
  };

  return (
    <div className='flex h-[calc(100vh-8rem)] gap-6'>
      {/* Left: Patient Summary Sidebar — always visible */}
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
              <Link href='/dashboard/encounters'>
                <ArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                New Encounter
              </h1>
              <p className='text-muted-foreground'>
                Create a new clinical visit
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
                    <Select
                      defaultValue='office_visit'
                      onValueChange={(v) =>
                        setValue(
                          'encounter_type',
                          v as EncounterFormValues['encounter_type']
                        )
                      }
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
                        <SelectItem value='urgent_care'>Urgent Care</SelectItem>
                        <SelectItem value='annual_physical'>
                          Annual Physical
                        </SelectItem>
                        <SelectItem value='consultation'>
                          Consultation
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='status'>Status</Label>
                    <Select
                      defaultValue='scheduled'
                      onValueChange={(v) =>
                        setValue('status', v as EncounterFormValues['status'])
                      }
                    >
                      <SelectTrigger id='status'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='scheduled'>Scheduled</SelectItem>
                        <SelectItem value='checked_in'>Checked In</SelectItem>
                        <SelectItem value='in_progress'>In Progress</SelectItem>
                        <SelectItem value='completed'>Completed</SelectItem>
                        <SelectItem value='cancelled'>Cancelled</SelectItem>
                        <SelectItem value='no_show'>No Show</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedStatus === 'scheduled' && (
                      <p className='text-[11px] text-blue-500'>
                        A calendar appointment will be created
                      </p>
                    )}
                    {selectedStatus === 'in_progress' && (
                      <p className='text-[11px] text-emerald-500'>
                        Recording session will start after save
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='priority_display'>Priority</Label>
                    <Select
                      onValueChange={(v) => setValue('priority_display', v)}
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
                      <Select
                        defaultValue='min'
                        onValueChange={(v) => setValue('length_unit', v)}
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
                    <Select
                      onValueChange={(v) => {
                        setValue('fhir_class_code', v);
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
                        <SelectItem value='AMB'>AMB — Ambulatory</SelectItem>
                        <SelectItem value='IMP'>IMP — Inpatient</SelectItem>
                        <SelectItem value='EMER'>EMER — Emergency</SelectItem>
                        <SelectItem value='VR'>VR — Virtual</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select
                      onValueChange={(v) => setValue('location_status', v)}
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Vitals (collapsible — full form) ── */}
            <Card>
              <CardHeader
                className='cursor-pointer'
                onClick={() => setVitalsOpen((o) => !o)}
              >
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='h-4 w-4' /> Vitals
                  <span className='ml-auto'>
                    {vitalsOpen ? (
                      <ChevronDown className='h-4 w-4' />
                    ) : (
                      <ChevronRight className='h-4 w-4' />
                    )}
                  </span>
                </CardTitle>
                <CardDescription>
                  Record vital signs during this encounter (optional)
                </CardDescription>
              </CardHeader>
              {vitalsOpen && (
                <CardContent>
                  <VitalEditFormContent
                    draft={quickVitals}
                    onUpdate={(k, v) => updateVital(k, v)}
                  />
                </CardContent>
              )}
            </Card>

            {/* ── Prescriptions (collapsible — staged) ── */}
            <Card>
              <CardHeader
                className='cursor-pointer'
                onClick={() => setRxOpen((o) => !o)}
              >
                <CardTitle className='flex items-center gap-2'>
                  <Pill className='h-4 w-4' /> Prescriptions
                  {stagedRx.length > 0 && (
                    <Badge variant='secondary'>{stagedRx.length}</Badge>
                  )}
                  <span className='ml-auto'>
                    {rxOpen ? (
                      <ChevronDown className='h-4 w-4' />
                    ) : (
                      <ChevronRight className='h-4 w-4' />
                    )}
                  </span>
                </CardTitle>
                <CardDescription>
                  Stage prescriptions to be created with this encounter
                  (optional)
                </CardDescription>
              </CardHeader>
              {rxOpen && (
                <CardContent className='space-y-4'>
                  {/* Staged Rx list */}
                  {stagedRx.length > 0 && (
                    <div className='space-y-2'>
                      {stagedRx.map((rx, i) => (
                        <div
                          key={i}
                          className='bg-muted/30 flex items-center justify-between rounded-md border p-3'
                        >
                          <div>
                            <p className='text-sm font-medium'>
                              {rx.medicationName}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {[rx.dosage, rx.frequency, rx.status]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </div>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={() =>
                              setStagedRx((prev) =>
                                prev.filter((_, idx) => idx !== i)
                              )
                            }
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                      <Separator />
                    </div>
                  )}

                  {/* Rx Draft form */}
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    <div className='space-y-2'>
                      <Label>Medication Name *</Label>
                      <Input
                        placeholder='e.g. Amoxicillin'
                        value={rxDraft.medicationName || ''}
                        onChange={(e) =>
                          setRxDraft((d) => ({
                            ...d,
                            medicationName: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Dosage</Label>
                      <Input
                        placeholder='e.g. 500mg'
                        value={rxDraft.dosage || ''}
                        onChange={(e) =>
                          setRxDraft((d) => ({ ...d, dosage: e.target.value }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Frequency</Label>
                      <Input
                        placeholder='e.g. 3x daily'
                        value={rxDraft.frequency || ''}
                        onChange={(e) =>
                          setRxDraft((d) => ({
                            ...d,
                            frequency: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Instructions</Label>
                      <Input
                        placeholder='e.g. Take with food'
                        value={rxDraft.instructions || ''}
                        onChange={(e) =>
                          setRxDraft((d) => ({
                            ...d,
                            instructions: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Status</Label>
                      <Select
                        value={rxDraft.status || ''}
                        onValueChange={(v) =>
                          setRxDraft((d) => ({ ...d, status: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select status' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='active'>Active</SelectItem>
                          <SelectItem value='on-hold'>On Hold</SelectItem>
                          <SelectItem value='completed'>Completed</SelectItem>
                          <SelectItem value='stopped'>Stopped</SelectItem>
                          <SelectItem value='cancelled'>Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label>Priority</Label>
                      <Select
                        value={rxDraft.priority || ''}
                        onValueChange={(v) =>
                          setRxDraft((d) => ({ ...d, priority: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select priority' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='routine'>Routine</SelectItem>
                          <SelectItem value='urgent'>Urgent</SelectItem>
                          <SelectItem value='asap'>ASAP</SelectItem>
                          <SelectItem value='stat'>Stat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label>Intent</Label>
                      <Select
                        value={rxDraft.intent || ''}
                        onValueChange={(v) =>
                          setRxDraft((d) => ({ ...d, intent: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select intent' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='order'>Order</SelectItem>
                          <SelectItem value='proposal'>Proposal</SelectItem>
                          <SelectItem value='plan'>Plan</SelectItem>
                          <SelectItem value='original-order'>
                            Original Order
                          </SelectItem>
                          <SelectItem value='reflex-order'>
                            Reflex Order
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label>Refills</Label>
                      <Input
                        type='number'
                        placeholder='0'
                        value={rxDraft.refills || ''}
                        onChange={(e) =>
                          setRxDraft((d) => ({ ...d, refills: e.target.value }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Quantity</Label>
                      <Input
                        type='number'
                        placeholder='30'
                        value={rxDraft.quantity || ''}
                        onChange={(e) =>
                          setRxDraft((d) => ({
                            ...d,
                            quantity: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Quantity Unit</Label>
                      <Input
                        placeholder='e.g. tablets'
                        value={rxDraft.quantityUnit || ''}
                        onChange={(e) =>
                          setRxDraft((d) => ({
                            ...d,
                            quantityUnit: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2 md:col-span-2 lg:col-span-3'>
                      <Label>Notes</Label>
                      <Textarea
                        placeholder='Additional notes...'
                        rows={2}
                        value={rxDraft.notes || ''}
                        onChange={(e) =>
                          setRxDraft((d) => ({ ...d, notes: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className='flex justify-end'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={addPrescription}
                    >
                      <Plus className='mr-2 h-4 w-4' /> Stage Prescription
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* ── Lab Results (collapsible — staged) ── */}
            <Card>
              <CardHeader
                className='cursor-pointer'
                onClick={() => setLabOpen((o) => !o)}
              >
                <CardTitle className='flex items-center gap-2'>
                  <FlaskConical className='h-4 w-4' /> Lab Results
                  {stagedLabs.length > 0 && (
                    <Badge variant='secondary'>{stagedLabs.length}</Badge>
                  )}
                  <span className='ml-auto'>
                    {labOpen ? (
                      <ChevronDown className='h-4 w-4' />
                    ) : (
                      <ChevronRight className='h-4 w-4' />
                    )}
                  </span>
                </CardTitle>
                <CardDescription>
                  Stage lab results to be created with this encounter (optional)
                </CardDescription>
              </CardHeader>
              {labOpen && (
                <CardContent className='space-y-4'>
                  {/* Staged labs list */}
                  {stagedLabs.length > 0 && (
                    <div className='space-y-2'>
                      {stagedLabs.map((lab, i) => (
                        <div
                          key={i}
                          className='bg-muted/30 flex items-center justify-between rounded-md border p-3'
                        >
                          <div>
                            <p className='text-sm font-medium'>
                              {lab.testType}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {[
                                lab.resultValue &&
                                  `${lab.resultValue}${lab.resultUnit ? ` ${lab.resultUnit}` : ''}`,
                                lab.status
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </div>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={() =>
                              setStagedLabs((prev) =>
                                prev.filter((_, idx) => idx !== i)
                              )
                            }
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                      <Separator />
                    </div>
                  )}

                  {/* Lab Draft form */}
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    <div className='space-y-2'>
                      <Label>Test Type *</Label>
                      <Input
                        placeholder='e.g. Complete Blood Count'
                        value={labDraft.testType || ''}
                        onChange={(e) =>
                          setLabDraft((d) => ({
                            ...d,
                            testType: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Test Date</Label>
                      <Input
                        type='date'
                        value={labDraft.testDate || ''}
                        onChange={(e) =>
                          setLabDraft((d) => ({
                            ...d,
                            testDate: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Test Facility</Label>
                      <Input
                        placeholder='e.g. Lab Corp'
                        value={labDraft.testFacility || ''}
                        onChange={(e) =>
                          setLabDraft((d) => ({
                            ...d,
                            testFacility: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Result Value</Label>
                      <Input
                        placeholder='e.g. 12.5'
                        value={labDraft.resultValue || ''}
                        onChange={(e) =>
                          setLabDraft((d) => ({
                            ...d,
                            resultValue: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Unit</Label>
                      <Input
                        placeholder='e.g. g/dL'
                        value={labDraft.resultUnit || ''}
                        onChange={(e) =>
                          setLabDraft((d) => ({
                            ...d,
                            resultUnit: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Reference Range</Label>
                      <Input
                        placeholder='e.g. 12.0-16.0'
                        value={labDraft.referenceRange || ''}
                        onChange={(e) =>
                          setLabDraft((d) => ({
                            ...d,
                            referenceRange: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Status</Label>
                      <Select
                        value={labDraft.status || ''}
                        onValueChange={(v) =>
                          setLabDraft((d) => ({ ...d, status: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select status' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='registered'>Registered</SelectItem>
                          <SelectItem value='preliminary'>
                            Preliminary
                          </SelectItem>
                          <SelectItem value='final'>Final</SelectItem>
                          <SelectItem value='amended'>Amended</SelectItem>
                          <SelectItem value='cancelled'>Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label>LOINC Code</Label>
                      <Input
                        placeholder='e.g. 718-7'
                        value={labDraft.loincCode || ''}
                        onChange={(e) =>
                          setLabDraft((d) => ({
                            ...d,
                            loincCode: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Performing Lab</Label>
                      <Input
                        placeholder='e.g. Quest Diagnostics'
                        value={labDraft.performingLab || ''}
                        onChange={(e) =>
                          setLabDraft((d) => ({
                            ...d,
                            performingLab: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Critical Flag</Label>
                      <Select
                        value={labDraft.criticalFlag || ''}
                        onValueChange={(v) =>
                          setLabDraft((d) => ({ ...d, criticalFlag: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='false'>No</SelectItem>
                          <SelectItem value='true'>Yes — Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2 md:col-span-2 lg:col-span-3'>
                      <Label>Conclusion</Label>
                      <Textarea
                        placeholder='Interpretation / conclusion...'
                        rows={2}
                        value={labDraft.conclusion || ''}
                        onChange={(e) =>
                          setLabDraft((d) => ({
                            ...d,
                            conclusion: e.target.value
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className='flex justify-end'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={addLabResult}
                    >
                      <Plus className='mr-2 h-4 w-4' /> Stage Lab Result
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* ── Surgery / Procedures (collapsible — staged) ── */}
            <Card>
              <CardHeader
                className='cursor-pointer'
                onClick={() => setSurgOpen((o) => !o)}
              >
                <CardTitle className='flex items-center gap-2'>
                  <Scissors className='h-4 w-4' /> Surgery / Procedures
                  {stagedSurgeries.length > 0 && (
                    <Badge variant='secondary'>{stagedSurgeries.length}</Badge>
                  )}
                  <span className='ml-auto'>
                    {surgOpen ? (
                      <ChevronDown className='h-4 w-4' />
                    ) : (
                      <ChevronRight className='h-4 w-4' />
                    )}
                  </span>
                </CardTitle>
                <CardDescription>
                  Stage procedures to be created with this encounter (optional)
                </CardDescription>
              </CardHeader>
              {surgOpen && (
                <CardContent className='space-y-4'>
                  {/* Staged surgeries list */}
                  {stagedSurgeries.length > 0 && (
                    <div className='space-y-2'>
                      {stagedSurgeries.map((s, i) => (
                        <div
                          key={i}
                          className='bg-muted/30 flex items-center justify-between rounded-md border p-3'
                        >
                          <div>
                            <p className='text-sm font-medium'>
                              {s.surgeryType}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {[s.surgeryDate, s.status, s.anesthesiaType]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </div>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={() =>
                              setStagedSurgeries((prev) =>
                                prev.filter((_, idx) => idx !== i)
                              )
                            }
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                      <Separator />
                    </div>
                  )}

                  {/* Surgery Draft form */}
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    <div className='space-y-2'>
                      <Label>Procedure Type *</Label>
                      <Input
                        placeholder='e.g. Appendectomy'
                        value={surgDraft.surgeryType || ''}
                        onChange={(e) =>
                          setSurgDraft((d) => ({
                            ...d,
                            surgeryType: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Date</Label>
                      <Input
                        type='date'
                        value={surgDraft.surgeryDate || ''}
                        onChange={(e) =>
                          setSurgDraft((d) => ({
                            ...d,
                            surgeryDate: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Status</Label>
                      <Select
                        value={surgDraft.status || ''}
                        onValueChange={(v) =>
                          setSurgDraft((d) => ({ ...d, status: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select status' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='preparation'>
                            Preparation
                          </SelectItem>
                          <SelectItem value='in-progress'>
                            In Progress
                          </SelectItem>
                          <SelectItem value='completed'>Completed</SelectItem>
                          <SelectItem value='not-done'>Not Done</SelectItem>
                          <SelectItem value='on-hold'>On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label>Anesthesia Type</Label>
                      <Select
                        value={surgDraft.anesthesiaType || ''}
                        onValueChange={(v) =>
                          setSurgDraft((d) => ({ ...d, anesthesiaType: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='general'>General</SelectItem>
                          <SelectItem value='local'>Local</SelectItem>
                          <SelectItem value='regional'>Regional</SelectItem>
                          <SelectItem value='spinal'>Spinal</SelectItem>
                          <SelectItem value='epidural'>Epidural</SelectItem>
                          <SelectItem value='sedation'>Sedation</SelectItem>
                          <SelectItem value='none'>None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label>Est. Blood Loss (ml)</Label>
                      <Input
                        type='number'
                        placeholder='0'
                        value={surgDraft.estimatedBloodLoss || ''}
                        onChange={(e) =>
                          setSurgDraft((d) => ({
                            ...d,
                            estimatedBloodLoss: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>CPT Code</Label>
                      <Input
                        placeholder='e.g. 44950'
                        value={surgDraft.cptCode || ''}
                        onChange={(e) =>
                          setSurgDraft((d) => ({
                            ...d,
                            cptCode: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Facility</Label>
                      <Input
                        placeholder='e.g. Operating Room 3'
                        value={surgDraft.surgeryFacility || ''}
                        onChange={(e) =>
                          setSurgDraft((d) => ({
                            ...d,
                            surgeryFacility: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2 md:col-span-2'>
                      <Label>Description</Label>
                      <Textarea
                        placeholder='Procedure description...'
                        rows={2}
                        value={surgDraft.surgeryDesc || ''}
                        onChange={(e) =>
                          setSurgDraft((d) => ({
                            ...d,
                            surgeryDesc: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2 md:col-span-2 lg:col-span-3'>
                      <Label>Notes</Label>
                      <Textarea
                        placeholder='Additional notes...'
                        rows={2}
                        value={surgDraft.notes || ''}
                        onChange={(e) =>
                          setSurgDraft((d) => ({ ...d, notes: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className='flex justify-end'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={addSurgery}
                    >
                      <Plus className='mr-2 h-4 w-4' /> Stage Procedure
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* ── Transcript + SOAP Notes ── */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ClipboardList className='h-4 w-4' /> SOAP Notes
                </CardTitle>
                <CardDescription>
                  Paste a transcript below to auto-generate SOAP notes, or fill
                  them in manually
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-5'>
                {/* Transcript text area + generate button */}
                <div className='bg-muted/20 space-y-3 rounded-lg border border-dashed p-4'>
                  <div className='flex items-center justify-between'>
                    <Label className='flex items-center gap-2 text-sm font-semibold'>
                      <MessageSquareText className='h-4 w-4' /> Transcript /
                      Visit Notes
                    </Label>
                    <Button
                      type='button'
                      size='sm'
                      variant={transcriptText.trim() ? 'default' : 'outline'}
                      disabled={generatingSOAP || !transcriptText.trim()}
                      onClick={handleGenerateSOAP}
                      className='gap-2'
                    >
                      {generatingSOAP ? (
                        <>
                          <Loader2 className='h-4 w-4 animate-spin' />{' '}
                          Generating…
                        </>
                      ) : (
                        <>
                          <Sparkles className='h-4 w-4' /> Generate SOAP Notes
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Paste the encounter transcript here, e.g.:\nDoctor: What brings you in today?\nPatient: I've been having back pain for two weeks…"
                    rows={5}
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    className='font-mono text-sm'
                  />
                  <p className='text-muted-foreground text-[11px]'>
                    The transcript will be sent to OpenAI to generate
                    Subjective, Objective, Assessment &amp; Plan notes
                    automatically.
                  </p>
                </div>

                <Separator />

                {/* SOAP fields */}
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

            {/* ── Documents ── */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FolderOpen className='h-4 w-4' /> Documents
                </CardTitle>
                <CardDescription>
                  Attach referral letters, lab orders, imaging requests, etc.
                  Files are staged locally and uploaded automatically when you
                  create the encounter.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Document Category</Label>
                  <DocumentCategoryPicker
                    value={docCategoryCode}
                    onValueChange={(code, cat) => {
                      setDocCategoryCode(code);
                      setDocCategoryObj(cat);
                    }}
                    placeholder='Select category for uploaded files'
                  />
                  <p className='text-muted-foreground text-[11px]'>
                    Choose a category to classify the uploaded documents (e.g.
                    Lab Results, Imaging, Prescriptions)
                  </p>
                </div>
                <Separator />
                <StagedFileUploader ref={uploaderRef} />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className='flex justify-end gap-3 pb-8'>
              <Button asChild variant='outline'>
                <Link href='/dashboard/encounters'>Cancel</Link>
              </Button>
              <Button type='submit' disabled={formLoading}>
                <Save className='mr-2 h-4 w-4' />
                {formLoading ? 'Creating...' : 'Create Encounter'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
