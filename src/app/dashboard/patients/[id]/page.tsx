'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useEhrShow, useEhrList } from '@/hooks/use-ehr-data';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Shield,
  FileText,
  Plus,
  Clock,
  Mic,
  Check,
  X,
  Upload,
  FolderOpen,
  History,
  User,
  Briefcase,
  Heart,
  Brain,
  Eye,
  Stethoscope,
  Activity,
  Pill,
  Syringe,
  AlertTriangle,
  ClipboardList,
  Users,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  TableProperties,
  Settings2,
  Trash2,
  Save,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import type {
  Patient,
  Encounter,
  Vital,
  InsuranceInformation,
  LifestyleAndHabits,
  MedicalHistory,
  Prescription,
  LabResult,
  Surgery
} from '@/types';
import { PatientSummary } from '@/components/clinical/patient-summary';
import { PatientFilesTab } from '@/components/files/patient-files-tab';
import { EncounterTable } from '@/features/encounters/components/encounter-tables';
import { PrescriptionsTab } from '@/components/clinical/prescriptions-tab';
import { LabResultsTab } from '@/components/clinical/lab-results-tab';
import { SurgeryTab } from '@/components/clinical/surgery-tab';
import { AddPrescriptionForm } from '@/components/clinical/add-prescription-form';
import { AddLabResultForm } from '@/components/clinical/add-lab-result-form';
import { AddSurgeryForm } from '@/components/clinical/add-surgery-form';
import {
  EncounterLinkSelect,
  type EncounterOption
} from '@/components/clinical/encounter-link-select';
import { VitalEditFormContent } from '@/components/clinical/vital-edit-form-content';
import {
  SectionAddButton,
  SectionEditButton,
  SectionDeleteButton,
  EditActions
} from '@/components/clinical/section-actions';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';

// ── API helpers for sub-resource CRUD ────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/** Sanitize body before sending: empty strings → null, strip undefined */
function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue;
    clean[k] = v === '' ? null : v;
  }
  return clean;
}

async function apiCreate<T>(
  resource: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${API_URL}/v1${resource}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitizeBody(body))
  });
  const json = await res.json();
  if (!res.ok || json.success === false)
    throw new Error(json.message || 'Create failed');
  return json.data as T;
}

async function apiPatch<T>(
  resource: string,
  id: string | number,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${API_URL}/v1${resource}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sanitizeBody(body))
  });
  const json = await res.json();
  if (!res.ok || json.success === false)
    throw new Error(json.message || 'Update failed');
  return json.data as T;
}

async function apiDelete(resource: string, id: string | number): Promise<void> {
  const res = await fetch(`${API_URL}/v1${resource}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Delete failed');
}

/** Fetch a single sub-resource (returns null on 404/error) */
async function apiGet<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/v1${url}`);
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch {
    return null;
  }
}

type EditingSection =
  | null
  | 'demographics'
  | 'contact'
  | 'insurance'
  | 'allergy'
  | 'lifestyle'
  | 'consent'
  | 'medical_history';

const statusColors: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  scheduled: 'secondary',
  checked_in: 'outline',
  in_progress: 'default',
  completed: 'default',
  cancelled: 'destructive',
  no_show: 'destructive'
};

export default function PatientShowPage() {
  const params = useParams();
  const { query } = useEhrShow<Patient>({
    resource: 'patients',
    id: params.id as string
  });

  const { data, isLoading } = query;
  const rawPatient = data?.data;

  // ── Fetch sub-resources (insurance, lifestyle, medical history) ──
  const [insuranceInfo, setInsuranceInfo] =
    useState<InsuranceInformation | null>(null);
  const [lifestyleHabits, setLifestyleHabits] =
    useState<LifestyleAndHabits | null>(null);
  const [medicalHistoryData, setMedicalHistoryData] =
    useState<MedicalHistory | null>(null);

  const fetchSubResources = useCallback(async (pid: string) => {
    const [ins, lh, mh] = await Promise.all([
      apiGet<InsuranceInformation>(`/insurance/patient/${pid}/latest`),
      apiGet<LifestyleAndHabits>(`/lifestyle/patient/${pid}/latest`),
      apiGet<MedicalHistory>(`/medical-history/patient/${pid}/latest`)
    ]);
    setInsuranceInfo(ins);
    setLifestyleHabits(lh);
    setMedicalHistoryData(mh);
  }, []);

  useEffect(() => {
    if (rawPatient?.id) fetchSubResources(rawPatient.id);
  }, [rawPatient?.id, fetchSubResources]);

  // Enrich patient with separately-fetched sub-resource data
  const patient = useMemo(() => {
    if (!rawPatient) return null;
    return {
      ...rawPatient,
      insurance_information: insuranceInfo ?? rawPatient.insurance_information,
      lifestyle_and_habits: lifestyleHabits ?? rawPatient.lifestyle_and_habits,
      medical_history: medicalHistoryData ?? rawPatient.medical_history
    } as Patient;
  }, [rawPatient, insuranceInfo, lifestyleHabits, medicalHistoryData]);

  // Fetch encounters for this patient
  const { result: encountersResult } = useEhrList<Encounter>({
    resource: 'encounters',
    pagination: { currentPage: 1, pageSize: 50 },
    filters: patient
      ? [{ field: 'patient_id', operator: 'eq', value: patient.id }]
      : [],
    enabled: !!patient
  });
  const encounters = (encountersResult?.data || []) as Encounter[];

  // Fetch vitals history
  const { result: vitalsResult, query: vitalsQuery } = useEhrList<Vital>({
    resource: 'vitals',
    pagination: { currentPage: 1, pageSize: 20 },
    filters: patient
      ? [{ field: 'patient_id', operator: 'eq', value: patient.id }]
      : [],
    sorters: [{ field: 'recorded_at', order: 'desc' }],
    enabled: !!patient
  });
  const vitals = (vitalsResult?.data || []) as Vital[];

  // ── Fetch prescriptions with linked medications ──
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);

  useEffect(() => {
    if (!patient?.id) return;
    setPrescriptionsLoading(true);
    apiGet<Prescription[]>(
      `/prescriptions/patient/${patient.id}/with-medications`
    )
      .then((data) => setPrescriptions(data || []))
      .finally(() => setPrescriptionsLoading(false));
  }, [patient?.id]);

  // ── Fetch lab results ──
  const { result: labResultsResult, query: labResultsQuery } =
    useEhrList<LabResult>({
      resource: 'lab_results',
      pagination: { currentPage: 1, pageSize: 50 },
      filters: patient
        ? [{ field: 'patient_id', operator: 'eq', value: patient.id }]
        : [],
      sorters: [{ field: 'test_date', order: 'desc' }],
      enabled: !!patient
    });
  const labResults = (labResultsResult?.data || []) as LabResult[];

  // ── Fetch surgeries ──
  const { result: surgeryResult, query: surgeryQuery } = useEhrList<Surgery>({
    resource: 'surgery',
    pagination: { currentPage: 1, pageSize: 50 },
    filters: patient
      ? [{ field: 'patient_id', operator: 'eq', value: patient.id }]
      : [],
    sorters: [{ field: 'surgery_date', order: 'desc' }],
    enabled: !!patient
  });
  const surgeries = (surgeryResult?.data || []) as Surgery[];

  // Vitals view mode state
  const [vitalsView, setVitalsView] = useState<'cards' | 'accordion' | 'table'>(
    'accordion'
  );
  const [expandedVitals, setExpandedVitals] = useState<Set<string>>(new Set());

  // ── Inline edit state ──────────────────────────────────────────────────
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [editDraft, setEditDraft] = useState<Record<string, unknown>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // ── Sidebar collapsed state ──
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Vitals inline edit state ──
  const [editingVitalId, setEditingVitalId] = useState<null | number | 'new'>(
    null
  );
  const [vitalDraft, setVitalDraft] = useState<Record<string, unknown>>({});

  const refreshPatient = useCallback(() => {
    query.refetch();
    if (rawPatient?.id) fetchSubResources(rawPatient.id);
  }, [query, rawPatient?.id, fetchSubResources]);

  // ── Refresh callbacks for clinical sub-resources ──
  const refreshPrescriptions = useCallback(() => {
    if (!patient?.id) return;
    setPrescriptionsLoading(true);
    apiGet<Prescription[]>(
      `/prescriptions/patient/${patient.id}/with-medications`
    )
      .then((data) => setPrescriptions(data || []))
      .finally(() => setPrescriptionsLoading(false));
  }, [patient?.id]);

  const refreshLabResults = useCallback(() => {
    labResultsQuery.refetch();
  }, [labResultsQuery]);

  const refreshSurgeries = useCallback(() => {
    surgeryQuery.refetch();
  }, [surgeryQuery]);

  // ── Clinical tab inline-edit state (prescriptions, lab results, surgery) ──
  const [editingPrescription, setEditingPrescription] =
    useState<Prescription | null>(null);
  const [editingLabResult, setEditingLabResult] = useState<LabResult | null>(
    null
  );
  const [editingSurgery, setEditingSurgery] = useState<Surgery | null>(null);

  const deletePrescription = useCallback(
    async (id: string | number) => {
      if (!confirm('Delete this prescription?')) return;
      try {
        await apiDelete('/prescriptions', id);
        toast.success('Prescription deleted');
        refreshPrescriptions();
      } catch {
        toast.error('Failed to delete prescription');
      }
    },
    [refreshPrescriptions]
  );

  const deleteLabResult = useCallback(
    async (id: string | number) => {
      if (!confirm('Delete this lab result?')) return;
      try {
        await apiDelete('/lab-results', id);
        toast.success('Lab result deleted');
        refreshLabResults();
      } catch {
        toast.error('Failed to delete lab result');
      }
    },
    [refreshLabResults]
  );

  const deleteSurgery = useCallback(
    async (id: string | number) => {
      if (!confirm('Delete this procedure?')) return;
      try {
        await apiDelete('/surgery', id);
        toast.success('Procedure deleted');
        refreshSurgeries();
      } catch {
        toast.error('Failed to delete procedure');
      }
    },
    [refreshSurgeries]
  );

  /** Start editing a section — populate draft from current data */
  const startEdit = (
    section: EditingSection,
    initialData: Record<string, unknown>
  ) => {
    setEditingSection(section);
    setEditDraft({ ...initialData });
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditDraft({});
  };

  const updateDraft = (key: string, value: unknown) => {
    setEditDraft((prev) => ({ ...prev, [key]: value }));
  };

  /** Save patient fields (demographics, contact, consent) */
  const savePatientFields = async (overrideBody?: Record<string, unknown>) => {
    if (!patient) return;
    setSavingSection(editingSection);
    try {
      await apiPatch('/patients', patient.id, overrideBody ?? editDraft);
      refreshPatient();
      cancelEdit();
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSavingSection(null);
    }
  };

  /** Create a sub-resource (insurance, lifestyle) */
  const createSubResource = async (
    resource: string,
    body: Record<string, unknown>
  ) => {
    if (!patient) return;
    setSavingSection(editingSection);
    try {
      await apiCreate(resource, { ...body, patient_id: patient.id });
      refreshPatient();
      cancelEdit();
    } catch (e) {
      console.error('Create failed:', e);
    } finally {
      setSavingSection(null);
    }
  };

  /** Update a sub-resource */
  const updateSubResource = async (
    resource: string,
    id: string | number,
    overrideBody?: Record<string, unknown>
  ) => {
    setSavingSection(editingSection);
    try {
      await apiPatch(resource, id, overrideBody ?? editDraft);
      refreshPatient();
      cancelEdit();
    } catch (e) {
      console.error('Update failed:', e);
    } finally {
      setSavingSection(null);
    }
  };

  /** Delete a sub-resource */
  const deleteSubResource = async (resource: string, id: string | number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    setSavingSection('deleting');
    try {
      await apiDelete(resource, id);
      refreshPatient();
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setSavingSection(null);
    }
  };

  /** Save a vital (create or update) */
  const saveVital = async () => {
    if (!patient) return;
    setSavingSection('vitals');
    try {
      if (editingVitalId === 'new') {
        await apiCreate('/vitals', { ...vitalDraft, patient_id: patient.id });
      } else {
        await apiPatch('/vitals', editingVitalId as number, vitalDraft);
      }
      vitalsQuery.refetch();
      refreshPatient();
      setEditingVitalId(null);
      setVitalDraft({});
    } catch (e) {
      console.error('Save vital failed:', e);
    } finally {
      setSavingSection(null);
    }
  };

  /** Delete a vital record */
  const deleteVital = async (vitalId: number | string) => {
    if (!confirm('Are you sure you want to delete this vital record?')) return;
    setSavingSection('deleting');
    try {
      await apiDelete('/vitals', vitalId);
      vitalsQuery.refetch();
      refreshPatient();
    } catch (e) {
      console.error('Delete vital failed:', e);
    } finally {
      setSavingSection(null);
    }
  };

  // Column visibility for accordion/table views
  const allVitalColumns = [
    // ── Vital Signs ──
    { key: 'date', label: 'Date', group: 'vitals' },
    { key: 'bp', label: 'BP', group: 'vitals' },
    { key: 'pulse_pr', label: 'Pulse Pr.', group: 'vitals' },
    { key: 'hr', label: 'HR', group: 'vitals' },
    { key: 'temp', label: 'Temp', group: 'vitals' },
    { key: 'spo2', label: 'SpO2', group: 'vitals' },
    { key: 'rr', label: 'RR', group: 'vitals' },
    { key: 'weight', label: 'Weight', group: 'vitals' },
    { key: 'height', label: 'Height', group: 'vitals' },
    { key: 'bmi', label: 'BMI', group: 'vitals' },
    { key: 'pain', label: 'Pain', group: 'vitals' },
    { key: 'glucose', label: 'Glucose', group: 'vitals' },
    // ── Body Composition ──
    { key: 'body_fat', label: 'Body Fat', group: 'body' },
    { key: 'water', label: 'Water', group: 'body' },
    { key: 'muscle_mass', label: 'Muscle Mass', group: 'body' },
    { key: 'bone_mass', label: 'Bone Mass', group: 'body' },
    { key: 'protein', label: 'Protein', group: 'body' },
    { key: 'body_type', label: 'Body Type', group: 'body' },
    { key: 'metabolic_age', label: 'Metabolic Age', group: 'body' },
    { key: 'basal_met', label: 'Basal Met.', group: 'body' },
    { key: 'visceral_fat', label: 'Visceral Fat', group: 'body' },
    { key: 'impedance', label: 'Impedance', group: 'body' },
    { key: 'waist', label: 'Waist', group: 'body' },
    { key: 'peak_flow', label: 'Peak Flow', group: 'body' },
    // ── Additional Measurements ──
    { key: 'blood_glucose', label: 'Blood Glucose', group: 'additional' },
    { key: 'vision', label: 'Vision', group: 'additional' },
    { key: 'hearing', label: 'Hearing', group: 'additional' },
    { key: 'ecg', label: 'ECG Result', group: 'additional' },
    { key: 'notes', label: 'Notes', group: 'additional' },
    // ── Status ──
    { key: 'status', label: 'Status', group: 'vitals' }
  ] as const;
  // Deduplicated keys (status appears in the list once for toggling)
  const uniqueToggleColumns = allVitalColumns.filter(
    (c, i, arr) => arr.findIndex((x) => x.key === c.key) === i
  );
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(uniqueToggleColumns.map((c) => c.key))
  );
  const toggleCol = (key: string) =>
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (isLoading) {
    return (
      <div className='flex gap-6 p-4 md:px-6'>
        <div className='w-72 shrink-0'>
          <Skeleton className='h-96 w-full' />
        </div>
        <div className='flex-1 space-y-4'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-64 w-full' />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className='py-12 text-center'>
        <p className='text-muted-foreground'>Patient not found</p>
        <Button asChild variant='link' className='mt-2'>
          <Link href='/dashboard/patients'>Back to patients</Link>
        </Button>
      </div>
    );
  }

  const age = Math.floor(
    (Date.now() - new Date(patient.date_of_birth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className='flex h-[calc(100vh-8rem)] gap-2 p-4 md:px-6'>
      {/* Left: Patient Summary Sidebar — collapsible */}
      {sidebarOpen && (
        <aside className='bg-card w-64 shrink-0 overflow-hidden rounded-lg border'>
          <PatientSummary patient={patient} />
        </aside>
      )}

      {/* Right: Content Area */}
      <div className='scrollbar-hide min-w-0 flex-1 overflow-auto'>
        {/* Header */}
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 shrink-0'
                    onClick={() => setSidebarOpen((o) => !o)}
                  >
                    {sidebarOpen ? (
                      <PanelLeftClose className='h-4 w-4' />
                    ) : (
                      <PanelLeftOpen className='h-4 w-4' />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom'>
                  {sidebarOpen ? 'Hide patient brief' : 'Show patient brief'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button asChild variant='ghost' size='icon'>
              <Link href='/dashboard/patients'>
                <ArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
            <div>
              <h1 className='text-xl font-bold tracking-tight'>
                {patient.first_name} {patient.last_name}
              </h1>
              <p className='text-muted-foreground text-sm'>
                {age}yo · <span className='capitalize'>{patient.gender}</span> ·
                MRN: {patient.medical_record_number}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button asChild variant='outline' size='sm'>
              <Link
                href={`/dashboard/encounters/create?patient_id=${patient.id}`}
              >
                <Plus className='mr-1 h-3 w-3' />
                New Encounter
              </Link>
            </Button>
            <Button asChild size='sm'>
              <Link href={`/dashboard/patients/${patient.id}/edit`}>
                <Pencil className='mr-1 h-3 w-3' />
                Edit
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs: Profile, Encounters, Sessions, Vitals, Files, Notes, Medical History */}
        <Tabs defaultValue='encounters' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='profile'>Profile</TabsTrigger>
            <TabsTrigger value='encounters'>
              Encounters
              {encounters.length > 0 && (
                <Badge
                  variant='secondary'
                  className='ml-1.5 h-4 px-1.5 text-[10px]'
                >
                  {encounters.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='sessions'>Sessions</TabsTrigger>
            <TabsTrigger value='vitals'>Vitals</TabsTrigger>
            <TabsTrigger value='files'>Files</TabsTrigger>
            <TabsTrigger value='notes'>Notes</TabsTrigger>
            <TabsTrigger value='medical-history'>Medical History</TabsTrigger>
            <TabsTrigger value='prescriptions'>
              Prescriptions
              {prescriptions.length > 0 && (
                <Badge
                  variant='secondary'
                  className='ml-1.5 h-4 px-1.5 text-[10px]'
                >
                  {prescriptions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='lab-results'>
              Lab Results
              {labResults.length > 0 && (
                <Badge
                  variant='secondary'
                  className='ml-1.5 h-4 px-1.5 text-[10px]'
                >
                  {labResults.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='surgery'>
              Surgery
              {surgeries.length > 0 && (
                <Badge
                  variant='secondary'
                  className='ml-1.5 h-4 px-1.5 text-[10px]'
                >
                  {surgeries.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ═══ PROFILE TAB ═══ */}
          <TabsContent value='profile' className='space-y-6'>
            {/* Patient ID + Last Visit badges */}
            <div className='flex justify-end gap-4'>
              <div className='border-primary/40 rounded border px-3 py-1 text-center'>
                <p className='text-muted-foreground text-[10px]'>Patient ID</p>
                <p className='text-primary text-xs font-semibold'>
                  {patient.medical_record_number}
                </p>
              </div>
              <div className='border-primary/40 rounded border px-3 py-1 text-center'>
                <p className='text-muted-foreground text-[10px]'>Last Visit</p>
                <p className='text-primary text-xs font-semibold'>
                  {patient.last_visit_date
                    ? new Date(patient.last_visit_date).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>

            {/* Demographics (3-column — maps to patients table) */}
            <ProfileSection
              title='Demographics'
              actions={
                editingSection !== 'demographics' && (
                  <SectionEditButton
                    onClick={() =>
                      startEdit('demographics', {
                        first_name: patient.first_name || '',
                        last_name: patient.last_name || '',
                        middle_name: patient.middle_name || '',
                        name_prefix: patient.name_prefix || '',
                        name_suffix: patient.name_suffix || '',
                        gender: patient.gender || '',
                        birth_sex: patient.birth_sex || '',
                        date_of_birth:
                          patient.date_of_birth?.split('T')[0] || '',
                        ssn: patient.ssn || '',
                        driver_license_no: patient.driver_license_no || '',
                        eye_color: patient.eye_color || '',
                        race: patient.race || '',
                        ethnicity: patient.ethnicity || '',
                        marital_status: patient.marital_status || '',
                        primary_language:
                          patient.primary_language ||
                          patient.preferred_language ||
                          '',
                        speaking_language: patient.speaking_language || '',
                        suppose_name: patient.suppose_name || '',
                        other_family_member_seen:
                          patient.other_family_member_seen || '',
                        primary_care_physician:
                          patient.primary_care_physician || '',
                        referring_physician: patient.referring_physician || '',
                        emergency_contact_name:
                          patient.emergency_contact_name || '',
                        emergency_contact_relation:
                          patient.emergency_contact_relation || '',
                        emergency_contact_phone_number:
                          patient.emergency_contact_phone_number || '',
                        height: patient.height || '',
                        weight: patient.weight || ''
                      })
                    }
                  />
                )
              }
            >
              {editingSection === 'demographics' ? (
                <>
                  <div className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3'>
                    <EditFormField
                      label='First Name'
                      fieldKey='first_name'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Middle Name'
                      fieldKey='middle_name'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Last Name'
                      fieldKey='last_name'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Prefix'
                      fieldKey='name_prefix'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Suffix'
                      fieldKey='name_suffix'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Gender'
                      fieldKey='gender'
                      draft={editDraft}
                      onUpdate={updateDraft}
                      type='select'
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' }
                      ]}
                    />
                    <EditFormField
                      label='Birth Sex'
                      fieldKey='birth_sex'
                      draft={editDraft}
                      onUpdate={updateDraft}
                      type='select'
                      options={[
                        { value: 'M', label: 'Male' },
                        { value: 'F', label: 'Female' },
                        { value: 'O', label: 'Other' },
                        { value: 'U', label: 'Unknown' }
                      ]}
                    />
                    <EditFormField
                      label='Date of Birth'
                      fieldKey='date_of_birth'
                      draft={editDraft}
                      onUpdate={updateDraft}
                      type='date'
                    />
                    <EditFormField
                      label='SSN'
                      fieldKey='ssn'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Driver License #'
                      fieldKey='driver_license_no'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Eye Color'
                      fieldKey='eye_color'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Height'
                      fieldKey='height'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Weight'
                      fieldKey='weight'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Race'
                      fieldKey='race'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Ethnicity'
                      fieldKey='ethnicity'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Marital Status'
                      fieldKey='marital_status'
                      draft={editDraft}
                      onUpdate={updateDraft}
                      type='select'
                      options={[
                        { value: 'single', label: 'Single' },
                        { value: 'married', label: 'Married' },
                        { value: 'divorced', label: 'Divorced' },
                        { value: 'widowed', label: 'Widowed' },
                        { value: 'separated', label: 'Separated' }
                      ]}
                    />
                    <EditFormField
                      label='Primary Language'
                      fieldKey='primary_language'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Speaking Language'
                      fieldKey='speaking_language'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Spouse Name'
                      fieldKey='suppose_name'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Other Family Seen'
                      fieldKey='other_family_member_seen'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Primary Care Physician'
                      fieldKey='primary_care_physician'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Referring Physician'
                      fieldKey='referring_physician'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Emergency Contact'
                      fieldKey='emergency_contact_name'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Emergency Relation'
                      fieldKey='emergency_contact_relation'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Emergency Phone'
                      fieldKey='emergency_contact_phone_number'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                  </div>
                  <EditActions
                    onSave={savePatientFields}
                    onCancel={cancelEdit}
                    saving={savingSection === 'demographics'}
                  />
                </>
              ) : (
                <div className='grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3'>
                  <ProfileField
                    label='First Name'
                    value={patient.first_name || '----'}
                  />
                  <ProfileField
                    label='Middle Name'
                    value={patient.middle_name || '----'}
                  />
                  <ProfileField
                    label='Last Name'
                    value={patient.last_name || '----'}
                  />
                  <ProfileField
                    label='Prefix'
                    value={patient.name_prefix || '----'}
                  />
                  <ProfileField
                    label='Suffix'
                    value={patient.name_suffix || '----'}
                  />
                  <ProfileField
                    label='Gender'
                    value={patient.gender || '----'}
                  />
                  <ProfileField
                    label='Birth Sex'
                    value={patient.birth_sex || '----'}
                  />
                  <ProfileField
                    label='Date of Birth'
                    value={
                      patient.date_of_birth
                        ? new Date(patient.date_of_birth).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            }
                          )
                        : '----'
                    }
                  />
                  <ProfileField label='SSN' value={patient.ssn || '----'} />
                  <ProfileField
                    label='Driver License #'
                    value={patient.driver_license_no || '----'}
                  />
                  <ProfileField
                    label='Eye Color'
                    value={patient.eye_color || '----'}
                  />
                  <ProfileField
                    label='Height'
                    value={patient.height || '----'}
                  />
                  <ProfileField
                    label='Weight'
                    value={patient.weight || '----'}
                  />
                  <ProfileField label='Race' value={patient.race || '----'} />
                  <ProfileField
                    label='Ethnicity'
                    value={patient.ethnicity || '----'}
                  />
                  <ProfileField
                    label='Marital Status'
                    value={
                      patient.marital_status_display ||
                      patient.marital_status ||
                      '----'
                    }
                  />
                  <ProfileField
                    label='Primary Language'
                    value={
                      patient.primary_language ||
                      patient.preferred_language ||
                      '----'
                    }
                  />
                  <ProfileField
                    label='Speaking Language'
                    value={patient.speaking_language || '----'}
                  />
                  <ProfileField
                    label='Spouse Name'
                    value={patient.suppose_name || '----'}
                  />
                  <ProfileField
                    label='Other Family Seen'
                    value={patient.other_family_member_seen || '----'}
                  />
                  <ProfileField
                    label='Primary Care Physician'
                    value={patient.primary_care_physician || '----'}
                  />
                  <ProfileField
                    label='Referring Physician'
                    value={patient.referring_physician || '----'}
                  />
                  <ProfileField
                    label='Emergency Contact'
                    value={
                      patient.emergency_contact_name ||
                      patient.emergency_contact?.name ||
                      '----'
                    }
                  />
                  <ProfileField
                    label='Emergency Relation'
                    value={
                      patient.emergency_contact_relation ||
                      patient.emergency_contact?.relationship ||
                      '----'
                    }
                  />
                  <ProfileField
                    label='Emergency Phone'
                    value={
                      patient.emergency_contact_phone_number ||
                      patient.emergency_contact?.phone ||
                      '----'
                    }
                  />
                </div>
              )}
            </ProfileSection>

            {/* Contact Info (flat DB fields: street, city, state, zip_code, country) */}
            <ProfileSection
              title='Contact Info'
              actions={
                editingSection !== 'contact' && (
                  <SectionEditButton
                    onClick={() =>
                      startEdit('contact', {
                        phone: patient.phone || '',
                        mobile_phone: patient.mobile_phone || '',
                        email: patient.email || '',
                        street: patient.street || patient.address?.street || '',
                        address_line2: patient.address_line2 || '',
                        address_district: patient.address_district || '',
                        city: patient.city || patient.address?.city || '',
                        state: patient.state || patient.address?.state || '',
                        country:
                          patient.country || patient.address?.country || '',
                        zip_code: patient.zip_code || patient.address?.zip || ''
                      })
                    }
                  />
                )
              }
            >
              {editingSection === 'contact' ? (
                <>
                  <div className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3'>
                    <EditFormField
                      label='Home Phone'
                      fieldKey='phone'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Mobile Phone'
                      fieldKey='mobile_phone'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Email'
                      fieldKey='email'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Street Address'
                      fieldKey='street'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Address Line 2'
                      fieldKey='address_line2'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='District'
                      fieldKey='address_district'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='City'
                      fieldKey='city'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='State'
                      fieldKey='state'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Country'
                      fieldKey='country'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                    <EditFormField
                      label='Zip Code'
                      fieldKey='zip_code'
                      draft={editDraft}
                      onUpdate={updateDraft}
                    />
                  </div>
                  <EditActions
                    onSave={savePatientFields}
                    onCancel={cancelEdit}
                    saving={savingSection === 'contact'}
                  />
                </>
              ) : (
                <div className='grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3'>
                  <ProfileField
                    label='Home Phone'
                    value={patient.phone || '----'}
                  />
                  <ProfileField
                    label='Mobile Phone'
                    value={patient.mobile_phone || '----'}
                  />
                  <ProfileField label='Email' value={patient.email || '----'} />
                  <ProfileField
                    label='Street Address'
                    value={patient.street || patient.address?.street || '----'}
                  />
                  <ProfileField
                    label='Address Line 2'
                    value={patient.address_line2 || '----'}
                  />
                  <ProfileField
                    label='District'
                    value={patient.address_district || '----'}
                  />
                  <ProfileField
                    label='City'
                    value={patient.city || patient.address?.city || '----'}
                  />
                  <ProfileField
                    label='State'
                    value={patient.state || patient.address?.state || '----'}
                  />
                  <ProfileField
                    label='Country'
                    value={
                      patient.country || patient.address?.country || '----'
                    }
                  />
                  <ProfileField
                    label='Zip Code'
                    value={patient.zip_code || patient.address?.zip || '----'}
                  />
                </div>
              )}
            </ProfileSection>

            {/* Insurance and Employer (maps to insuranceinformation + patients) */}
            {(() => {
              const ins = patient.insurance_information;
              const hasInsurance = !!ins?.insurance_id;
              const insId = ins?.insurance_id;
              return (
                <ProfileSection
                  title='Insurance and Employer'
                  actions={
                    editingSection !== 'insurance' && (
                      <>
                        {hasInsurance ? (
                          <>
                            <SectionEditButton
                              onClick={() =>
                                startEdit('insurance', {
                                  primary_insurance_provider:
                                    ins?.primary_insurance_provider || '',
                                  policy_number: ins?.policy_number || '',
                                  group_number: ins?.group_number || '',
                                  plan_type: ins?.plan_type || '',
                                  coverage_start_date:
                                    ins?.coverage_start_date?.split('T')[0] ||
                                    '',
                                  coverage_end_date:
                                    ins?.coverage_end_date?.split('T')[0] || '',
                                  policy_holder_name:
                                    ins?.policy_holder_name || '',
                                  relationship_to_patient:
                                    ins?.relationship_to_patient || '',
                                  secondary_insurance_provider:
                                    ins?.secondary_insurance_provider || '',
                                  network: ins?.network || '',
                                  copay_amount: ins?.copay_amount ?? '',
                                  deductible_amount:
                                    ins?.deductible_amount ?? '',
                                  verification_status:
                                    ins?.verification_status || '',
                                  _occupation: patient.occupation || '',
                                  _employment_status:
                                    patient.employment_status || ''
                                })
                              }
                            />
                            <SectionDeleteButton
                              onClick={() =>
                                deleteSubResource('/insurance', insId!)
                              }
                              loading={savingSection === 'deleting'}
                            />
                          </>
                        ) : (
                          <SectionAddButton
                            onClick={() =>
                              startEdit('insurance', {
                                primary_insurance_provider: '',
                                policy_number: '',
                                group_number: '',
                                plan_type: '',
                                coverage_start_date: '',
                                coverage_end_date: '',
                                policy_holder_name: '',
                                relationship_to_patient: '',
                                secondary_insurance_provider: '',
                                network: '',
                                copay_amount: '',
                                deductible_amount: '',
                                verification_status: '',
                                _occupation: patient.occupation || '',
                                _employment_status:
                                  patient.employment_status || ''
                              })
                            }
                          />
                        )}
                      </>
                    )
                  }
                >
                  {editingSection === 'insurance' ? (
                    <>
                      <div className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3'>
                        <EditFormField
                          label='Insurance Provider'
                          fieldKey='primary_insurance_provider'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='Policy #'
                          fieldKey='policy_number'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='Group #'
                          fieldKey='group_number'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='Plan Type'
                          fieldKey='plan_type'
                          draft={editDraft}
                          onUpdate={updateDraft}
                          type='select'
                          options={[
                            { value: 'HMO', label: 'HMO' },
                            { value: 'PPO', label: 'PPO' },
                            { value: 'EPO', label: 'EPO' },
                            { value: 'POS', label: 'POS' },
                            { value: 'HDHP', label: 'HDHP' }
                          ]}
                        />
                        <EditFormField
                          label='Coverage Start'
                          fieldKey='coverage_start_date'
                          draft={editDraft}
                          onUpdate={updateDraft}
                          type='date'
                        />
                        <EditFormField
                          label='Coverage End'
                          fieldKey='coverage_end_date'
                          draft={editDraft}
                          onUpdate={updateDraft}
                          type='date'
                        />
                        <EditFormField
                          label='Policy Holder'
                          fieldKey='policy_holder_name'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='Relationship'
                          fieldKey='relationship_to_patient'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='Secondary Insurance'
                          fieldKey='secondary_insurance_provider'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='Network'
                          fieldKey='network'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='Copay ($)'
                          fieldKey='copay_amount'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='Deductible ($)'
                          fieldKey='deductible_amount'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='Verification Status'
                          fieldKey='verification_status'
                          draft={editDraft}
                          onUpdate={updateDraft}
                          type='select'
                          options={[
                            { value: 'verified', label: 'Verified' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'denied', label: 'Denied' }
                          ]}
                        />
                        <EditFormField
                          label='Occupation'
                          fieldKey='_occupation'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='Employment Status'
                          fieldKey='_employment_status'
                          draft={editDraft}
                          onUpdate={updateDraft}
                          type='select'
                          options={[
                            { value: 'employed', label: 'Employed' },
                            { value: 'unemployed', label: 'Unemployed' },
                            { value: 'retired', label: 'Retired' },
                            { value: 'student', label: 'Student' },
                            { value: 'self-employed', label: 'Self-Employed' },
                            { value: 'disabled', label: 'Disabled' }
                          ]}
                        />
                      </div>
                      <EditActions
                        onSave={async () => {
                          const { _occupation, _employment_status, ...rest } =
                            editDraft;
                          // Save patient-level fields
                          if (
                            _occupation !== undefined ||
                            _employment_status !== undefined
                          ) {
                            const patientFields: Record<string, unknown> = {};
                            if (_occupation !== undefined)
                              patientFields.occupation = _occupation || null;
                            if (_employment_status !== undefined)
                              patientFields.employment_status =
                                _employment_status || null;
                            await apiPatch(
                              '/patients',
                              patient!.id,
                              patientFields
                            );
                          }
                          // Convert numeric fields for insurance
                          const insuranceBody: Record<string, unknown> = {
                            ...rest
                          };
                          if (
                            insuranceBody.copay_amount != null &&
                            insuranceBody.copay_amount !== ''
                          ) {
                            insuranceBody.copay_amount = parseFloat(
                              String(insuranceBody.copay_amount)
                            );
                          }
                          if (
                            insuranceBody.deductible_amount != null &&
                            insuranceBody.deductible_amount !== ''
                          ) {
                            insuranceBody.deductible_amount = parseFloat(
                              String(insuranceBody.deductible_amount)
                            );
                          }
                          if (hasInsurance) {
                            await updateSubResource(
                              '/insurance',
                              insId!,
                              insuranceBody
                            );
                          } else {
                            await createSubResource(
                              '/insurance',
                              insuranceBody
                            );
                          }
                        }}
                        onCancel={cancelEdit}
                        saving={savingSection === 'insurance'}
                      />
                    </>
                  ) : hasInsurance ? (
                    <div className='grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3'>
                      <ProfileField
                        label='Insurance Provider'
                        value={
                          ins?.primary_insurance_provider ||
                          patient.insurance_name ||
                          '----'
                        }
                      />
                      <ProfileField
                        label='Policy #'
                        value={
                          ins?.policy_number ||
                          patient.insurance_number ||
                          '----'
                        }
                      />
                      <ProfileField
                        label='Group #'
                        value={
                          ins?.group_number || patient.insurance_group || '----'
                        }
                      />
                      <ProfileField
                        label='Plan Type'
                        value={ins?.plan_type || '----'}
                      />
                      <ProfileField
                        label='Coverage Start'
                        value={
                          ins?.coverage_start_date
                            ? new Date(
                                ins.coverage_start_date
                              ).toLocaleDateString()
                            : '----'
                        }
                      />
                      <ProfileField
                        label='Coverage End'
                        value={
                          ins?.coverage_end_date
                            ? new Date(
                                ins.coverage_end_date
                              ).toLocaleDateString()
                            : '----'
                        }
                      />
                      <ProfileField
                        label='Policy Holder'
                        value={ins?.policy_holder_name || '----'}
                      />
                      <ProfileField
                        label='Relationship'
                        value={ins?.relationship_to_patient || '----'}
                      />
                      <ProfileField
                        label='Secondary Insurance'
                        value={ins?.secondary_insurance_provider || 'None'}
                      />
                      <ProfileField
                        label='Network'
                        value={ins?.network || '----'}
                      />
                      <ProfileField
                        label='Copay'
                        value={
                          ins?.copay_amount != null
                            ? `$${ins.copay_amount}`
                            : '----'
                        }
                      />
                      <ProfileField
                        label='Deductible'
                        value={
                          ins?.deductible_amount != null
                            ? `$${ins.deductible_amount}`
                            : '----'
                        }
                      />
                      <ProfileField
                        label='Verification'
                        value={ins?.verification_status || '----'}
                      />
                      <ProfileField
                        label='Occupation'
                        value={patient.occupation || '----'}
                      />
                      <ProfileField
                        label='Employment Status'
                        value={patient.employment_status || '----'}
                      />
                    </div>
                  ) : (
                    <p className='text-muted-foreground py-2 text-sm'>
                      No insurance on file. Click{' '}
                      <Plus className='inline h-3.5 w-3.5' /> to add.
                    </p>
                  )}
                </ProfileSection>
              );
            })()}

            {/* Allergy / Medication / Prescriptions (maps to lifestyle_and_habits allergy fields + patient.medications) */}
            {(() => {
              const lh = patient.lifestyle_and_habits;
              const hasLH = !!lh?.lifestyle_id;
              const lhId = lh?.lifestyle_id;
              return (
                <ProfileSection
                  title='Allergy / Medication / Prescriptions'
                  actions={
                    editingSection !== 'allergy' && (
                      <>
                        {hasLH ? (
                          <SectionEditButton
                            onClick={() =>
                              startEdit('allergy', {
                                allergies_medications:
                                  lh?.allergies_medications || '',
                                allergies_environmental:
                                  lh?.allergies_environmental || '',
                                allergies_food: lh?.allergies_food || '',
                                allergies_other: lh?.allergies_other || '',
                                no_known_drug_allergies:
                                  lh?.no_known_drug_allergies
                                    ? 'true'
                                    : 'false',
                                no_known_environmental_allergies:
                                  lh?.no_known_environmental_allergies
                                    ? 'true'
                                    : 'false',
                                no_known_food_allergies:
                                  lh?.no_known_food_allergies ? 'true' : 'false'
                              })
                            }
                          />
                        ) : (
                          <SectionAddButton
                            onClick={() =>
                              startEdit('allergy', {
                                allergies_medications: '',
                                allergies_environmental: '',
                                allergies_food: '',
                                allergies_other: '',
                                no_known_drug_allergies: 'false',
                                no_known_environmental_allergies: 'false',
                                no_known_food_allergies: 'false'
                              })
                            }
                          />
                        )}
                      </>
                    )
                  }
                >
                  {editingSection === 'allergy' ? (
                    <>
                      <p className='text-muted-foreground mb-2 text-xs'>
                        Separate multiple allergies with commas
                      </p>
                      <div className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2'>
                        <EditFormField
                          label='Medication Allergies'
                          fieldKey='allergies_medications'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='Environmental Allergies'
                          fieldKey='allergies_environmental'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='Food Allergies'
                          fieldKey='allergies_food'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='Other Allergies'
                          fieldKey='allergies_other'
                          draft={editDraft}
                          onUpdate={updateDraft}
                        />
                        <EditFormField
                          label='No Known Drug Allergies'
                          fieldKey='no_known_drug_allergies'
                          draft={editDraft}
                          onUpdate={updateDraft}
                          type='select'
                          options={[
                            { value: 'true', label: 'Yes' },
                            { value: 'false', label: 'No' }
                          ]}
                        />
                        <EditFormField
                          label='No Known Env. Allergies'
                          fieldKey='no_known_environmental_allergies'
                          draft={editDraft}
                          onUpdate={updateDraft}
                          type='select'
                          options={[
                            { value: 'true', label: 'Yes' },
                            { value: 'false', label: 'No' }
                          ]}
                        />
                        <EditFormField
                          label='No Known Food Allergies'
                          fieldKey='no_known_food_allergies'
                          draft={editDraft}
                          onUpdate={updateDraft}
                          type='select'
                          options={[
                            { value: 'true', label: 'Yes' },
                            { value: 'false', label: 'No' }
                          ]}
                        />
                      </div>
                      <EditActions
                        onSave={() => {
                          const body = {
                            ...editDraft,
                            no_known_drug_allergies:
                              editDraft.no_known_drug_allergies === 'true',
                            no_known_environmental_allergies:
                              editDraft.no_known_environmental_allergies ===
                              'true',
                            no_known_food_allergies:
                              editDraft.no_known_food_allergies === 'true'
                          };
                          return hasLH
                            ? updateSubResource('/lifestyle', lhId!, body)
                            : createSubResource('/lifestyle', body);
                        }}
                        onCancel={cancelEdit}
                        saving={savingSection === 'allergy'}
                      />
                    </>
                  ) : (
                    <div className='space-y-4'>
                      <div className='grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2'>
                        <div>
                          <h4 className='text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase'>
                            Medication Allergies
                          </h4>
                          {lh?.allergies_medications ? (
                            <div className='flex flex-wrap gap-1.5'>
                              {lh.allergies_medications
                                .split(',')
                                .map((a, i) => (
                                  <Badge
                                    key={i}
                                    variant='destructive'
                                    className='text-xs'
                                  >
                                    {a.trim()}
                                  </Badge>
                                ))}
                            </div>
                          ) : lh?.no_known_drug_allergies ? (
                            <p className='text-muted-foreground text-sm'>
                              No Known Drug Allergies (NKDA)
                            </p>
                          ) : (
                            <div className='flex flex-wrap gap-1.5'>
                              {(patient.allergies || []).map((a, i) => (
                                <Badge
                                  key={i}
                                  variant='destructive'
                                  className='text-xs'
                                >
                                  {a}
                                </Badge>
                              ))}
                              {(!patient.allergies ||
                                patient.allergies.length === 0) && (
                                <p className='text-muted-foreground text-sm'>
                                  NKDA
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className='text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase'>
                            Environmental Allergies
                          </h4>
                          {lh?.allergies_environmental ? (
                            <div className='flex flex-wrap gap-1.5'>
                              {lh.allergies_environmental
                                .split(',')
                                .map((a, i) => (
                                  <Badge
                                    key={i}
                                    variant='outline'
                                    className='border-amber-400 text-xs text-amber-600'
                                  >
                                    {a.trim()}
                                  </Badge>
                                ))}
                            </div>
                          ) : lh?.no_known_environmental_allergies ? (
                            <p className='text-muted-foreground text-sm'>
                              None known
                            </p>
                          ) : (
                            <p className='text-muted-foreground text-sm'>
                              ----
                            </p>
                          )}
                        </div>
                        <div>
                          <h4 className='text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase'>
                            Food Allergies
                          </h4>
                          {lh?.allergies_food ? (
                            <div className='flex flex-wrap gap-1.5'>
                              {lh.allergies_food.split(',').map((a, i) => (
                                <Badge
                                  key={i}
                                  variant='outline'
                                  className='border-orange-400 text-xs text-orange-600'
                                >
                                  {a.trim()}
                                </Badge>
                              ))}
                            </div>
                          ) : lh?.no_known_food_allergies ? (
                            <p className='text-muted-foreground text-sm'>
                              None known
                            </p>
                          ) : (
                            <p className='text-muted-foreground text-sm'>
                              ----
                            </p>
                          )}
                        </div>
                        <div>
                          <h4 className='text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase'>
                            Other Allergies
                          </h4>
                          {lh?.allergies_other ? (
                            <div className='flex flex-wrap gap-1.5'>
                              {lh.allergies_other.split(',').map((a, i) => (
                                <Badge
                                  key={i}
                                  variant='outline'
                                  className='text-xs'
                                >
                                  {a.trim()}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className='text-muted-foreground text-sm'>
                              None
                            </p>
                          )}
                        </div>
                      </div>
                      {lh?.allergy_list_reviewed && (
                        <p className='text-muted-foreground text-[10px]'>
                          Allergy list reviewed on {lh.allergy_list_review_date}{' '}
                          by {lh.allergy_list_reviewed_by}
                        </p>
                      )}
                      <div>
                        <h4 className='text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase'>
                          Current Medications
                        </h4>
                        {patient.medications &&
                        patient.medications.length > 0 ? (
                          <div className='flex flex-wrap gap-1.5'>
                            {patient.medications.map((m, i) => (
                              <Badge
                                key={i}
                                variant='secondary'
                                className='text-xs'
                              >
                                {m}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className='text-muted-foreground text-sm'>None</p>
                        )}
                      </div>
                    </div>
                  )}
                </ProfileSection>
              );
            })()}

            {/* Lifestyle & Habits (maps to lifestyle_and_habits table) */}
            {(() => {
              const lh = patient.lifestyle_and_habits;
              const hasLH = !!lh?.lifestyle_id;
              const lhId = lh?.lifestyle_id;
              const lifestyleDraft = {
                smoking_status: lh?.smoking_status || 'never',
                tobacco_type: lh?.tobacco_type || '',
                packs_per_day: lh?.packs_per_day || '',
                pack_years: lh?.pack_years || '',
                tobacco_use_start_date: lh?.tobacco_use_start_date || '',
                tobacco_use_end_date: lh?.tobacco_use_end_date || '',
                ready_to_quit: lh?.ready_to_quit ? 'true' : 'false',
                counseling_provided: lh?.counseling_provided ? 'true' : 'false',
                alcohol_status: lh?.alcohol_status || 'never',
                alcohol_drinks_per_week: lh?.alcohol_drinks_per_week ?? '',
                alcohol_type: lh?.alcohol_type || '',
                alcohol_binge_frequency: lh?.alcohol_binge_frequency || '',
                audit_c_score: lh?.audit_c_score ?? '',
                recreational_drugs: lh?.recreational_drugs || '',
                iv_drug_use: lh?.iv_drug_use ? 'true' : 'false',
                substance_use_treatment_history:
                  lh?.substance_use_treatment_history ? 'true' : 'false',
                naloxone_prescribed: lh?.naloxone_prescribed ? 'true' : 'false',
                exercise_frequency: lh?.exercise_frequency || '',
                exercise_minutes_per_week: lh?.exercise_minutes_per_week ?? '',
                exercise_type: lh?.exercise_type || '',
                diet_type: lh?.diet_type || '',
                dietary_restrictions: lh?.dietary_restrictions || '',
                caffeine_use: lh?.caffeine_use || '',
                sleep_hours_per_night: lh?.sleep_hours_per_night || '',
                sleep_quality: lh?.sleep_quality || '',
                occupation: lh?.occupation || '',
                occupational_hazards: lh?.occupational_hazards || '',
                education_level: lh?.education_level || '',
                living_situation: lh?.living_situation || '',
                social_support: lh?.social_support || '',
                transportation_access: lh?.transportation_access
                  ? 'true'
                  : 'false',
                food_security:
                  typeof lh?.food_security === 'string'
                    ? lh.food_security
                    : lh?.food_security
                      ? 'secure'
                      : '',
                sexually_active: lh?.sexually_active ? 'true' : 'false',
                sexual_orientation: lh?.sexual_orientation || '',
                social_history_notes: lh?.social_history_notes || ''
              };
              const boolKeys = [
                'ready_to_quit',
                'counseling_provided',
                'iv_drug_use',
                'substance_use_treatment_history',
                'naloxone_prescribed',
                'transportation_access',
                'sexually_active'
              ];
              return (
                <ProfileSection
                  title='Lifestyle and Habits'
                  actions={
                    editingSection !== 'lifestyle' && (
                      <>
                        {hasLH ? (
                          <>
                            <SectionEditButton
                              onClick={() =>
                                startEdit('lifestyle', lifestyleDraft)
                              }
                            />
                            <SectionDeleteButton
                              onClick={() =>
                                deleteSubResource('/lifestyle', lhId!)
                              }
                              loading={savingSection === 'deleting'}
                            />
                          </>
                        ) : (
                          <SectionAddButton
                            onClick={() =>
                              startEdit('lifestyle', lifestyleDraft)
                            }
                          />
                        )}
                      </>
                    )
                  }
                >
                  {editingSection === 'lifestyle' ? (
                    <>
                      <div className='space-y-4'>
                        <h4 className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                          Tobacco / Smoking
                        </h4>
                        <div className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3'>
                          <EditFormField
                            label='Smoking Status'
                            fieldKey='smoking_status'
                            draft={editDraft}
                            onUpdate={updateDraft}
                            type='select'
                            options={[
                              { value: 'never', label: 'Never' },
                              { value: 'former', label: 'Former' },
                              { value: 'current', label: 'Current' },
                              { value: 'everyday', label: 'Everyday' },
                              { value: 'someday', label: 'Someday' }
                            ]}
                          />
                          <EditFormField
                            label='Tobacco Type'
                            fieldKey='tobacco_type'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Packs/Day'
                            fieldKey='packs_per_day'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Pack Years'
                            fieldKey='pack_years'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Start Date'
                            fieldKey='tobacco_use_start_date'
                            draft={editDraft}
                            onUpdate={updateDraft}
                            type='date'
                          />
                          <EditFormField
                            label='End Date'
                            fieldKey='tobacco_use_end_date'
                            draft={editDraft}
                            onUpdate={updateDraft}
                            type='date'
                          />
                          <EditFormField
                            label='Ready to Quit'
                            fieldKey='ready_to_quit'
                            draft={editDraft}
                            onUpdate={updateDraft}
                            type='select'
                            options={[
                              { value: 'true', label: 'Yes' },
                              { value: 'false', label: 'No' }
                            ]}
                          />
                          <EditFormField
                            label='Counseling Provided'
                            fieldKey='counseling_provided'
                            draft={editDraft}
                            onUpdate={updateDraft}
                            type='select'
                            options={[
                              { value: 'true', label: 'Yes' },
                              { value: 'false', label: 'No' }
                            ]}
                          />
                        </div>
                        <h4 className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                          Alcohol Use
                        </h4>
                        <div className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3'>
                          <EditFormField
                            label='Alcohol Status'
                            fieldKey='alcohol_status'
                            draft={editDraft}
                            onUpdate={updateDraft}
                            type='select'
                            options={[
                              { value: 'never', label: 'Never' },
                              { value: 'former', label: 'Former' },
                              { value: 'current', label: 'Current' },
                              { value: 'social', label: 'Social' }
                            ]}
                          />
                          <EditFormField
                            label='Drinks/Week'
                            fieldKey='alcohol_drinks_per_week'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Alcohol Type'
                            fieldKey='alcohol_type'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Binge Frequency'
                            fieldKey='alcohol_binge_frequency'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='AUDIT-C Score'
                            fieldKey='audit_c_score'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                        </div>
                        <h4 className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                          Substance Use
                        </h4>
                        <div className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3'>
                          <EditFormField
                            label='Recreational Drugs'
                            fieldKey='recreational_drugs'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='IV Drug Use'
                            fieldKey='iv_drug_use'
                            draft={editDraft}
                            onUpdate={updateDraft}
                            type='select'
                            options={[
                              { value: 'true', label: 'Yes' },
                              { value: 'false', label: 'No' }
                            ]}
                          />
                          <EditFormField
                            label='Treatment History'
                            fieldKey='substance_use_treatment_history'
                            draft={editDraft}
                            onUpdate={updateDraft}
                            type='select'
                            options={[
                              { value: 'true', label: 'Yes' },
                              { value: 'false', label: 'No' }
                            ]}
                          />
                          <EditFormField
                            label='Naloxone Prescribed'
                            fieldKey='naloxone_prescribed'
                            draft={editDraft}
                            onUpdate={updateDraft}
                            type='select'
                            options={[
                              { value: 'true', label: 'Yes' },
                              { value: 'false', label: 'No' }
                            ]}
                          />
                        </div>
                        <h4 className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                          Exercise / Diet / Sleep
                        </h4>
                        <div className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3'>
                          <EditFormField
                            label='Exercise Frequency'
                            fieldKey='exercise_frequency'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Min/Week'
                            fieldKey='exercise_minutes_per_week'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Exercise Type'
                            fieldKey='exercise_type'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Diet Type'
                            fieldKey='diet_type'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Dietary Restrictions'
                            fieldKey='dietary_restrictions'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Caffeine Use'
                            fieldKey='caffeine_use'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Sleep Hrs/Night'
                            fieldKey='sleep_hours_per_night'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Sleep Quality'
                            fieldKey='sleep_quality'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                        </div>
                        <h4 className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                          Social Determinants
                        </h4>
                        <div className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3'>
                          <EditFormField
                            label='Occupation'
                            fieldKey='occupation'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Occupational Hazards'
                            fieldKey='occupational_hazards'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Education Level'
                            fieldKey='education_level'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Living Situation'
                            fieldKey='living_situation'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Social Support'
                            fieldKey='social_support'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Transportation Access'
                            fieldKey='transportation_access'
                            draft={editDraft}
                            onUpdate={updateDraft}
                            type='select'
                            options={[
                              { value: 'true', label: 'Yes' },
                              { value: 'false', label: 'No' }
                            ]}
                          />
                          <EditFormField
                            label='Food Security'
                            fieldKey='food_security'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                          <EditFormField
                            label='Sexually Active'
                            fieldKey='sexually_active'
                            draft={editDraft}
                            onUpdate={updateDraft}
                            type='select'
                            options={[
                              { value: 'true', label: 'Yes' },
                              { value: 'false', label: 'No' }
                            ]}
                          />
                          <EditFormField
                            label='Sexual Orientation'
                            fieldKey='sexual_orientation'
                            draft={editDraft}
                            onUpdate={updateDraft}
                          />
                        </div>
                        <div>
                          <Label className='text-muted-foreground text-xs'>
                            Social History Notes
                          </Label>
                          <textarea
                            className='bg-background mt-1 min-h-15 w-full rounded-md border px-3 py-2 text-sm'
                            value={String(editDraft.social_history_notes ?? '')}
                            onChange={(e) =>
                              updateDraft(
                                'social_history_notes',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                      <EditActions
                        onSave={() => {
                          const body = { ...editDraft };
                          boolKeys.forEach((k) => {
                            body[k] = body[k] === 'true';
                          });
                          if (body.alcohol_drinks_per_week !== '')
                            body.alcohol_drinks_per_week = Number(
                              body.alcohol_drinks_per_week
                            );
                          if (body.audit_c_score !== '')
                            body.audit_c_score = Number(body.audit_c_score);
                          if (body.exercise_minutes_per_week !== '')
                            body.exercise_minutes_per_week = Number(
                              body.exercise_minutes_per_week
                            );
                          return hasLH
                            ? updateSubResource('/lifestyle', lhId!, body)
                            : createSubResource('/lifestyle', body);
                        }}
                        onCancel={cancelEdit}
                        saving={savingSection === 'lifestyle'}
                      />
                    </>
                  ) : hasLH ? (
                    (() => {
                      return (
                        <div className='space-y-4'>
                          <div>
                            <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase'>
                              Tobacco / Smoking
                            </h4>
                            <div className='grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3'>
                              <BoolField
                                label='Smoking Status'
                                value={lh!.smoking_status !== 'never'}
                                text={
                                  lh!.smoking_status_display ||
                                  lh!.smoking_status
                                }
                              />
                              <ProfileField
                                label='Tobacco Type'
                                value={lh!.tobacco_type || 'None'}
                              />
                              <ProfileField
                                label='Packs/Day'
                                value={lh!.packs_per_day || '0'}
                              />
                              <ProfileField
                                label='Pack Years'
                                value={lh!.pack_years || '0'}
                              />
                              <ProfileField
                                label='Start Date'
                                value={lh!.tobacco_use_start_date || '----'}
                              />
                              <ProfileField
                                label='End Date'
                                value={lh!.tobacco_use_end_date || '----'}
                              />
                              <BoolField
                                label='Ready to Quit'
                                value={lh!.ready_to_quit}
                              />
                              <BoolField
                                label='Counseling Provided'
                                value={lh!.counseling_provided}
                              />
                            </div>
                          </div>
                          <div>
                            <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase'>
                              Alcohol Use
                            </h4>
                            <div className='grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3'>
                              <BoolField
                                label='Alcohol Status'
                                value={
                                  lh!.alcohol_status !== 'never' &&
                                  lh!.alcohol_status !== 'former'
                                }
                                text={lh!.alcohol_status}
                              />
                              <ProfileField
                                label='Drinks/Week'
                                value={
                                  lh!.alcohol_drinks_per_week != null
                                    ? String(lh!.alcohol_drinks_per_week)
                                    : '0'
                                }
                              />
                              <ProfileField
                                label='Alcohol Type'
                                value={lh!.alcohol_type || '----'}
                              />
                              <ProfileField
                                label='Binge Frequency'
                                value={lh!.alcohol_binge_frequency || '----'}
                              />
                              <ProfileField
                                label='AUDIT-C Score'
                                value={
                                  lh!.audit_c_score != null
                                    ? String(lh!.audit_c_score)
                                    : '----'
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase'>
                              Substance Use
                            </h4>
                            <div className='grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3'>
                              <ProfileField
                                label='Recreational Drugs'
                                value={lh!.recreational_drugs || 'None'}
                              />
                              <BoolField
                                label='IV Drug Use'
                                value={lh!.iv_drug_use}
                              />
                              <BoolField
                                label='Treatment History'
                                value={lh!.substance_use_treatment_history}
                              />
                              <BoolField
                                label='Naloxone Prescribed'
                                value={lh!.naloxone_prescribed}
                              />
                            </div>
                          </div>
                          <div>
                            <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase'>
                              Exercise / Diet / Sleep
                            </h4>
                            <div className='grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3'>
                              <ProfileField
                                label='Exercise Frequency'
                                value={lh!.exercise_frequency || '----'}
                              />
                              <ProfileField
                                label='Min/Week'
                                value={
                                  lh!.exercise_minutes_per_week != null
                                    ? String(lh!.exercise_minutes_per_week)
                                    : '----'
                                }
                              />
                              <ProfileField
                                label='Exercise Type'
                                value={lh!.exercise_type || '----'}
                              />
                              <ProfileField
                                label='Diet Type'
                                value={lh!.diet_type || '----'}
                              />
                              <ProfileField
                                label='Dietary Restrictions'
                                value={lh!.dietary_restrictions || 'None'}
                              />
                              <ProfileField
                                label='Caffeine Use'
                                value={lh!.caffeine_use || '----'}
                              />
                              <ProfileField
                                label='Sleep Hrs/Night'
                                value={lh!.sleep_hours_per_night || '----'}
                              />
                              <ProfileField
                                label='Sleep Quality'
                                value={lh!.sleep_quality || '----'}
                              />
                            </div>
                          </div>
                          <div>
                            <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase'>
                              Social Determinants
                            </h4>
                            <div className='grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3'>
                              <ProfileField
                                label='Occupation'
                                value={lh!.occupation || '----'}
                              />
                              <ProfileField
                                label='Occupational Hazards'
                                value={lh!.occupational_hazards || 'None'}
                              />
                              <ProfileField
                                label='Education Level'
                                value={lh!.education_level || '----'}
                              />
                              <ProfileField
                                label='Living Situation'
                                value={lh!.living_situation || '----'}
                              />
                              <ProfileField
                                label='Social Support'
                                value={lh!.social_support || '----'}
                              />
                              <BoolField
                                label='Transportation Access'
                                value={lh!.transportation_access}
                              />
                              <ProfileField
                                label='Food Security'
                                value={
                                  typeof lh!.food_security === 'string'
                                    ? lh!.food_security
                                    : lh!.food_security
                                      ? 'Secure'
                                      : 'Insecure'
                                }
                              />
                              <BoolField
                                label='Sexually Active'
                                value={lh!.sexually_active}
                              />
                              <ProfileField
                                label='Sexual Orientation'
                                value={lh!.sexual_orientation || '----'}
                              />
                            </div>
                          </div>
                          {lh!.social_history_notes && (
                            <div>
                              <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase'>
                                Social History Notes
                              </h4>
                              <p className='bg-muted/50 rounded p-3 text-sm whitespace-pre-wrap'>
                                {lh!.social_history_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <p className='text-muted-foreground py-2 text-sm'>
                      No lifestyle data on file. Click{' '}
                      <Plus className='inline h-3.5 w-3.5' /> to add.
                    </p>
                  )}
                </ProfileSection>
              );
            })()}

            {/* HIPAA / Consent */}
            <ProfileSection
              title='Consent & HIPAA'
              actions={
                editingSection !== 'consent' && (
                  <SectionEditButton
                    onClick={() =>
                      startEdit('consent', {
                        hipaa_consent_given: patient.hipaa_consent_given
                          ? 'true'
                          : 'false',
                        hipaa_consent_date:
                          patient.hipaa_consent_date?.split('T')[0] || '',
                        hipaa_privacy_notice_given:
                          patient.hipaa_privacy_notice_given ? 'true' : 'false',
                        patient_acknowledgment: patient.patient_acknowledgment
                          ? 'true'
                          : 'false',
                        certification_date: patient.certification_date || ''
                      })
                    }
                  />
                )
              }
            >
              {editingSection === 'consent' ? (
                <>
                  <div className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3'>
                    <EditFormField
                      label='HIPAA Consent Given'
                      fieldKey='hipaa_consent_given'
                      draft={editDraft}
                      onUpdate={updateDraft}
                      type='select'
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' }
                      ]}
                    />
                    <EditFormField
                      label='Consent Date'
                      fieldKey='hipaa_consent_date'
                      draft={editDraft}
                      onUpdate={updateDraft}
                      type='date'
                    />
                    <EditFormField
                      label='Privacy Notice Given'
                      fieldKey='hipaa_privacy_notice_given'
                      draft={editDraft}
                      onUpdate={updateDraft}
                      type='select'
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' }
                      ]}
                    />
                    <EditFormField
                      label='Patient Acknowledgment'
                      fieldKey='patient_acknowledgment'
                      draft={editDraft}
                      onUpdate={updateDraft}
                      type='select'
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' }
                      ]}
                    />
                    <EditFormField
                      label='Certification Date'
                      fieldKey='certification_date'
                      draft={editDraft}
                      onUpdate={updateDraft}
                      type='date'
                    />
                  </div>
                  <EditActions
                    onSave={() => {
                      const body = {
                        ...editDraft,
                        hipaa_consent_given:
                          editDraft.hipaa_consent_given === 'true',
                        hipaa_privacy_notice_given:
                          editDraft.hipaa_privacy_notice_given === 'true',
                        patient_acknowledgment:
                          editDraft.patient_acknowledgment === 'true'
                      };
                      return savePatientFields(body);
                    }}
                    onCancel={cancelEdit}
                    saving={savingSection === 'consent'}
                  />
                </>
              ) : (
                <div className='grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3'>
                  <BoolField
                    label='HIPAA Consent Given'
                    value={patient.hipaa_consent_given}
                  />
                  <ProfileField
                    label='Consent Date'
                    value={
                      patient.hipaa_consent_date
                        ? new Date(
                            patient.hipaa_consent_date
                          ).toLocaleDateString()
                        : '----'
                    }
                  />
                  <BoolField
                    label='Privacy Notice Given'
                    value={patient.hipaa_privacy_notice_given}
                  />
                  <BoolField
                    label='Patient Acknowledgment'
                    value={patient.patient_acknowledgment}
                  />
                  <ProfileField
                    label='Certification Date'
                    value={patient.certification_date || '----'}
                  />
                </div>
              )}
            </ProfileSection>
          </TabsContent>

          {/* Encounters Tab */}
          <TabsContent value='encounters'>
            {encounters.length > 0 ? (
              <EncounterTable data={encounters} hideColumns={['patient']} />
            ) : (
              <Card>
                <CardContent className='text-muted-foreground py-8 text-center'>
                  <FileText className='mx-auto mb-2 h-8 w-8 opacity-50' />
                  <p>No encounters yet.</p>
                  <Button asChild variant='link' className='mt-2'>
                    <Link
                      href={`/dashboard/encounters/create?patient_id=${patient.id}`}
                    >
                      Create an encounter
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══ SESSIONS TAB ═══ */}
          <TabsContent value='sessions'>
            <Card>
              <CardContent className='text-muted-foreground py-12 text-center'>
                <Mic className='mx-auto mb-2 h-8 w-8 opacity-50' />
                <p className='font-medium'>No session recordings yet</p>
                <p className='mt-1 text-xs'>
                  Session recordings from encounters will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ VITALS TAB ═══ */}
          <TabsContent value='vitals'>
            {vitals.length > 0 ? (
              (() => {
                /* ── shared helpers ── */
                const fmtDate = (v: Vital) => {
                  const d = v.date_recorded || v.recorded_at;
                  if (!d) return '—';
                  return new Date(
                    d.includes('T') ? d : d + 'T00:00:00'
                  ).toLocaleDateString();
                };
                const bpSys = (v: Vital) =>
                  v.blood_pressure_sys ?? v.systolic_bp;
                const bpDia = (v: Vital) =>
                  v.blood_pressure_dia ?? v.diastolic_bp;
                const temp = (v: Vital) => v.body_temperature ?? v.temperature;
                const spo2 = (v: Vital) => v.SpO2 ?? v.oxygen_saturation;
                const bmiV = (v: Vital) => v.body_mass_index ?? v.bmi;
                const pain = (v: Vital) => v.pain_scale ?? v.pain_level;
                const bpCls = (v: Vital) => {
                  const sys = bpSys(v) ?? 0,
                    dia = bpDia(v) ?? 0;
                  if (!sys && !dia) return '';
                  if (sys >= 140 || dia >= 90)
                    return 'text-red-500 font-semibold';
                  if (sys >= 130 || dia >= 85)
                    return 'text-orange-500 font-semibold';
                  return 'text-green-600 font-semibold';
                };
                const spo2Cls = (v: Vital) =>
                  (spo2(v) ?? 100) < 95 ? 'text-red-500 font-semibold' : '';
                const bmiCls = (v: Vital) =>
                  (bmiV(v) ?? 0) >= 30 ? 'text-orange-500 font-semibold' : '';
                const painCls = (v: Vital) =>
                  (pain(v) ?? 0) >= 7
                    ? 'text-red-500 font-semibold'
                    : (pain(v) ?? 0) >= 4
                      ? 'text-orange-500'
                      : '';
                const glucCls = (v: Vital) =>
                  (v.blood_glucose_levels ?? 0) >= 126
                    ? 'text-red-500 font-semibold'
                    : '';
                const deriveStatus = (
                  v: Vital
                ): { label: string; cls: string } => {
                  if (v.interpretation_display || v.interpretation_code) {
                    const code = v.interpretation_code || '';
                    const label = v.interpretation_display || code;
                    if (code === 'N' || label.toLowerCase() === 'normal')
                      return {
                        label,
                        cls: 'bg-green-100 text-green-700 hover:bg-green-100'
                      };
                    if (code === 'HH' || label.toLowerCase().includes('high'))
                      return {
                        label,
                        cls: 'bg-red-100 text-red-700 hover:bg-red-100'
                      };
                    return {
                      label,
                      cls: 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                    };
                  }
                  const sys = bpSys(v) ?? 0,
                    dia = bpDia(v) ?? 0;
                  if (sys >= 140 || dia >= 90)
                    return {
                      label: 'Elevated',
                      cls: 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                    };
                  if (sys >= 130 || dia >= 85)
                    return {
                      label: 'Pre-HTN',
                      cls: 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                    };
                  return {
                    label: 'Normal',
                    cls: 'bg-green-100 text-green-700 hover:bg-green-100'
                  };
                };
                const statusBadge = (v: Vital) => {
                  const { label, cls } = deriveStatus(v);
                  return (
                    <Badge
                      variant='outline'
                      className={`border-0 text-xs ${cls}`}
                    >
                      {label}
                    </Badge>
                  );
                };

                /* ── Vitals detail grid (reused in Card & Accordion) ── */
                const VitalDetail = ({ v }: { v: Vital }) => (
                  <div className='space-y-5 text-sm'>
                    {/* Vital Signs */}
                    <div>
                      <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
                        Vital Signs
                      </h4>
                      <div className='grid grid-cols-3 gap-x-6 gap-y-3 sm:grid-cols-5 md:grid-cols-6'>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            BP
                          </span>
                          <span className={`font-medium ${bpCls(v)}`}>
                            {bpSys(v) && bpDia(v)
                              ? `${bpSys(v)}/${bpDia(v)}`
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Pulse Pr.
                          </span>
                          <span className='font-medium'>
                            {v.pulse_pressure ?? '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            HR
                          </span>
                          <span className='font-medium'>
                            {v.heart_rate ?? '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Temp
                          </span>
                          <span className='font-medium'>
                            {temp(v)
                              ? `${temp(v)}°${v.temperature_unit || 'F'}`
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            SpO2
                          </span>
                          <span className={`font-medium ${spo2Cls(v)}`}>
                            {spo2(v) != null ? `${spo2(v)}%` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            RR
                          </span>
                          <span className='font-medium'>
                            {v.respiratory_rate ?? '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Weight
                          </span>
                          <span className='font-medium'>
                            {v.weight ? `${v.weight} lbs` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Height
                          </span>
                          <span className='font-medium'>
                            {v.height ? `${v.height} in` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            BMI
                          </span>
                          <span className={`font-medium ${bmiCls(v)}`}>
                            {bmiV(v)?.toFixed(1) ?? '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Pain
                          </span>
                          <span className={`font-medium ${painCls(v)}`}>
                            {pain(v) != null ? `${pain(v)}/10` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Glucose
                          </span>
                          <span className={`font-medium ${glucCls(v)}`}>
                            {v.blood_glucose_levels != null
                              ? `${v.blood_glucose_levels}`
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Body Composition */}
                    <div>
                      <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
                        Body Composition
                      </h4>
                      <div className='grid grid-cols-3 gap-x-6 gap-y-3 sm:grid-cols-4 md:grid-cols-6'>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Body Fat
                          </span>
                          <span className='font-medium'>
                            {v.fat != null ? `${v.fat}%` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Water
                          </span>
                          <span className='font-medium'>
                            {v.water != null ? `${v.water}%` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Muscle Mass
                          </span>
                          <span className='font-medium'>
                            {v.muscle_mass != null
                              ? `${v.muscle_mass} lbs`
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Bone Mass
                          </span>
                          <span className='font-medium'>
                            {v.bone_mass != null ? `${v.bone_mass} lbs` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Protein
                          </span>
                          <span className='font-medium'>
                            {v.protein != null ? `${v.protein}%` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Body Type
                          </span>
                          <span className='font-medium'>
                            {v.body_type || '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Metabolic Age
                          </span>
                          <span className='font-medium'>
                            {v.metabolic_age ?? '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Basal Metabolism
                          </span>
                          <span className='font-medium'>
                            {v.basal_metabolism
                              ? `${v.basal_metabolism} kcal`
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Visceral Fat
                          </span>
                          <span className='font-medium'>
                            {v.visceral_fat ?? '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Impedance
                          </span>
                          <span className='font-medium'>
                            {v.impedance ? `${v.impedance} Ω` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Waist Circumference
                          </span>
                          <span className='font-medium'>
                            {v.waist_circumference
                              ? `${v.waist_circumference} in`
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Peak Flow
                          </span>
                          <span className='font-medium'>
                            {v.peak_flow_measurement
                              ? `${v.peak_flow_measurement} L/min`
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Additional Measurements */}
                    <div>
                      <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
                        Additional Measurements
                      </h4>
                      <div className='grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3'>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Blood Glucose
                          </span>
                          <span className={`font-medium ${glucCls(v)}`}>
                            {v.blood_glucose_levels != null
                              ? `${v.blood_glucose_levels} mg/dL`
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Vision Test
                          </span>
                          <span className='font-medium'>
                            {v.vision_test_result || '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground block text-xs'>
                            Hearing Test
                          </span>
                          <span className='font-medium'>
                            {v.hearing_test_result || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* ECG Result */}
                    <div>
                      <span className='text-muted-foreground mb-1 block text-xs'>
                        ECG Result
                      </span>
                      <p className='bg-muted/50 rounded p-2 text-sm'>
                        {v.ecg_result || '—'}
                      </p>
                    </div>
                    {/* Notes */}
                    <div>
                      <span className='text-muted-foreground mb-1 block text-xs'>
                        Notes
                      </span>
                      <p className='bg-muted/50 rounded p-2 text-sm'>
                        {v.note || '—'}
                      </p>
                    </div>
                  </div>
                );

                return (
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
                      <CardTitle className='flex items-center gap-2 text-base'>
                        <Activity className='h-4 w-4' />
                        Vital Signs History
                      </CardTitle>
                      <div className='flex items-center gap-2'>
                        <SectionAddButton
                          onClick={() => {
                            setEditingVitalId('new');
                            setVitalDraft({ patient_id: patient.id });
                          }}
                        />
                        <div className='flex items-center gap-1 rounded-md border p-0.5'>
                          <Button
                            variant={
                              vitalsView === 'cards' ? 'secondary' : 'ghost'
                            }
                            size='sm'
                            className='h-7 w-7 p-0'
                            onClick={() => setVitalsView('cards')}
                            title='Card view'
                          >
                            <LayoutGrid className='h-3.5 w-3.5' />
                          </Button>
                          <Button
                            variant={
                              vitalsView === 'accordion' ? 'secondary' : 'ghost'
                            }
                            size='sm'
                            className='h-7 w-7 p-0'
                            onClick={() => setVitalsView('accordion')}
                            title='Accordion view'
                          >
                            <List className='h-3.5 w-3.5' />
                          </Button>
                          <Button
                            variant={
                              vitalsView === 'table' ? 'secondary' : 'ghost'
                            }
                            size='sm'
                            className='h-7 w-7 p-0'
                            onClick={() => setVitalsView('table')}
                            title='Full table view'
                          >
                            <TableProperties className='h-3.5 w-3.5' />
                          </Button>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-7 gap-1.5 text-xs'
                            >
                              <Settings2 className='h-3.5 w-3.5' />
                              Columns
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align='end'
                            className='max-h-80 w-48 overflow-y-auto p-2'
                          >
                            <p className='mb-2 px-1 text-xs font-semibold'>
                              Toggle Columns
                            </p>
                            <div className='space-y-1'>
                              {uniqueToggleColumns.map((col) => (
                                <label
                                  key={col.key}
                                  className='hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm'
                                >
                                  <Checkbox
                                    checked={visibleCols.has(col.key)}
                                    onCheckedChange={() => toggleCol(col.key)}
                                  />
                                  {col.label}
                                </label>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </CardHeader>
                    <CardContent className='p-0'>
                      {/* New vital form (appears at top in all views) */}
                      {editingVitalId === 'new' && (
                        <div className='border-b p-6 pb-4'>
                          <VitalEditFormContent
                            draft={vitalDraft}
                            onUpdate={(k: string, val: unknown) =>
                              setVitalDraft((prev) => ({ ...prev, [k]: val }))
                            }
                            encounters={encounters}
                          />
                          <EditActions
                            onSave={() => saveVital()}
                            onCancel={() => {
                              setEditingVitalId(null);
                              setVitalDraft({});
                            }}
                            saving={savingSection === 'vitals'}
                          />
                        </div>
                      )}
                      {/* ════ VIEW 1: CARDS ════ */}
                      {vitalsView === 'cards' && (
                        <div className='space-y-4 p-6 pt-0'>
                          {vitals.map((v) => {
                            const vid = (v.vitals_id ?? v.id) as number;
                            return editingVitalId === vid ? (
                              <Card
                                key={v.id}
                                className='border border-blue-200'
                              >
                                <CardHeader className='flex-row items-center justify-between space-y-0 pb-3'>
                                  <span className='text-sm font-semibold'>
                                    Edit — {fmtDate(v)}
                                  </span>
                                </CardHeader>
                                <CardContent className='pt-0'>
                                  <VitalEditFormContent
                                    draft={vitalDraft}
                                    onUpdate={(k: string, val: unknown) =>
                                      setVitalDraft((prev) => ({
                                        ...prev,
                                        [k]: val
                                      }))
                                    }
                                    encounters={encounters}
                                  />
                                  <EditActions
                                    onSave={() => saveVital()}
                                    onCancel={() => {
                                      setEditingVitalId(null);
                                      setVitalDraft({});
                                    }}
                                    saving={savingSection === 'vitals'}
                                  />
                                </CardContent>
                              </Card>
                            ) : (
                              <Card key={v.id} className='border'>
                                <CardHeader className='flex-row items-center justify-between space-y-0 pb-3'>
                                  <span className='text-sm font-semibold'>
                                    {fmtDate(v)}
                                  </span>
                                  <div className='flex items-center gap-1'>
                                    {statusBadge(v)}
                                    <SectionEditButton
                                      onClick={() => {
                                        setEditingVitalId(vid);
                                        setVitalDraft({ ...v });
                                      }}
                                    />
                                    <SectionDeleteButton
                                      onClick={() => deleteVital(vid)}
                                      loading={savingSection === 'deleting'}
                                    />
                                  </div>
                                </CardHeader>
                                <CardContent className='pt-0'>
                                  <VitalDetail v={v} />
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}

                      {/* ════ VIEW 2: ACCORDION ════ */}
                      {vitalsView === 'accordion' &&
                        (() => {
                          /* Collapsed header: Date  BP  HR  Temp  SpO₂  Status */
                          const headerCols: {
                            key: string;
                            label: string;
                            render: (v: Vital) => React.ReactNode;
                          }[] = [
                            {
                              key: 'date',
                              label: 'Date',
                              render: (v) => (
                                <span className='text-sm font-medium whitespace-nowrap'>
                                  {fmtDate(v)}
                                </span>
                              )
                            },
                            {
                              key: 'bp',
                              label: 'BP',
                              render: (v) => (
                                <span
                                  className={`text-sm font-medium ${bpCls(v)}`}
                                >
                                  {bpSys(v) && bpDia(v)
                                    ? `${bpSys(v)}/${bpDia(v)}`
                                    : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'hr',
                              label: 'HR',
                              render: (v) => (
                                <span className='text-sm'>
                                  {v.heart_rate ?? '—'}
                                </span>
                              )
                            },
                            {
                              key: 'temp',
                              label: 'Temp',
                              render: (v) => (
                                <span className='text-sm whitespace-nowrap'>
                                  {temp(v)
                                    ? `${temp(v)}°${v.temperature_unit || 'F'}`
                                    : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'spo2',
                              label: 'SpO2',
                              render: (v) => (
                                <span className={`text-sm ${spo2Cls(v)}`}>
                                  {spo2(v) != null ? `${spo2(v)}%` : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'status',
                              label: 'Status',
                              render: (v) => statusBadge(v)
                            }
                          ];
                          const gridTemplate = `24px repeat(${headerCols.length}, 1fr)`;

                          return (
                            <div>
                              {/* Header row */}
                              <div
                                className='bg-muted/30 text-muted-foreground grid gap-x-4 border-b px-6 py-2 text-xs font-semibold'
                                style={{ gridTemplateColumns: gridTemplate }}
                              >
                                <span />
                                {headerCols.map((c) => (
                                  <span key={c.key}>{c.label}</span>
                                ))}
                              </div>
                              <div className='divide-y'>
                                {vitals.map((v, i) => {
                                  const isOpen = expandedVitals.has(
                                    String(v.id)
                                  );
                                  const autoExpand =
                                    i === 0 && expandedVitals.size === 0;
                                  const shouldShow = isOpen || autoExpand;
                                  return (
                                    <div key={v.id}>
                                      <button
                                        type='button'
                                        className='hover:bg-muted/50 grid w-full items-center gap-x-4 px-6 py-3 text-left transition-colors'
                                        style={{
                                          gridTemplateColumns: gridTemplate
                                        }}
                                        onClick={() => {
                                          setExpandedVitals((prev) => {
                                            const next = new Set(prev);
                                            if (
                                              autoExpand &&
                                              !next.has(String(v.id))
                                            ) {
                                              next.add('__init');
                                              return next;
                                            }
                                            if (next.has(String(v.id)))
                                              next.delete(String(v.id));
                                            else next.add(String(v.id));
                                            return next;
                                          });
                                        }}
                                      >
                                        {shouldShow ? (
                                          <ChevronDown className='text-muted-foreground h-4 w-4' />
                                        ) : (
                                          <ChevronRight className='text-muted-foreground h-4 w-4' />
                                        )}
                                        {headerCols.map((c) => (
                                          <span key={c.key}>{c.render(v)}</span>
                                        ))}
                                      </button>
                                      {shouldShow && (
                                        <div className='bg-muted/20 space-y-5 border-t px-6 pt-3 pb-5 text-sm'>
                                          {/* Additional Vital Signs */}
                                          <div>
                                            <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
                                              Additional Vital Signs
                                            </h4>
                                            <div className='grid grid-cols-3 gap-x-6 gap-y-3 sm:grid-cols-4 md:grid-cols-7'>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Pulse Pressure
                                                </span>
                                                <span className='font-medium'>
                                                  {v.pulse_pressure ?? '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Respiratory Rate
                                                </span>
                                                <span className='font-medium'>
                                                  {v.respiratory_rate != null
                                                    ? `${v.respiratory_rate}/min`
                                                    : '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Weight
                                                </span>
                                                <span className='font-medium'>
                                                  {v.weight
                                                    ? `${v.weight} lbs`
                                                    : '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Height
                                                </span>
                                                <span className='font-medium'>
                                                  {v.height
                                                    ? `${v.height} in`
                                                    : '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  BMI
                                                </span>
                                                <span
                                                  className={`font-medium ${bmiCls(v)}`}
                                                >
                                                  {bmiV(v)?.toFixed(1) ?? '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Pain Level
                                                </span>
                                                <span
                                                  className={`font-medium ${painCls(v)}`}
                                                >
                                                  {pain(v) != null
                                                    ? `${pain(v)}/10`
                                                    : '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Glucose
                                                </span>
                                                <span
                                                  className={`font-medium ${glucCls(v)}`}
                                                >
                                                  {v.blood_glucose_levels !=
                                                  null
                                                    ? `${v.blood_glucose_levels} mg/dL`
                                                    : '—'}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          {/* Body Composition */}
                                          <div>
                                            <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
                                              Body Composition
                                            </h4>
                                            <div className='grid grid-cols-3 gap-x-6 gap-y-3 sm:grid-cols-4 md:grid-cols-6'>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Body Fat
                                                </span>
                                                <span className='font-medium'>
                                                  {v.fat != null
                                                    ? `${v.fat}%`
                                                    : '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Water
                                                </span>
                                                <span className='font-medium'>
                                                  {v.water != null
                                                    ? `${v.water}%`
                                                    : '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Muscle Mass
                                                </span>
                                                <span className='font-medium'>
                                                  {v.muscle_mass != null
                                                    ? `${v.muscle_mass} lbs`
                                                    : '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Bone Mass
                                                </span>
                                                <span className='font-medium'>
                                                  {v.bone_mass != null
                                                    ? `${v.bone_mass} lbs`
                                                    : '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Protein
                                                </span>
                                                <span className='font-medium'>
                                                  {v.protein != null
                                                    ? `${v.protein}%`
                                                    : '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Body Type
                                                </span>
                                                <span className='font-medium'>
                                                  {v.body_type || '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Metabolic Age
                                                </span>
                                                <span className='font-medium'>
                                                  {v.metabolic_age ?? '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Basal Metabolism
                                                </span>
                                                <span className='font-medium'>
                                                  {v.basal_metabolism
                                                    ? `${v.basal_metabolism} kcal`
                                                    : '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Visceral Fat
                                                </span>
                                                <span className='font-medium'>
                                                  {v.visceral_fat ?? '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Impedance
                                                </span>
                                                <span className='font-medium'>
                                                  {v.impedance
                                                    ? `${v.impedance} Ω`
                                                    : '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Waist Circumference
                                                </span>
                                                <span className='font-medium'>
                                                  {v.waist_circumference
                                                    ? `${v.waist_circumference} in`
                                                    : '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Peak Flow
                                                </span>
                                                <span className='font-medium'>
                                                  {v.peak_flow_measurement
                                                    ? `${v.peak_flow_measurement} L/min`
                                                    : '—'}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          {/* Additional Measurements */}
                                          <div>
                                            <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
                                              Additional Measurements
                                            </h4>
                                            <div className='grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3'>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Blood Glucose
                                                </span>
                                                <span
                                                  className={`font-medium ${glucCls(v)}`}
                                                >
                                                  {v.blood_glucose_levels !=
                                                  null
                                                    ? `${v.blood_glucose_levels} mg/dL`
                                                    : '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Vision Test
                                                </span>
                                                <span className='font-medium'>
                                                  {v.vision_test_result || '—'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className='text-muted-foreground block text-xs'>
                                                  Hearing Test
                                                </span>
                                                <span className='font-medium'>
                                                  {v.hearing_test_result || '—'}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          {/* ECG Result */}
                                          <div>
                                            <span className='text-muted-foreground mb-1 block text-xs'>
                                              ECG Result
                                            </span>
                                            <p className='bg-background rounded border p-2 text-sm'>
                                              {v.ecg_result || '—'}
                                            </p>
                                          </div>
                                          {/* Notes */}
                                          <div>
                                            <span className='text-muted-foreground mb-1 block text-xs'>
                                              Notes
                                            </span>
                                            <p className='bg-background rounded border p-2 text-sm'>
                                              {v.note || '—'}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                      {/* ════ VIEW 3: FULL TABLE ════ */}
                      {vitalsView === 'table' &&
                        (() => {
                          const tableColDefs: {
                            key: string;
                            label: string;
                            group: string;
                            render: (v: Vital) => React.ReactNode;
                          }[] = [
                            {
                              key: 'date',
                              label: 'Date',
                              group: 'vitals',
                              render: (v) => (
                                <span className='font-medium whitespace-nowrap'>
                                  {fmtDate(v)}
                                </span>
                              )
                            },
                            {
                              key: 'bp',
                              label: 'BP',
                              group: 'vitals',
                              render: (v) => (
                                <span
                                  className={`whitespace-nowrap ${bpCls(v)}`}
                                >
                                  {bpSys(v) && bpDia(v)
                                    ? `${bpSys(v)}/${bpDia(v)}`
                                    : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'pulse_pr',
                              label: 'Pulse Pr.',
                              group: 'vitals',
                              render: (v) => <>{v.pulse_pressure ?? '—'}</>
                            },
                            {
                              key: 'hr',
                              label: 'HR',
                              group: 'vitals',
                              render: (v) => <>{v.heart_rate ?? '—'}</>
                            },
                            {
                              key: 'temp',
                              label: 'Temp',
                              group: 'vitals',
                              render: (v) => (
                                <span className='whitespace-nowrap'>
                                  {temp(v)
                                    ? `${temp(v)}°${v.temperature_unit || 'F'}`
                                    : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'spo2',
                              label: 'SpO2',
                              group: 'vitals',
                              render: (v) => (
                                <span className={spo2Cls(v)}>
                                  {spo2(v) != null ? `${spo2(v)}%` : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'rr',
                              label: 'RR',
                              group: 'vitals',
                              render: (v) => <>{v.respiratory_rate ?? '—'}</>
                            },
                            {
                              key: 'weight',
                              label: 'Weight',
                              group: 'vitals',
                              render: (v) => (
                                <span className='whitespace-nowrap'>
                                  {v.weight ? `${v.weight} lbs` : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'height',
                              label: 'Height',
                              group: 'vitals',
                              render: (v) => (
                                <span className='whitespace-nowrap'>
                                  {v.height ? `${v.height} in` : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'bmi',
                              label: 'BMI',
                              group: 'vitals',
                              render: (v) => (
                                <span className={bmiCls(v)}>
                                  {bmiV(v)?.toFixed(1) ?? '—'}
                                </span>
                              )
                            },
                            {
                              key: 'pain',
                              label: 'Pain',
                              group: 'vitals',
                              render: (v) => (
                                <span className={painCls(v)}>
                                  {pain(v) != null ? `${pain(v)}/10` : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'glucose',
                              label: 'Glucose',
                              group: 'vitals',
                              render: (v) => (
                                <span className={glucCls(v)}>
                                  {v.blood_glucose_levels ?? '—'}
                                </span>
                              )
                            },
                            {
                              key: 'body_fat',
                              label: 'Body Fat',
                              group: 'body',
                              render: (v) => (
                                <>{v.fat != null ? `${v.fat}%` : '—'}</>
                              )
                            },
                            {
                              key: 'water',
                              label: 'Water',
                              group: 'body',
                              render: (v) => (
                                <>{v.water != null ? `${v.water}%` : '—'}</>
                              )
                            },
                            {
                              key: 'muscle_mass',
                              label: 'Muscle Mass',
                              group: 'body',
                              render: (v) => (
                                <span className='whitespace-nowrap'>
                                  {v.muscle_mass != null
                                    ? `${v.muscle_mass} lbs`
                                    : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'bone_mass',
                              label: 'Bone Mass',
                              group: 'body',
                              render: (v) => (
                                <span className='whitespace-nowrap'>
                                  {v.bone_mass != null
                                    ? `${v.bone_mass} lbs`
                                    : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'protein',
                              label: 'Protein',
                              group: 'body',
                              render: (v) => (
                                <>{v.protein != null ? `${v.protein}%` : '—'}</>
                              )
                            },
                            {
                              key: 'body_type',
                              label: 'Body Type',
                              group: 'body',
                              render: (v) => <>{v.body_type || '—'}</>
                            },
                            {
                              key: 'metabolic_age',
                              label: 'Metabolic Age',
                              group: 'body',
                              render: (v) => <>{v.metabolic_age ?? '—'}</>
                            },
                            {
                              key: 'basal_met',
                              label: 'Basal Met.',
                              group: 'body',
                              render: (v) => (
                                <span className='whitespace-nowrap'>
                                  {v.basal_metabolism
                                    ? `${v.basal_metabolism} kcal`
                                    : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'visceral_fat',
                              label: 'Visceral Fat',
                              group: 'body',
                              render: (v) => <>{v.visceral_fat ?? '—'}</>
                            },
                            {
                              key: 'impedance',
                              label: 'Impedance',
                              group: 'body',
                              render: (v) => (
                                <span className='whitespace-nowrap'>
                                  {v.impedance ? `${v.impedance} Ω` : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'waist',
                              label: 'Waist',
                              group: 'body',
                              render: (v) => (
                                <span className='whitespace-nowrap'>
                                  {v.waist_circumference
                                    ? `${v.waist_circumference} in`
                                    : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'peak_flow',
                              label: 'Peak Flow',
                              group: 'body',
                              render: (v) => (
                                <span className='whitespace-nowrap'>
                                  {v.peak_flow_measurement
                                    ? `${v.peak_flow_measurement} L/min`
                                    : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'blood_glucose',
                              label: 'Blood Glucose',
                              group: 'additional',
                              render: (v) => (
                                <span
                                  className={`whitespace-nowrap ${glucCls(v)}`}
                                >
                                  {v.blood_glucose_levels != null
                                    ? `${v.blood_glucose_levels} mg/dL`
                                    : '—'}
                                </span>
                              )
                            },
                            {
                              key: 'vision',
                              label: 'Vision',
                              group: 'additional',
                              render: (v) => (
                                <span className='whitespace-nowrap'>
                                  {v.vision_test_result || '—'}
                                </span>
                              )
                            },
                            {
                              key: 'hearing',
                              label: 'Hearing',
                              group: 'additional',
                              render: (v) => (
                                <span className='whitespace-nowrap'>
                                  {v.hearing_test_result || '—'}
                                </span>
                              )
                            },
                            {
                              key: 'ecg',
                              label: 'ECG Result',
                              group: 'additional',
                              render: (v) => <span>{v.ecg_result || '—'}</span>
                            },
                            {
                              key: 'notes',
                              label: 'Notes',
                              group: 'additional',
                              render: (v) => <span>{v.note || '—'}</span>
                            },
                            {
                              key: 'status',
                              label: 'Status',
                              group: 'vitals',
                              render: (v) => statusBadge(v)
                            }
                          ];
                          const activeTableCols = tableColDefs.filter((c) =>
                            visibleCols.has(c.key)
                          );
                          // Group header spans
                          const vitalsCount = activeTableCols.filter(
                            (c) => c.group === 'vitals'
                          ).length;
                          const bodyCount = activeTableCols.filter(
                            (c) => c.group === 'body'
                          ).length;
                          const additionalCount = activeTableCols.filter(
                            (c) => c.group === 'additional'
                          ).length;

                          return (
                            <div className='overflow-x-auto'>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {vitalsCount > 0 && (
                                      <TableHead
                                        colSpan={vitalsCount}
                                        className='bg-muted/30 text-muted-foreground text-xs font-semibold uppercase'
                                      >
                                        Vital Signs
                                      </TableHead>
                                    )}
                                    {bodyCount > 0 && (
                                      <TableHead
                                        colSpan={bodyCount}
                                        className='bg-muted/30 text-muted-foreground border-l text-xs font-semibold uppercase'
                                      >
                                        Body Composition
                                      </TableHead>
                                    )}
                                    {additionalCount > 0 && (
                                      <TableHead
                                        colSpan={additionalCount}
                                        className='bg-muted/30 text-muted-foreground border-l text-xs font-semibold uppercase'
                                      >
                                        Additional Measurements
                                      </TableHead>
                                    )}
                                  </TableRow>
                                  <TableRow>
                                    {activeTableCols.map((col, idx) => {
                                      const prevGroup =
                                        idx > 0
                                          ? activeTableCols[idx - 1].group
                                          : col.group;
                                      const borderCls =
                                        idx > 0 && col.group !== prevGroup
                                          ? ' border-l'
                                          : '';
                                      return (
                                        <TableHead
                                          key={col.key}
                                          className={`whitespace-nowrap${borderCls}`}
                                        >
                                          {col.label}
                                        </TableHead>
                                      );
                                    })}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {vitals.map((v) => (
                                    <TableRow key={v.id}>
                                      {activeTableCols.map((col, idx) => {
                                        const prevGroup =
                                          idx > 0
                                            ? activeTableCols[idx - 1].group
                                            : col.group;
                                        const borderCls =
                                          idx > 0 && col.group !== prevGroup
                                            ? ' border-l'
                                            : '';
                                        return (
                                          <TableCell
                                            key={col.key}
                                            className={`text-sm${borderCls}`}
                                          >
                                            {col.render(v)}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          );
                        })()}
                    </CardContent>
                  </Card>
                );
              })()
            ) : (
              <>
                <Card>
                  <CardContent className='text-muted-foreground py-8 text-center'>
                    <p>No vitals recorded for this patient.</p>
                    <Button
                      variant='outline'
                      size='sm'
                      className='mt-3'
                      onClick={() => {
                        setEditingVitalId('new');
                        setVitalDraft({ patient_id: patient!.id });
                      }}
                    >
                      <Plus className='mr-1.5 h-3.5 w-3.5' />
                      Record Vitals
                    </Button>
                  </CardContent>
                </Card>
                {editingVitalId === 'new' && (
                  <Card className='mt-4 border border-green-200'>
                    <CardHeader className='pb-3'>
                      <CardTitle className='text-base'>
                        New Vital Record
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-0'>
                      <VitalEditFormContent
                        draft={vitalDraft}
                        onUpdate={(k: string, val: unknown) =>
                          setVitalDraft((prev) => ({ ...prev, [k]: val }))
                        }
                        encounters={encounters}
                      />
                      <EditActions
                        onSave={() => saveVital()}
                        onCancel={() => {
                          setEditingVitalId(null);
                          setVitalDraft({});
                        }}
                        saving={savingSection === 'vitals'}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ═══ FILES TAB ═══ */}
          <TabsContent value='files'>
            <PatientFilesTab
              patientId={String(patient.id)}
              encounters={encounters.map((e) => ({
                id: e.id,
                encounter_type: e.encounter_type,
                scheduled_at: e.scheduled_at,
                status: e.status
              }))}
            />
          </TabsContent>

          {/* ═══ NOTES TAB ═══ */}
          <TabsContent value='notes'>
            <Card>
              <CardContent className='py-6'>
                {patient.notes ? (
                  <p className='text-sm whitespace-pre-wrap'>{patient.notes}</p>
                ) : (
                  <p className='text-muted-foreground text-center text-sm'>
                    No clinical notes for this patient.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ MEDICAL HISTORY TAB ═══ */}
          <TabsContent value='medical-history' className='space-y-4'>
            {/* Medical History Actions Header */}
            <div className='flex items-center gap-3'>
              <h3 className='text-sm font-semibold whitespace-nowrap'>
                Medical History
              </h3>
              <Separator className='flex-1' />
              <div className='flex shrink-0 items-center gap-1'>
                {patient.medical_history ? (
                  <>
                    <SectionEditButton
                      onClick={() =>
                        startEdit('medical_history', {
                          ...patient.medical_history
                        })
                      }
                    />
                    <SectionDeleteButton
                      onClick={() =>
                        deleteSubResource(
                          '/medical-history',
                          patient.medical_history!.medical_history_id!
                        )
                      }
                      loading={savingSection === 'deleting'}
                    />
                  </>
                ) : (
                  <SectionAddButton
                    onClick={() =>
                      startEdit('medical_history', { patient_id: patient.id })
                    }
                  />
                )}
              </div>
            </div>

            {editingSection === 'medical_history' ? (
              <MedicalHistoryEditCard
                draft={editDraft}
                onUpdate={updateDraft}
                onSave={() => {
                  const mhId = patient.medical_history?.medical_history_id;
                  if (mhId) updateSubResource('/medical-history', mhId);
                  else createSubResource('/medical-history', editDraft);
                }}
                onCancel={cancelEdit}
                saving={savingSection === 'medical_history'}
              />
            ) : patient.medical_history ? (
              (() => {
                const mh = patient.medical_history;
                return (
                  <>
                    {/* Row 1: Contact Information + Insurance (kept as-is) */}
                    <div className='grid gap-4 md:grid-cols-2'>
                      <Card>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2 text-base'>
                            <Phone className='h-4 w-4' />
                            Contact Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                          {patient.phone && (
                            <div className='flex items-center gap-2'>
                              <Phone className='text-muted-foreground h-3.5 w-3.5' />
                              <span className='text-sm'>{patient.phone}</span>
                            </div>
                          )}
                          {patient.email && (
                            <div className='flex items-center gap-2'>
                              <Mail className='text-muted-foreground h-3.5 w-3.5' />
                              <span className='text-sm'>{patient.email}</span>
                            </div>
                          )}
                          {(patient.street || patient.address) && (
                            <div className='flex items-start gap-2'>
                              <MapPin className='text-muted-foreground mt-0.5 h-3.5 w-3.5' />
                              <div className='text-sm'>
                                <div>
                                  {patient.street || patient.address?.street}
                                </div>
                                <div>
                                  {patient.city || patient.address?.city},{' '}
                                  {patient.state || patient.address?.state}{' '}
                                  {patient.zip_code || patient.address?.zip}
                                </div>
                              </div>
                            </div>
                          )}
                          {!patient.phone &&
                            !patient.email &&
                            !patient.street &&
                            !patient.address && (
                              <p className='text-muted-foreground text-sm'>
                                No contact information
                              </p>
                            )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2 text-base'>
                            <Shield className='h-4 w-4' />
                            Insurance
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {patient.insurance ||
                          patient.insurance_information ? (
                            <div className='space-y-2 text-sm'>
                              <div>
                                <span className='text-muted-foreground'>
                                  Provider:{' '}
                                </span>
                                <span className='font-medium'>
                                  {patient.insurance_information
                                    ?.primary_insurance_provider ||
                                    patient.insurance?.provider}
                                </span>
                              </div>
                              <div>
                                <span className='text-muted-foreground'>
                                  Policy:{' '}
                                </span>
                                <span className='font-mono'>
                                  {patient.insurance_information
                                    ?.policy_number ||
                                    patient.insurance?.policy_number}
                                </span>
                              </div>
                              <div>
                                <span className='text-muted-foreground'>
                                  Group:{' '}
                                </span>
                                <span className='font-mono'>
                                  {patient.insurance_information
                                    ?.group_number ||
                                    patient.insurance?.group_number ||
                                    '—'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className='text-muted-foreground text-sm'>
                              No insurance on file
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Demographics card (kept as-is) */}
                    <Card>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-base'>
                          <User className='h-4 w-4' />
                          Demographics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
                          <div>
                            <span className='text-muted-foreground block'>
                              Date of Birth
                            </span>
                            <span className='font-medium'>
                              {new Date(
                                patient.date_of_birth
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className='text-muted-foreground block'>
                              Age
                            </span>
                            <span className='font-medium'>{age} years</span>
                          </div>
                          <div>
                            <span className='text-muted-foreground block'>
                              Gender
                            </span>
                            <span className='font-medium capitalize'>
                              {patient.gender}
                            </span>
                          </div>
                          <div>
                            <span className='text-muted-foreground block'>
                              Status
                            </span>
                            <span className='font-medium capitalize'>
                              {patient.status}
                            </span>
                          </div>
                          <div>
                            <span className='text-muted-foreground block'>
                              Race
                            </span>
                            <span className='font-medium capitalize'>
                              {patient.race || '—'}
                            </span>
                          </div>
                          <div>
                            <span className='text-muted-foreground block'>
                              Ethnicity
                            </span>
                            <span className='font-medium capitalize'>
                              {patient.ethnicity || '—'}
                            </span>
                          </div>
                          <div>
                            <span className='text-muted-foreground block'>
                              Marital Status
                            </span>
                            <span className='font-medium capitalize'>
                              {patient.marital_status || '—'}
                            </span>
                          </div>
                          <div>
                            <span className='text-muted-foreground block'>
                              Language
                            </span>
                            <span className='font-medium'>
                              {patient.primary_language ||
                                patient.preferred_language ||
                                'English'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ── Chronic Conditions ── */}
                    <Card>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-base'>
                          <Activity className='h-4 w-4' />
                          Chronic Conditions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='mb-3 flex flex-wrap gap-2'>
                          {mh.chronic_conditions_hypertension && (
                            <Badge variant='destructive'>Hypertension</Badge>
                          )}
                          {mh.chronic_conditions_diabetes && (
                            <Badge variant='destructive'>Diabetes</Badge>
                          )}
                          {mh.chronic_conditions_asthma && (
                            <Badge variant='destructive'>Asthma</Badge>
                          )}
                          {mh.chronic_conditions_heart_disease && (
                            <Badge variant='destructive'>Heart Disease</Badge>
                          )}
                          {mh.chronic_conditions_other &&
                            mh.chronic_conditions_other_detail &&
                            mh.chronic_conditions_other_detail
                              .split(',')
                              .map((c, i) => (
                                <Badge key={i} variant='destructive'>
                                  {c.trim()}
                                </Badge>
                              ))}
                          {!mh.chronic_conditions_hypertension &&
                            !mh.chronic_conditions_diabetes &&
                            !mh.chronic_conditions_asthma &&
                            !mh.chronic_conditions_heart_disease &&
                            !mh.chronic_conditions_other && (
                              <p className='text-muted-foreground text-sm'>
                                No chronic conditions reported
                              </p>
                            )}
                        </div>
                        {mh.chronic_conditions_coded &&
                          mh.chronic_conditions_coded.length > 0 && (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Condition</TableHead>
                                  <TableHead>Code</TableHead>
                                  <TableHead>Onset</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {mh.chronic_conditions_coded.map((c, i) => (
                                  <TableRow key={i}>
                                    <TableCell className='font-medium'>
                                      {c.display}
                                    </TableCell>
                                    <TableCell className='font-mono text-xs'>
                                      {c.code} ({c.system})
                                    </TableCell>
                                    <TableCell>
                                      {c.onsetDate
                                        ? new Date(
                                            c.onsetDate
                                          ).toLocaleDateString()
                                        : '—'}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          c.status === 'active'
                                            ? 'default'
                                            : 'secondary'
                                        }
                                        className='text-xs'
                                      >
                                        {c.status || 'active'}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                      </CardContent>
                    </Card>

                    {/* ── Review of Systems ── */}
                    <Card>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-base'>
                          <Stethoscope className='h-4 w-4' />
                          Review of Systems
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                          {/* Cardiovascular */}
                          <div className='space-y-1.5'>
                            <h4 className='text-muted-foreground flex items-center gap-1.5 text-xs font-semibold'>
                              <Heart className='h-3.5 w-3.5' /> Cardiovascular
                            </h4>
                            <ROSItem
                              label='Palpitations'
                              value={mh.cardiovascular_palpitations}
                            />
                            <ROSItem
                              label='Chest Pain'
                              value={mh.cardiovascular_chest_pain}
                            />
                            <ROSItem
                              label='Swelling of Extremities'
                              value={mh.cardiovascular_swelling_of_extremities}
                            />
                          </div>
                          {/* Constitutional */}
                          <div className='space-y-1.5'>
                            <h4 className='text-muted-foreground flex items-center gap-1.5 text-xs font-semibold'>
                              <Activity className='h-3.5 w-3.5' />{' '}
                              Constitutional
                            </h4>
                            <ROSItem
                              label='Fever'
                              value={mh.constitutional_fever}
                            />
                            <ROSItem
                              label='Chills'
                              value={mh.constitutional_chills}
                            />
                            <ROSItem
                              label='Fatigue'
                              value={mh.constitutional_fatigue}
                            />
                            <ROSItem
                              label='Weight Loss'
                              value={mh.constitutional_weight_loss}
                            />
                          </div>
                          {/* Gastrointestinal */}
                          <div className='space-y-1.5'>
                            <h4 className='text-muted-foreground flex items-center gap-1.5 text-xs font-semibold'>
                              <Stethoscope className='h-3.5 w-3.5' />{' '}
                              Gastrointestinal
                            </h4>
                            <ROSItem
                              label='Nausea'
                              value={mh.gastrointestinal_nausea}
                            />
                            <ROSItem
                              label='Vomiting'
                              value={mh.gastrointestinal_vomiting}
                            />
                            <ROSItem
                              label='Diarrhea'
                              value={mh.gastrointestinal_diarrhea}
                            />
                            <ROSItem
                              label='Constipation'
                              value={mh.gastrointestinal_constipation}
                            />
                          </div>
                          {/* Eyes */}
                          <div className='space-y-1.5'>
                            <h4 className='text-muted-foreground flex items-center gap-1.5 text-xs font-semibold'>
                              <Eye className='h-3.5 w-3.5' /> Eyes
                            </h4>
                            <ROSItem label='Redness' value={mh.eyes_redness} />
                            <ROSItem
                              label='Vision Changes'
                              value={mh.eyes_vision_changes}
                            />
                            <ROSItem
                              label='Eye Pain'
                              value={mh.eyes_eye_pain}
                            />
                          </div>
                          {/* Musculoskeletal */}
                          <div className='space-y-1.5'>
                            <h4 className='text-muted-foreground flex items-center gap-1.5 text-xs font-semibold'>
                              <User className='h-3.5 w-3.5' /> Musculoskeletal
                            </h4>
                            <ROSItem
                              label='Stiffness'
                              value={mh.musculoskeletal_stiffness}
                            />
                            <ROSItem
                              label='Joint Pain'
                              value={mh.musculoskeletal_joint_pain}
                            />
                            <ROSItem
                              label='Muscle Pain'
                              value={mh.musculoskeletal_muscle_pain}
                            />
                          </div>
                          {/* Neurological */}
                          <div className='space-y-1.5'>
                            <h4 className='text-muted-foreground flex items-center gap-1.5 text-xs font-semibold'>
                              <Brain className='h-3.5 w-3.5' /> Neurological
                            </h4>
                            <ROSItem
                              label='Headaches'
                              value={mh.neurological_headaches}
                            />
                            <ROSItem
                              label='Dizziness'
                              value={mh.neurological_dizziness}
                            />
                            <ROSItem
                              label='Numbness/Tingling'
                              value={mh.neurological_numbness_tingling}
                            />
                          </div>
                          {/* Psychiatric */}
                          <div className='space-y-1.5'>
                            <h4 className='text-muted-foreground flex items-center gap-1.5 text-xs font-semibold'>
                              <Brain className='h-3.5 w-3.5' /> Psychiatric
                            </h4>
                            <ROSItem
                              label='Depression'
                              value={mh.psychiatric_depression}
                            />
                            <ROSItem
                              label='Anxiety'
                              value={mh.psychiatric_anxiety}
                            />
                            <ROSItem
                              label='Sleep Disturbances'
                              value={mh.psychiatric_sleep_disturbances}
                            />
                          </div>
                          {/* Respiratory */}
                          <div className='space-y-1.5'>
                            <h4 className='text-muted-foreground flex items-center gap-1.5 text-xs font-semibold'>
                              <Stethoscope className='h-3.5 w-3.5' />{' '}
                              Respiratory
                            </h4>
                            <ROSItem
                              label='Cough'
                              value={mh.respiratory_cough}
                            />
                            <ROSItem
                              label='Shortness of Breath'
                              value={mh.respiratory_shortness_of_breath}
                            />
                            <ROSItem
                              label='Wheezing'
                              value={mh.respiratory_wheezing}
                            />
                          </div>
                          {/* Genitourinary */}
                          <div className='space-y-1.5'>
                            <h4 className='text-muted-foreground flex items-center gap-1.5 text-xs font-semibold'>
                              <AlertTriangle className='h-3.5 w-3.5' />{' '}
                              Genitourinary
                            </h4>
                            <ROSItem
                              label='Painful Urination'
                              value={mh.genitourinary_painful_urination}
                            />
                            <ROSItem
                              label='Blood in Urine'
                              value={mh.genitourinary_blood_in_urine}
                            />
                            <ROSItem
                              label='Urgency/Frequency'
                              value={mh.genitourinary_urgency_frequency}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ── Family History ── */}
                    <Card>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-base'>
                          <Users className='h-4 w-4' />
                          Family History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='mb-3 flex flex-wrap gap-2'>
                          {mh.family_history_heart_disease && (
                            <Badge variant='outline'>Heart Disease</Badge>
                          )}
                          {mh.family_history_diabetes && (
                            <Badge variant='outline'>Diabetes</Badge>
                          )}
                          {mh.family_history_cancer && (
                            <Badge variant='outline'>Cancer</Badge>
                          )}
                          {mh.family_history_stroke && (
                            <Badge variant='outline'>Stroke</Badge>
                          )}
                          {mh.family_history_hypertension && (
                            <Badge variant='outline'>Hypertension</Badge>
                          )}
                          {mh.family_history_mental_illness && (
                            <Badge variant='outline'>Mental Illness</Badge>
                          )}
                          {mh.family_history_other &&
                            mh.family_history_other_detail && (
                              <Badge variant='outline'>
                                {mh.family_history_other_detail}
                              </Badge>
                            )}
                          {!mh.family_history_heart_disease &&
                            !mh.family_history_diabetes &&
                            !mh.family_history_cancer &&
                            !mh.family_history_stroke &&
                            !mh.family_history_hypertension &&
                            !mh.family_history_mental_illness &&
                            !mh.family_history_other && (
                              <p className='text-muted-foreground text-sm'>
                                No significant family history reported
                              </p>
                            )}
                        </div>
                        {mh.family_history_coded &&
                          mh.family_history_coded.length > 0 && (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Relationship</TableHead>
                                  <TableHead>Condition</TableHead>
                                  <TableHead>Age at Onset</TableHead>
                                  <TableHead>Contributed to Death</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {mh.family_history_coded.map((f, i) => (
                                  <TableRow key={i}>
                                    <TableCell className='font-medium'>
                                      {f.relationship}
                                    </TableCell>
                                    <TableCell>{f.condition}</TableCell>
                                    <TableCell>{f.ageAtOnset || '—'}</TableCell>
                                    <TableCell>
                                      {f.contributedToDeath ? (
                                        <Badge
                                          variant='destructive'
                                          className='text-xs'
                                        >
                                          Yes
                                        </Badge>
                                      ) : (
                                        <span className='text-muted-foreground text-sm'>
                                          No
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                      </CardContent>
                    </Card>

                    {/* Row: Medications + Past Surgeries */}
                    <div className='grid gap-4 md:grid-cols-2'>
                      {/* Current Medications */}
                      <Card>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2 text-base'>
                            <Pill className='h-4 w-4' />
                            Current Medications
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {mh.current_medications ? (
                            <div className='space-y-1.5'>
                              {mh.current_medications
                                .split(',')
                                .map((med, i) => (
                                  <div
                                    key={i}
                                    className='flex items-center gap-2 text-sm'
                                  >
                                    <div className='bg-primary h-1.5 w-1.5 rounded-full' />
                                    {med.trim()}
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className='text-muted-foreground text-sm'>
                              None
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Past Surgeries */}
                      <Card>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2 text-base'>
                            <ClipboardList className='h-4 w-4' />
                            Past Surgeries
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {mh.past_surgeries && mh.past_surgeries !== 'None' ? (
                            <div className='space-y-1.5'>
                              {mh.past_surgeries.split(',').map((s, i) => (
                                <div
                                  key={i}
                                  className='flex items-center gap-2 text-sm'
                                >
                                  <div className='h-1.5 w-1.5 rounded-full bg-orange-400' />
                                  {s.trim()}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className='text-muted-foreground text-sm'>
                              None
                            </p>
                          )}
                          {mh.past_surgeries_coded &&
                            mh.past_surgeries_coded.length > 0 && (
                              <Table className='mt-3'>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Procedure</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Outcome</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {mh.past_surgeries_coded.map((s, i) => (
                                    <TableRow key={i}>
                                      <TableCell className='font-medium'>
                                        {s.display}
                                      </TableCell>
                                      <TableCell className='font-mono text-xs'>
                                        {s.code} ({s.system})
                                      </TableCell>
                                      <TableCell>
                                        {s.date
                                          ? new Date(
                                              s.date
                                            ).toLocaleDateString()
                                          : '—'}
                                      </TableCell>
                                      <TableCell>{s.outcome || '—'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Row: Previous Injuries + Vaccinations */}
                    <div className='grid gap-4 md:grid-cols-2'>
                      <Card>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2 text-base'>
                            <AlertTriangle className='h-4 w-4' />
                            Previous Injuries
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {mh.previous_injuries &&
                          mh.previous_injuries !== 'None' ? (
                            <div className='space-y-1.5'>
                              {mh.previous_injuries.split(',').map((inj, i) => (
                                <div
                                  key={i}
                                  className='flex items-center gap-2 text-sm'
                                >
                                  <div className='h-1.5 w-1.5 rounded-full bg-amber-400' />
                                  {inj.trim()}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className='text-muted-foreground text-sm'>
                              None reported
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2 text-base'>
                            <Syringe className='h-4 w-4' />
                            Vaccinations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {mh.vaccinations ? (
                            <div className='space-y-1.5'>
                              {mh.vaccinations.split(',').map((v, i) => (
                                <div
                                  key={i}
                                  className='flex items-center gap-2 text-sm'
                                >
                                  <div className='h-1.5 w-1.5 rounded-full bg-green-400' />
                                  {v.trim()}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className='text-muted-foreground text-sm'>
                              No vaccine records
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Clinical Notes */}
                    {mh.clinical_notes && (
                      <Card>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2 text-base'>
                            <FileText className='h-4 w-4' />
                            Clinical Notes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className='text-sm whitespace-pre-wrap'>
                            {mh.clinical_notes}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-base'>
                          <History className='h-4 w-4' />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='flex flex-wrap gap-2'>
                          <Button asChild variant='outline' size='sm'>
                            <Link
                              href={`/dashboard/encounters/create?patient_id=${patient.id}`}
                            >
                              <Plus className='mr-1.5 h-3.5 w-3.5' />
                              New Encounter
                            </Link>
                          </Button>
                          <Button asChild variant='outline' size='sm'>
                            <Link
                              href={`/dashboard/patients/${patient.id}/edit`}
                            >
                              <Pencil className='mr-1.5 h-3.5 w-3.5' />
                              Edit Patient
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                );
              })()
            ) : (
              /* Fallback when no medical_history — show original cards */
              <>
                <div className='grid gap-4 md:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2 text-base'>
                        <Phone className='h-4 w-4' />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      {patient.phone && (
                        <div className='flex items-center gap-2'>
                          <Phone className='text-muted-foreground h-3.5 w-3.5' />
                          <span className='text-sm'>{patient.phone}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className='flex items-center gap-2'>
                          <Mail className='text-muted-foreground h-3.5 w-3.5' />
                          <span className='text-sm'>{patient.email}</span>
                        </div>
                      )}
                      {patient.address && (
                        <div className='flex items-start gap-2'>
                          <MapPin className='text-muted-foreground mt-0.5 h-3.5 w-3.5' />
                          <div className='text-sm'>
                            <div>{patient.address.street}</div>
                            <div>
                              {patient.address.city}, {patient.address.state}{' '}
                              {patient.address.zip}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2 text-base'>
                        <Shield className='h-4 w-4' />
                        Insurance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {patient.insurance ? (
                        <div className='space-y-2 text-sm'>
                          <div>
                            <span className='text-muted-foreground'>
                              Provider:{' '}
                            </span>
                            <span className='font-medium'>
                              {patient.insurance.provider}
                            </span>
                          </div>
                          <div>
                            <span className='text-muted-foreground'>
                              Policy:{' '}
                            </span>
                            <span className='font-mono'>
                              {patient.insurance.policy_number}
                            </span>
                          </div>
                          {patient.insurance.group_number && (
                            <div>
                              <span className='text-muted-foreground'>
                                Group:{' '}
                              </span>
                              <span className='font-mono'>
                                {patient.insurance.group_number}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className='text-muted-foreground text-sm'>
                          No insurance on file
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <History className='h-4 w-4' />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='flex flex-wrap gap-2'>
                      <Button asChild variant='outline' size='sm'>
                        <Link
                          href={`/dashboard/encounters/create?patient_id=${patient.id}`}
                        >
                          <Plus className='mr-1.5 h-3.5 w-3.5' />
                          New Encounter
                        </Link>
                      </Button>
                      <Button asChild variant='outline' size='sm'>
                        <Link href={`/dashboard/patients/${patient.id}/edit`}>
                          <Pencil className='mr-1.5 h-3.5 w-3.5' />
                          Edit Patient
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ═══ PRESCRIPTIONS TAB ═══ */}
          <TabsContent value='prescriptions' className='space-y-4'>
            <AddPrescriptionForm
              key={
                editingPrescription
                  ? `edit-rx-${editingPrescription.id}`
                  : 'add-rx'
              }
              patientId={patient.id}
              encounters={encounters}
              onSuccess={() => {
                refreshPrescriptions();
                setEditingPrescription(null);
              }}
              editData={editingPrescription}
              onCancelEdit={() => setEditingPrescription(null)}
            />
            <PrescriptionsTab
              prescriptions={prescriptions}
              isLoading={prescriptionsLoading}
              onEdit={(rx) => setEditingPrescription(rx)}
              onDelete={(id) => deletePrescription(id)}
            />
          </TabsContent>

          {/* ═══ LAB RESULTS TAB ═══ */}
          <TabsContent value='lab-results' className='space-y-4'>
            <AddLabResultForm
              key={
                editingLabResult ? `edit-lab-${editingLabResult.id}` : 'add-lab'
              }
              patientId={patient.id}
              encounters={encounters}
              onSuccess={() => {
                refreshLabResults();
                setEditingLabResult(null);
              }}
              editData={editingLabResult}
              onCancelEdit={() => setEditingLabResult(null)}
            />
            <LabResultsTab
              labResults={labResults}
              isLoading={labResultsQuery.isLoading}
              onEdit={(lab) => setEditingLabResult(lab)}
              onDelete={(id) => deleteLabResult(id)}
            />
          </TabsContent>

          {/* ═══ SURGERY TAB ═══ */}
          <TabsContent value='surgery' className='space-y-4'>
            <AddSurgeryForm
              key={
                editingSurgery ? `edit-surg-${editingSurgery.id}` : 'add-surg'
              }
              patientId={patient.id}
              encounters={encounters}
              onSuccess={() => {
                refreshSurgeries();
                setEditingSurgery(null);
              }}
              editData={editingSurgery}
              onCancelEdit={() => setEditingSurgery(null)}
            />
            <SurgeryTab
              surgeries={surgeries}
              isLoading={surgeryQuery.isLoading}
              onEdit={(s) => setEditingSurgery(s)}
              onDelete={(id) => deleteSurgery(id)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Helper Components for Profile Tab
   ───────────────────────────────────────────── */

function ProfileSection({
  title,
  children,
  actions
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-3'>
        <h3 className='text-sm font-semibold whitespace-nowrap'>{title}</h3>
        <Separator className='flex-1' />
        {actions && (
          <div className='flex shrink-0 items-center gap-1'>{actions}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function ProfileField({
  label,
  value
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <span className='text-muted-foreground block text-[11px]'>{label}</span>
      <span className='text-sm font-medium capitalize'>{value || '----'}</span>
    </div>
  );
}

function EditFormField({
  label,
  fieldKey,
  draft,
  onUpdate,
  type = 'text',
  options
}: {
  label: string;
  fieldKey: string;
  draft: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  type?: 'text' | 'date' | 'select';
  options?: { value: string; label: string }[];
}) {
  const val = (draft[fieldKey] as string) || '';
  if (type === 'select' && options) {
    return (
      <div className='space-y-1'>
        <Label className='text-muted-foreground text-[11px]'>{label}</Label>
        <Select value={val} onValueChange={(v) => onUpdate(fieldKey, v)}>
          <SelectTrigger className='h-8 text-xs'>
            <SelectValue placeholder={`Select ${label}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  return (
    <div className='space-y-1'>
      <Label className='text-muted-foreground text-[11px]'>{label}</Label>
      <Input
        className='h-8 text-xs'
        type={type}
        value={val}
        onChange={(e) => onUpdate(fieldKey, e.target.value)}
        placeholder={label}
      />
    </div>
  );
}

/* SectionEditButton, SectionAddButton, SectionDeleteButton, EditActions
   and VitalEditFormContent are imported from shared components above. */

function BoolField({
  label,
  value,
  text
}: {
  label: string;
  value?: boolean;
  text?: string;
}) {
  return (
    <div>
      <span className='text-muted-foreground block text-[11px]'>{label}</span>
      <span className='inline-flex items-center gap-1.5 text-sm font-medium capitalize'>
        {value ? (
          <Check className='h-3.5 w-3.5 shrink-0 text-green-500' />
        ) : (
          <X className='h-3.5 w-3.5 shrink-0 text-red-500' />
        )}
        {text || (value ? 'Yes' : 'No')}
      </span>
    </div>
  );
}

/** Review-of-systems row: green check if positive, dim dash if negative */
function ROSItem({ label, value }: { label: string; value?: boolean }) {
  return (
    <div className='flex items-center gap-2 text-sm'>
      {value ? (
        <Check className='h-3.5 w-3.5 text-red-400' />
      ) : (
        <X className='text-muted-foreground/40 h-3.5 w-3.5' />
      )}
      <span className={value ? 'font-medium' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  );
}

/** Checkbox field for boolean draft values */
function BoolCheckbox({
  label,
  fieldKey,
  draft,
  onUpdate
}: {
  label: string;
  fieldKey: string;
  draft: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
}) {
  return (
    <label className='flex cursor-pointer items-center gap-2 text-sm'>
      <Checkbox
        checked={!!draft[fieldKey]}
        onCheckedChange={(v) => onUpdate(fieldKey, !!v)}
      />
      {label}
    </label>
  );
}

/** Medical History edit card — used when editing or creating medical history */
function MedicalHistoryEditCard({
  draft,
  onUpdate,
  onSave,
  onCancel,
  saving
}: {
  draft: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  return (
    <Card>
      <CardContent className='space-y-6 pt-6'>
        {/* Chronic Conditions */}
        <div>
          <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
            Chronic Conditions
          </h4>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            <BoolCheckbox
              label='Hypertension'
              fieldKey='chronic_conditions_hypertension'
              draft={draft}
              onUpdate={onUpdate}
            />
            <BoolCheckbox
              label='Diabetes'
              fieldKey='chronic_conditions_diabetes'
              draft={draft}
              onUpdate={onUpdate}
            />
            <BoolCheckbox
              label='Asthma'
              fieldKey='chronic_conditions_asthma'
              draft={draft}
              onUpdate={onUpdate}
            />
            <BoolCheckbox
              label='Heart Disease'
              fieldKey='chronic_conditions_heart_disease'
              draft={draft}
              onUpdate={onUpdate}
            />
            <BoolCheckbox
              label='Other'
              fieldKey='chronic_conditions_other'
              draft={draft}
              onUpdate={onUpdate}
            />
          </div>
          {!!draft.chronic_conditions_other && (
            <div className='mt-2'>
              <Input
                className='h-8 text-xs'
                placeholder='Other chronic conditions...'
                value={(draft.chronic_conditions_other_detail as string) || ''}
                onChange={(e) =>
                  onUpdate('chronic_conditions_other_detail', e.target.value)
                }
              />
            </div>
          )}
        </div>

        {/* Review of Systems */}
        <div>
          <h4 className='text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase'>
            Review of Systems
          </h4>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <span className='text-muted-foreground text-xs font-medium'>
                Cardiovascular
              </span>
              <BoolCheckbox
                label='Palpitations'
                fieldKey='cardiovascular_palpitations'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Chest Pain'
                fieldKey='cardiovascular_chest_pain'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Swelling of Extremities'
                fieldKey='cardiovascular_swelling_of_extremities'
                draft={draft}
                onUpdate={onUpdate}
              />
            </div>
            <div className='space-y-2'>
              <span className='text-muted-foreground text-xs font-medium'>
                Constitutional
              </span>
              <BoolCheckbox
                label='Fever'
                fieldKey='constitutional_fever'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Chills'
                fieldKey='constitutional_chills'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Fatigue'
                fieldKey='constitutional_fatigue'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Weight Loss'
                fieldKey='constitutional_weight_loss'
                draft={draft}
                onUpdate={onUpdate}
              />
            </div>
            <div className='space-y-2'>
              <span className='text-muted-foreground text-xs font-medium'>
                Gastrointestinal
              </span>
              <BoolCheckbox
                label='Nausea'
                fieldKey='gastrointestinal_nausea'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Vomiting'
                fieldKey='gastrointestinal_vomiting'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Diarrhea'
                fieldKey='gastrointestinal_diarrhea'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Constipation'
                fieldKey='gastrointestinal_constipation'
                draft={draft}
                onUpdate={onUpdate}
              />
            </div>
            <div className='space-y-2'>
              <span className='text-muted-foreground text-xs font-medium'>
                Eyes
              </span>
              <BoolCheckbox
                label='Redness'
                fieldKey='eyes_redness'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Vision Changes'
                fieldKey='eyes_vision_changes'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Eye Pain'
                fieldKey='eyes_eye_pain'
                draft={draft}
                onUpdate={onUpdate}
              />
            </div>
            <div className='space-y-2'>
              <span className='text-muted-foreground text-xs font-medium'>
                Musculoskeletal
              </span>
              <BoolCheckbox
                label='Stiffness'
                fieldKey='musculoskeletal_stiffness'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Joint Pain'
                fieldKey='musculoskeletal_joint_pain'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Muscle Pain'
                fieldKey='musculoskeletal_muscle_pain'
                draft={draft}
                onUpdate={onUpdate}
              />
            </div>
            <div className='space-y-2'>
              <span className='text-muted-foreground text-xs font-medium'>
                Neurological
              </span>
              <BoolCheckbox
                label='Headaches'
                fieldKey='neurological_headaches'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Dizziness'
                fieldKey='neurological_dizziness'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Numbness/Tingling'
                fieldKey='neurological_numbness_tingling'
                draft={draft}
                onUpdate={onUpdate}
              />
            </div>
            <div className='space-y-2'>
              <span className='text-muted-foreground text-xs font-medium'>
                Psychiatric
              </span>
              <BoolCheckbox
                label='Depression'
                fieldKey='psychiatric_depression'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Anxiety'
                fieldKey='psychiatric_anxiety'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Sleep Disturbances'
                fieldKey='psychiatric_sleep_disturbances'
                draft={draft}
                onUpdate={onUpdate}
              />
            </div>
            <div className='space-y-2'>
              <span className='text-muted-foreground text-xs font-medium'>
                Respiratory
              </span>
              <BoolCheckbox
                label='Cough'
                fieldKey='respiratory_cough'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Shortness of Breath'
                fieldKey='respiratory_shortness_of_breath'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Wheezing'
                fieldKey='respiratory_wheezing'
                draft={draft}
                onUpdate={onUpdate}
              />
            </div>
            <div className='space-y-2'>
              <span className='text-muted-foreground text-xs font-medium'>
                Genitourinary
              </span>
              <BoolCheckbox
                label='Painful Urination'
                fieldKey='genitourinary_painful_urination'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Blood in Urine'
                fieldKey='genitourinary_blood_in_urine'
                draft={draft}
                onUpdate={onUpdate}
              />
              <BoolCheckbox
                label='Urgency/Frequency'
                fieldKey='genitourinary_urgency_frequency'
                draft={draft}
                onUpdate={onUpdate}
              />
            </div>
          </div>
        </div>

        {/* Family History */}
        <div>
          <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
            Family History
          </h4>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            <BoolCheckbox
              label='Heart Disease'
              fieldKey='family_history_heart_disease'
              draft={draft}
              onUpdate={onUpdate}
            />
            <BoolCheckbox
              label='Diabetes'
              fieldKey='family_history_diabetes'
              draft={draft}
              onUpdate={onUpdate}
            />
            <BoolCheckbox
              label='Cancer'
              fieldKey='family_history_cancer'
              draft={draft}
              onUpdate={onUpdate}
            />
            <BoolCheckbox
              label='Stroke'
              fieldKey='family_history_stroke'
              draft={draft}
              onUpdate={onUpdate}
            />
            <BoolCheckbox
              label='Hypertension'
              fieldKey='family_history_hypertension'
              draft={draft}
              onUpdate={onUpdate}
            />
            <BoolCheckbox
              label='Mental Illness'
              fieldKey='family_history_mental_illness'
              draft={draft}
              onUpdate={onUpdate}
            />
            <BoolCheckbox
              label='Other'
              fieldKey='family_history_other'
              draft={draft}
              onUpdate={onUpdate}
            />
          </div>
          {!!draft.family_history_other && (
            <div className='mt-2'>
              <Input
                className='h-8 text-xs'
                placeholder='Other family history...'
                value={(draft.family_history_other_detail as string) || ''}
                onChange={(e) =>
                  onUpdate('family_history_other_detail', e.target.value)
                }
              />
            </div>
          )}
        </div>

        {/* Text Fields */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='space-y-1'>
            <Label className='text-muted-foreground text-[11px]'>
              Current Medications
            </Label>
            <Textarea
              className='min-h-15 text-xs'
              placeholder='Comma-separated list...'
              value={(draft.current_medications as string) || ''}
              onChange={(e) => onUpdate('current_medications', e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-muted-foreground text-[11px]'>
              Past Surgeries
            </Label>
            <Textarea
              className='min-h-15 text-xs'
              placeholder='Comma-separated list...'
              value={(draft.past_surgeries as string) || ''}
              onChange={(e) => onUpdate('past_surgeries', e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-muted-foreground text-[11px]'>
              Previous Injuries
            </Label>
            <Textarea
              className='min-h-15 text-xs'
              placeholder='Comma-separated list...'
              value={(draft.previous_injuries as string) || ''}
              onChange={(e) => onUpdate('previous_injuries', e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-muted-foreground text-[11px]'>
              Vaccinations
            </Label>
            <Textarea
              className='min-h-15 text-xs'
              placeholder='Comma-separated list...'
              value={(draft.vaccinations as string) || ''}
              onChange={(e) => onUpdate('vaccinations', e.target.value)}
            />
          </div>
          <div className='space-y-1 md:col-span-2'>
            <Label className='text-muted-foreground text-[11px]'>
              Clinical Notes
            </Label>
            <Textarea
              className='min-h-20 text-xs'
              placeholder='Clinical notes...'
              value={(draft.clinical_notes as string) || ''}
              onChange={(e) => onUpdate('clinical_notes', e.target.value)}
            />
          </div>
        </div>

        <EditActions onSave={onSave} onCancel={onCancel} saving={saving} />
      </CardContent>
    </Card>
  );
}

/* VitalEditFormContent is imported from @/components/clinical/vital-edit-form-content */
