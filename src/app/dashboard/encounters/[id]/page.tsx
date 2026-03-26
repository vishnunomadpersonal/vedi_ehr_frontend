'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useEhrList, useEhrShow } from '@/hooks/use-ehr-data';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Pencil,
  Mic,
  Clock,
  User,
  Stethoscope,
  FileText,
  FolderOpen,
  RefreshCw,
  ShieldCheck,
  Activity,
  Pill,
  FlaskConical,
  Syringe,
  Loader2,
  Trash2,
  Save,
  Plus,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import type {
  Encounter,
  Transcript,
  PatientFile,
  VirusScannerHealth,
  Vital,
  Prescription,
  LabResult,
  Surgery,
  InsuranceInformation,
  LifestyleAndHabits,
  MedicalHistory
} from '@/types';
import { PatientSummary } from '@/components/clinical/patient-summary';
import { FileUploader } from '@/components/files/file-uploader';
import { FileList } from '@/components/files/file-list';
import { listFilesForEncounter, scannerHealth } from '@/lib/file-api';
import { PrescriptionsTab } from '@/components/clinical/prescriptions-tab';
import { LabResultsTab } from '@/components/clinical/lab-results-tab';
import { SurgeryTab } from '@/components/clinical/surgery-tab';
import { AddPrescriptionForm } from '@/components/clinical/add-prescription-form';
import { AddLabResultForm } from '@/components/clinical/add-lab-result-form';
import { AddSurgeryForm } from '@/components/clinical/add-surgery-form';
import {
  DocumentCategoryPicker,
  type DocumentCategory
} from '@/components/files/document-category-picker';
import { VitalEditFormContent } from '@/components/clinical/vital-edit-form-content';
import {
  SectionAddButton,
  SectionEditButton,
  SectionDeleteButton,
  EditActions
} from '@/components/clinical/section-actions';

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

export default function EncounterShowPage() {
  const params = useParams();
  const { query } = useEhrShow<Encounter>({
    resource: 'encounters',
    id: params.id as string
  });

  const { data, isLoading } = query;
  const encounter = data?.data;

  // Fetch patient data for sidebar
  const patientId =
    encounter?.patient_id && encounter.patient_id !== '0'
      ? encounter.patient_id
      : '';
  const { query: patientQuery } = useEhrShow<Record<string, unknown>>({
    resource: 'patients',
    id: patientId,
    queryOptions: { enabled: !!patientId }
  });
  const rawPatient = patientQuery.data?.data as
    | Record<string, unknown>
    | undefined;

  // ── Fetch sub-resources for patient sidebar (insurance, lifestyle, medical history) ──
  const [insuranceInfo, setInsuranceInfo] =
    useState<InsuranceInformation | null>(null);
  const [lifestyleHabits, setLifestyleHabits] =
    useState<LifestyleAndHabits | null>(null);
  const [medicalHistoryData, setMedicalHistoryData] =
    useState<MedicalHistory | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchPatientSubResources = useCallback(async (pid: string) => {
    const [ins, lh, mh] = await Promise.all([
      apiGetEncounter<InsuranceInformation>(`/insurance/patient/${pid}/latest`),
      apiGetEncounter<LifestyleAndHabits>(`/lifestyle/patient/${pid}/latest`),
      apiGetEncounter<MedicalHistory>(`/medical-history/patient/${pid}/latest`)
    ]);
    setInsuranceInfo(ins);
    setLifestyleHabits(lh);
    setMedicalHistoryData(mh);
  }, []);

  useEffect(() => {
    if (rawPatient?.id) fetchPatientSubResources(String(rawPatient.id));
  }, [rawPatient?.id, fetchPatientSubResources]);

  // Enrich patient with sub-resource data so PatientSummary renders all sections
  const patient = useMemo(() => {
    if (!rawPatient) return null;
    return {
      ...rawPatient,
      insurance_information:
        insuranceInfo ?? (rawPatient as any).insurance_information,
      lifestyle_and_habits:
        lifestyleHabits ?? (rawPatient as any).lifestyle_and_habits,
      medical_history: medicalHistoryData ?? (rawPatient as any).medical_history
    };
  }, [rawPatient, insuranceInfo, lifestyleHabits, medicalHistoryData]);

  // Fetch transcript for this encounter
  const { result: transcriptResult } = useEhrList<Transcript>({
    resource: 'transcripts',
    filters: [{ field: 'encounter_id', operator: 'eq', value: params.id }],
    pagination: { pageSize: 1 }
  });
  const transcript = (transcriptResult?.data?.[0] ||
    null) as unknown as Transcript | null;

  // ── Clinical sub-resources scoped to this encounter ──
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

  async function apiGetEncounter<T>(url: string): Promise<T | null> {
    try {
      const res = await fetch(`${API_URL}/v1${url}`);
      if (!res.ok) return null;
      const json = await res.json();
      return (json.data ?? json) as T;
    } catch {
      return null;
    }
  }

  // Vitals
  const [encounterVitals, setEncounterVitals] = useState<Vital[]>([]);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [editingVitalId, setEditingVitalId] = useState<null | number | 'new'>(
    null
  );
  const [vitalDraft, setVitalDraft] = useState<Record<string, unknown>>({});
  const [savingVital, setSavingVital] = useState(false);

  // Prescriptions (with medications)
  const [encounterPrescriptions, setEncounterPrescriptions] = useState<
    Prescription[]
  >([]);
  const [rxLoading, setRxLoading] = useState(false);

  // Lab Results
  const [encounterLabResults, setEncounterLabResults] = useState<LabResult[]>(
    []
  );
  const [labLoading, setLabLoading] = useState(false);

  // Surgery
  const [encounterSurgeries, setEncounterSurgeries] = useState<Surgery[]>([]);
  const [surgeryLoading, setSurgeryLoading] = useState(false);

  useEffect(() => {
    if (!encounter?.id) return;
    const eid = encounter.id;

    setVitalsLoading(true);
    apiGetEncounter<Vital[]>(`/vitals/encounter/${eid}`)
      .then((d) => setEncounterVitals(d || []))
      .finally(() => setVitalsLoading(false));

    setRxLoading(true);
    apiGetEncounter<Prescription[]>(
      `/prescriptions/encounter/${eid}/with-medications`
    )
      .then((d) => setEncounterPrescriptions(d || []))
      .finally(() => setRxLoading(false));

    setLabLoading(true);
    apiGetEncounter<LabResult[]>(`/lab-results/encounter/${eid}`)
      .then((d) => setEncounterLabResults(d || []))
      .finally(() => setLabLoading(false));

    setSurgeryLoading(true);
    apiGetEncounter<Surgery[]>(`/surgery/encounter/${eid}`)
      .then((d) => setEncounterSurgeries(d || []))
      .finally(() => setSurgeryLoading(false));
  }, [encounter?.id]);

  // Refresh helpers for after creating new records
  const refreshVitals = () => {
    if (!encounter?.id) return;
    setVitalsLoading(true);
    apiGetEncounter<Vital[]>(`/vitals/encounter/${encounter.id}`)
      .then((d) => setEncounterVitals(d || []))
      .finally(() => setVitalsLoading(false));
  };
  const refreshPrescriptions = () => {
    if (!encounter?.id) return;
    setRxLoading(true);
    apiGetEncounter<Prescription[]>(
      `/prescriptions/encounter/${encounter.id}/with-medications`
    )
      .then((d) => setEncounterPrescriptions(d || []))
      .finally(() => setRxLoading(false));
  };
  const refreshLabResults = () => {
    if (!encounter?.id) return;
    setLabLoading(true);
    apiGetEncounter<LabResult[]>(`/lab-results/encounter/${encounter.id}`)
      .then((d) => setEncounterLabResults(d || []))
      .finally(() => setLabLoading(false));
  };
  const refreshSurgeries = () => {
    if (!encounter?.id) return;
    setSurgeryLoading(true);
    apiGetEncounter<Surgery[]>(`/surgery/encounter/${encounter.id}`)
      .then((d) => setEncounterSurgeries(d || []))
      .finally(() => setSurgeryLoading(false));
  };

  // ── Clinical tab inline-edit state (prescriptions, lab results, surgery) ──
  const [editingPrescription, setEditingPrescription] =
    useState<Prescription | null>(null);
  const [editingLabResult, setEditingLabResult] = useState<LabResult | null>(
    null
  );
  const [editingSurgery, setEditingSurgery] = useState<Surgery | null>(null);

  const deletePrescription = async (id: string | number) => {
    if (!confirm('Delete this prescription?')) return;
    try {
      const res = await fetch(`${API_URL}/v1/prescriptions/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Prescription deleted');
      refreshPrescriptions();
    } catch {
      toast.error('Failed to delete prescription');
    }
  };

  const deleteLabResult = async (id: string | number) => {
    if (!confirm('Delete this lab result?')) return;
    try {
      const res = await fetch(`${API_URL}/v1/lab-results/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Lab result deleted');
      refreshLabResults();
    } catch {
      toast.error('Failed to delete lab result');
    }
  };

  const deleteSurgery = async (id: string | number) => {
    if (!confirm('Delete this procedure?')) return;
    try {
      const res = await fetch(`${API_URL}/v1/surgery/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Procedure deleted');
      refreshSurgeries();
    } catch {
      toast.error('Failed to delete procedure');
    }
  };

  // ── Vitals CRUD ──
  const saveVital = async () => {
    if (!encounter) return;
    setSavingVital(true);
    try {
      const body = {
        ...vitalDraft,
        patient_id: encounter.patient_id,
        encounter_id: encounter.id
      };
      const API = API_URL;
      if (editingVitalId === 'new') {
        const res = await fetch(`${API}/v1/vitals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Failed to create vital');
      } else {
        const res = await fetch(`${API}/v1/vitals/${editingVitalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Failed to update vital');
      }
      refreshVitals();
      setEditingVitalId(null);
      setVitalDraft({});
    } catch (e) {
      console.error('Save vital failed:', e);
    } finally {
      setSavingVital(false);
    }
  };

  const deleteVital = async (vitalId: number | string) => {
    if (!confirm('Delete this vital record?')) return;
    try {
      const res = await fetch(`${API_URL}/v1/vitals/${vitalId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete vital');
      refreshVitals();
    } catch (e) {
      console.error('Delete vital failed:', e);
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-[calc(100vh-8rem)] gap-6'>
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

  if (!encounter) {
    return (
      <div className='py-12 text-center'>
        <p className='text-muted-foreground'>Encounter not found</p>
        <Button asChild variant='link' className='mt-2'>
          <Link href='/dashboard/encounters'>Back to encounters</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='flex h-[calc(100vh-8rem)] gap-4 p-4 md:px-6'>
      {/* Left: Patient Summary Sidebar — collapsible */}
      {sidebarOpen && patient && (
        <aside className='bg-card w-72 shrink-0 overflow-hidden rounded-lg border'>
          <PatientSummary patient={patient as any} />
        </aside>
      )}

      {/* Right: Encounter Content */}
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
              <Link href='/dashboard/encounters'>
                <ArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-xl font-bold tracking-tight'>
                  Encounter: {encounter.patient_name}
                </h1>
                <Badge
                  variant={statusColors[encounter.status] || 'secondary'}
                  className='text-[10px]'
                >
                  {encounter.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className='text-muted-foreground text-sm capitalize'>
                {encounter.encounter_type.replace(/_/g, ' ')} &middot;{' '}
                {encounter.scheduled_at
                  ? new Date(encounter.scheduled_at).toLocaleDateString()
                  : 'Not scheduled'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {(encounter.status === 'in_progress' ||
              encounter.status === 'scheduled') && (
              <Button asChild variant='outline' size='sm'>
                <Link href={`/dashboard/sessions/${encounter.id}/record`}>
                  <Mic className='mr-1 h-3 w-3 text-red-500' />
                  Record
                </Link>
              </Button>
            )}
            <Button asChild variant='outline' size='sm'>
              <Link href={`/dashboard/encounters/${encounter.id}/chart`}>
                <FileText className='mr-1 h-3 w-3' />
                Chart
              </Link>
            </Button>
            <Button asChild size='sm'>
              <Link href={`/dashboard/encounters/${encounter.id}/edit`}>
                <Pencil className='mr-1 h-3 w-3' />
                Edit
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue='details'>
          <TabsList>
            <TabsTrigger value='details'>Details</TabsTrigger>
            <TabsTrigger value='notes'>Notes & Summary</TabsTrigger>
            <TabsTrigger value='vitals'>
              <Activity className='mr-1 h-3.5 w-3.5' />
              Vitals
              {encounterVitals.length > 0 && (
                <Badge
                  variant='secondary'
                  className='ml-1.5 h-4 px-1.5 text-[10px]'
                >
                  {encounterVitals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='prescriptions'>
              <Pill className='mr-1 h-3.5 w-3.5' />
              Prescriptions
              {encounterPrescriptions.length > 0 && (
                <Badge
                  variant='secondary'
                  className='ml-1.5 h-4 px-1.5 text-[10px]'
                >
                  {encounterPrescriptions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='lab-results'>
              <FlaskConical className='mr-1 h-3.5 w-3.5' />
              Lab Results
              {encounterLabResults.length > 0 && (
                <Badge
                  variant='secondary'
                  className='ml-1.5 h-4 px-1.5 text-[10px]'
                >
                  {encounterLabResults.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='surgery'>
              <Syringe className='mr-1 h-3.5 w-3.5' />
              Surgery
              {encounterSurgeries.length > 0 && (
                <Badge
                  variant='secondary'
                  className='ml-1.5 h-4 px-1.5 text-[10px]'
                >
                  {encounterSurgeries.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='transcript'>Transcript</TabsTrigger>
            <TabsTrigger value='files'>
              <FolderOpen className='mr-1 h-3.5 w-3.5' />
              Files
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value='details' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <User className='h-4 w-4' />
                    Patient
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-2 text-sm'>
                  <div>
                    <span className='text-muted-foreground'>Name: </span>
                    <Link
                      href={`/dashboard/patients/${encounter.patient_id}`}
                      className='text-primary font-medium hover:underline'
                    >
                      {encounter.patient_name}
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Stethoscope className='h-4 w-4' />
                    Provider
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-2 text-sm'>
                  <div>
                    <span className='text-muted-foreground'>Name: </span>
                    <span className='font-medium'>
                      {encounter.provider_name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Visit Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
                  {encounter.encounter_number && (
                    <div>
                      <span className='text-muted-foreground block'>
                        Encounter #
                      </span>
                      <span className='font-mono text-xs font-medium'>
                        {encounter.encounter_number}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className='text-muted-foreground block'>Type</span>
                    <span className='font-medium capitalize'>
                      {encounter.encounter_type.replace('_', ' ')}
                    </span>
                  </div>
                  {encounter.priority_display && (
                    <div>
                      <span className='text-muted-foreground block'>
                        Priority
                      </span>
                      <span className='font-medium'>
                        {encounter.priority_display}
                      </span>
                    </div>
                  )}
                  {encounter.service_type_display && (
                    <div>
                      <span className='text-muted-foreground block'>
                        Service
                      </span>
                      <span className='font-medium'>
                        {encounter.service_type_display}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className='text-muted-foreground block'>
                      Scheduled
                    </span>
                    <span className='font-medium'>
                      {encounter.scheduled_at
                        ? new Date(encounter.scheduled_at).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className='text-muted-foreground block'>Started</span>
                    <span className='font-medium'>
                      {encounter.started_at
                        ? new Date(encounter.started_at).toLocaleTimeString()
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className='text-muted-foreground block'>Ended</span>
                    <span className='font-medium'>
                      {encounter.ended_at
                        ? new Date(encounter.ended_at).toLocaleTimeString()
                        : '—'}
                    </span>
                  </div>
                  {encounter.length_value && (
                    <div>
                      <span className='text-muted-foreground block'>
                        Duration
                      </span>
                      <span className='font-medium'>
                        {encounter.length_value}{' '}
                        {encounter.length_unit || 'min'}
                      </span>
                    </div>
                  )}
                </div>

                {encounter.chief_complaint && (
                  <>
                    <Separator className='my-4' />
                    <div>
                      <span className='text-muted-foreground mb-1 block text-sm'>
                        Chief Complaint
                      </span>
                      <p className='text-sm font-medium'>
                        {encounter.chief_complaint}
                      </p>
                    </div>
                  </>
                )}

                {encounter.reason_display &&
                  encounter.reason_display !== encounter.chief_complaint && (
                    <>
                      <Separator className='my-4' />
                      <div>
                        <span className='text-muted-foreground mb-1 block text-sm'>
                          Reason for Visit
                        </span>
                        <p className='text-sm'>{encounter.reason_display}</p>
                      </div>
                    </>
                  )}

                {encounter.diagnosis_codes &&
                  encounter.diagnosis_codes.length > 0 && (
                    <>
                      <Separator className='my-4' />
                      <div>
                        <span className='text-muted-foreground mb-1 block text-sm'>
                          Diagnosis Codes
                        </span>
                        <div className='flex flex-wrap gap-2'>
                          {encounter.diagnosis_codes.map((code) => (
                            <Badge
                              key={code}
                              variant='outline'
                              className='font-mono'
                            >
                              {code}
                            </Badge>
                          ))}
                        </div>
                        {encounter.diagnosis &&
                          encounter.diagnosis.length > 0 && (
                            <div className='mt-2 space-y-1'>
                              {encounter.diagnosis.map((dx, i) => (
                                <div
                                  key={i}
                                  className='text-muted-foreground text-xs'
                                >
                                  <span className='font-mono'>{dx.code}</span> —{' '}
                                  {dx.display}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes & Summary Tab */}
          <TabsContent value='notes' className='space-y-4'>
            {encounter.subjective_notes ||
            encounter.objective_notes ||
            encounter.assessment_notes ||
            encounter.plan_notes ? (
              <>
                {encounter.subjective_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-base'>Subjective</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm whitespace-pre-wrap'>
                        {encounter.subjective_notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {encounter.objective_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-base'>Objective</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm whitespace-pre-wrap'>
                        {encounter.objective_notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {encounter.assessment_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-base'>Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm whitespace-pre-wrap'>
                        {encounter.assessment_notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {encounter.plan_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-base'>Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm whitespace-pre-wrap'>
                        {encounter.plan_notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : encounter.notes ? (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Clinical Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm whitespace-pre-wrap'>
                    {encounter.notes}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className='py-8 text-center'>
                  <FileText className='text-muted-foreground/50 mx-auto mb-2 h-8 w-8' />
                  <p className='text-muted-foreground text-sm'>
                    No clinical notes recorded yet.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {encounter.summary ? (
                  <p className='text-sm whitespace-pre-wrap'>
                    {encounter.summary}
                  </p>
                ) : (
                  <div className='py-4 text-center'>
                    <FileText className='text-muted-foreground/50 mx-auto mb-2 h-8 w-8' />
                    <p className='text-muted-foreground text-sm'>
                      No summary generated yet. Record a session to generate
                      one.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ VITALS TAB ═══ */}
          <TabsContent value='vitals' className='space-y-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Activity className='h-4 w-4' />
                  Vital Signs History
                </CardTitle>
                <SectionAddButton
                  onClick={() => {
                    setEditingVitalId('new');
                    setVitalDraft({
                      date_recorded: new Date().toISOString().split('T')[0]
                    });
                  }}
                />
              </CardHeader>
              <CardContent>
                {/* ── New vital form ── */}
                {editingVitalId === 'new' && (
                  <div className='border-primary/30 bg-primary/2 mb-4 rounded-lg border border-dashed p-4'>
                    <VitalEditFormContent
                      draft={vitalDraft}
                      onUpdate={(k, v) =>
                        setVitalDraft((prev) => ({ ...prev, [k]: v }))
                      }
                    />
                    {/* Vitals Documents */}
                    <div className='border-border/40 mt-3 space-y-2 border-t pt-3'>
                      <p className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase'>
                        <FolderOpen className='h-3.5 w-3.5' />
                        Vitals Documents
                      </p>
                      <FileUploader
                        patientId={String(encounter.patient_id)}
                        encounterId={String(encounter.id)}
                        detail={{
                          upload_source: 'vitals',
                          document_type: 'vitals_record'
                        }}
                        onUploadComplete={() => {}}
                      />
                    </div>
                    <EditActions
                      onSave={saveVital}
                      onCancel={() => {
                        setEditingVitalId(null);
                        setVitalDraft({});
                      }}
                      saving={savingVital}
                    />
                  </div>
                )}

                {/* ── Loading ── */}
                {vitalsLoading && (
                  <div className='space-y-3'>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className='bg-muted h-12 animate-pulse rounded'
                      />
                    ))}
                  </div>
                )}

                {/* ── Empty state ── */}
                {!vitalsLoading &&
                  encounterVitals.length === 0 &&
                  editingVitalId !== 'new' && (
                    <div className='py-8 text-center'>
                      <Activity className='text-muted-foreground/30 mx-auto mb-2 h-10 w-10' />
                      <p className='text-muted-foreground text-sm'>
                        No vitals recorded for this encounter.
                      </p>
                    </div>
                  )}

                {/* ── Vitals cards ── */}
                {!vitalsLoading && encounterVitals.length > 0 && (
                  <div className='space-y-4'>
                    {encounterVitals.map((v) => {
                      const vid = v.vitals_id || v.id;
                      const isEditing = editingVitalId === vid;

                      if (isEditing) {
                        return (
                          <Card key={vid} className='border border-blue-200'>
                            <CardContent className='pt-4'>
                              <VitalEditFormContent
                                draft={vitalDraft}
                                onUpdate={(k, val) =>
                                  setVitalDraft((prev) => ({
                                    ...prev,
                                    [k]: val
                                  }))
                                }
                              />
                              {/* Vitals Documents */}
                              <div className='border-border/40 mt-3 space-y-2 border-t pt-3'>
                                <p className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase'>
                                  <FolderOpen className='h-3.5 w-3.5' />
                                  Vitals Documents
                                </p>
                                <FileUploader
                                  patientId={String(encounter.patient_id)}
                                  encounterId={String(encounter.id)}
                                  detail={{
                                    upload_source: 'vitals',
                                    document_type: 'vitals_record'
                                  }}
                                  onUploadComplete={() => {}}
                                />
                              </div>
                              <EditActions
                                onSave={saveVital}
                                onCancel={() => {
                                  setEditingVitalId(null);
                                  setVitalDraft({});
                                }}
                                saving={savingVital}
                              />
                            </CardContent>
                          </Card>
                        );
                      }

                      return (
                        <Card key={vid}>
                          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-muted-foreground flex items-center gap-2 text-sm'>
                              <Clock className='h-3.5 w-3.5' />
                              {v.recorded_at
                                ? new Date(v.recorded_at).toLocaleString()
                                : v.date_recorded
                                  ? new Date(v.date_recorded).toLocaleString()
                                  : '—'}
                              {v.recorded_by && (
                                <span className='ml-2'>by {v.recorded_by}</span>
                              )}
                            </CardTitle>
                            <div className='flex items-center gap-0.5'>
                              <SectionEditButton
                                onClick={() => {
                                  setEditingVitalId(vid as number);
                                  setVitalDraft(
                                    Object.fromEntries(
                                      Object.entries(v).filter(
                                        ([, val]) => val != null
                                      )
                                    )
                                  );
                                }}
                              />
                              <SectionDeleteButton
                                onClick={() => deleteVital(vid as number)}
                              />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <EncounterVitalDetail v={v} />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ PRESCRIPTIONS TAB ═══ */}
          <TabsContent value='prescriptions' className='space-y-4'>
            <AddPrescriptionForm
              key={
                editingPrescription
                  ? `edit-rx-${editingPrescription.id}`
                  : 'add-rx'
              }
              patientId={String(encounter.patient_id)}
              encounterId={String(encounter.id)}
              onSuccess={() => {
                refreshPrescriptions();
                setEditingPrescription(null);
              }}
              editData={editingPrescription}
              onCancelEdit={() => setEditingPrescription(null)}
            >
              {/* Prescription Documents — embedded in add/edit form card */}
              <div className='border-border/40 space-y-2 border-t pt-2'>
                <p className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase'>
                  <FolderOpen className='h-3.5 w-3.5' />
                  Prescription Documents
                </p>
                <FileUploader
                  patientId={String(encounter.patient_id)}
                  encounterId={String(encounter.id)}
                  detail={{
                    upload_source: 'prescriptions',
                    document_type: 'prescription'
                  }}
                  onUploadComplete={() => {}}
                />
              </div>
            </AddPrescriptionForm>
            <PrescriptionsTab
              prescriptions={encounterPrescriptions}
              isLoading={rxLoading}
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
              patientId={String(encounter.patient_id)}
              encounterId={String(encounter.id)}
              onSuccess={() => {
                refreshLabResults();
                setEditingLabResult(null);
              }}
              editData={editingLabResult}
              onCancelEdit={() => setEditingLabResult(null)}
            >
              {/* Lab Documents — embedded in add/edit form card */}
              <div className='border-border/40 space-y-2 border-t pt-2'>
                <p className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase'>
                  <FolderOpen className='h-3.5 w-3.5' />
                  Lab Reports &amp; Documents
                </p>
                <FileUploader
                  patientId={String(encounter.patient_id)}
                  encounterId={String(encounter.id)}
                  detail={{
                    upload_source: 'lab_results',
                    document_type: 'lab_report'
                  }}
                  onUploadComplete={() => {}}
                />
              </div>
            </AddLabResultForm>
            <LabResultsTab
              labResults={encounterLabResults}
              isLoading={labLoading}
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
              patientId={String(encounter.patient_id)}
              encounterId={String(encounter.id)}
              onSuccess={() => {
                refreshSurgeries();
                setEditingSurgery(null);
              }}
              editData={editingSurgery}
              onCancelEdit={() => setEditingSurgery(null)}
            >
              {/* Surgery Documents — embedded in add/edit form card */}
              <div className='border-border/40 space-y-2 border-t pt-2'>
                <p className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase'>
                  <FolderOpen className='h-3.5 w-3.5' />
                  Procedure Documents
                </p>
                <FileUploader
                  patientId={String(encounter.patient_id)}
                  encounterId={String(encounter.id)}
                  detail={{
                    upload_source: 'surgery',
                    document_type: 'surgical_report'
                  }}
                  onUploadComplete={() => {}}
                />
              </div>
            </AddSurgeryForm>
            <SurgeryTab
              surgeries={encounterSurgeries}
              isLoading={surgeryLoading}
              onEdit={(s) => setEditingSurgery(s)}
              onDelete={(id) => deleteSurgery(id)}
            />
          </TabsContent>

          {/* Transcript Tab */}
          <TabsContent value='transcript'>
            {transcript &&
            transcript.segments &&
            transcript.segments.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center justify-between text-base'>
                    <span className='flex items-center gap-2'>
                      <Mic className='h-4 w-4' />
                      Session Transcript
                    </span>
                    <div className='flex items-center gap-2'>
                      {transcript.duration_seconds && (
                        <Badge variant='outline' className='text-xs'>
                          <Clock className='mr-1 h-3 w-3' />
                          {Math.floor(transcript.duration_seconds / 60)}m{' '}
                          {Math.round(transcript.duration_seconds % 60)}s
                        </Badge>
                      )}
                      <Badge variant='secondary' className='text-xs'>
                        {transcript.segments.length} segments
                      </Badge>
                      {transcript.word_count && (
                        <Badge variant='secondary' className='text-xs'>
                          {transcript.word_count} words
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className='h-[calc(100vh-22rem)]'>
                    <div className='space-y-3'>
                      {transcript.segments.map((seg, idx) => (
                        <div
                          key={seg.id || idx}
                          className={`flex gap-3 ${
                            seg.speaker === 'doctor' ? '' : 'flex-row-reverse'
                          }`}
                        >
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              seg.speaker === 'doctor'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {seg.speaker === 'doctor' ? 'Dr' : 'Pt'}
                          </div>
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                              seg.speaker === 'doctor'
                                ? 'bg-primary/5 border'
                                : 'bg-muted'
                            }`}
                          >
                            <p>{seg.text}</p>
                            <p className='text-muted-foreground mt-1 text-[10px]'>
                              {seg.start_time.toFixed(1)}s —{' '}
                              {seg.end_time.toFixed(1)}s
                              {seg.confidence < 0.95 && (
                                <span className='ml-2 text-amber-500'>
                                  ⚠ {(seg.confidence * 100).toFixed(0)}%
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Full Text fallback */}
                  {transcript.full_text && (
                    <div className='mt-4 border-t pt-4'>
                      <p className='text-muted-foreground mb-1 text-xs font-medium'>
                        Full Text
                      </p>
                      <p className='text-muted-foreground text-sm whitespace-pre-wrap'>
                        {transcript.full_text}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : transcript && transcript.full_text ? (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Mic className='h-4 w-4' />
                    Session Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm whitespace-pre-wrap'>
                    {transcript.full_text}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className='py-8 text-center'>
                  <Mic className='text-muted-foreground/50 mx-auto mb-2 h-8 w-8' />
                  <p className='text-muted-foreground text-sm'>
                    No transcript available. Start a recording session to create
                    one.
                  </p>
                  {(encounter.status === 'in_progress' ||
                    encounter.status === 'scheduled') && (
                    <Button asChild variant='outline' className='mt-3'>
                      <Link href={`/dashboard/sessions/${encounter.id}/record`}>
                        <Mic className='mr-2 h-4 w-4' />
                        Start Recording
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value='files' className='space-y-4'>
            <EncounterFilesSection
              encounterId={String(encounter.id)}
              patientId={String(encounter.patient_id)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ── Encounter Files sub-component (keeps main component clean) ──────── */
function EncounterFilesSection({
  encounterId,
  patientId
}: {
  encounterId: string;
  patientId: string;
}) {
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanner, setScanner] = useState<VirusScannerHealth | null>(null);
  const [docCategoryCode, setDocCategoryCode] = useState<string>('');
  const [docCategoryObj, setDocCategoryObj] = useState<DocumentCategory | null>(
    null
  );

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFilesForEncounter(encounterId);
      setFiles(data);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [encounterId]);

  useEffect(() => {
    fetchFiles();
    scannerHealth()
      .then(setScanner)
      .catch(() => {});
  }, [fetchFiles]);

  return (
    <>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <FolderOpen className='h-4 w-4' />
            Encounter Files
            <Badge variant='secondary' className='ml-1 text-xs'>
              {files.length}
            </Badge>
            {scanner?.enabled && (
              <Badge variant='outline' className='gap-1 text-[10px]'>
                <ShieldCheck className='h-3 w-3' />
                ClamAV {scanner.status === 'ok' ? 'Active' : scanner.status}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={fetchFiles}
          >
            <RefreshCw className='h-3.5 w-3.5' />
          </Button>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='space-y-1.5'>
            <label className='text-muted-foreground text-xs font-medium'>
              Document Category
            </label>
            <DocumentCategoryPicker
              value={docCategoryCode}
              onValueChange={(code, cat) => {
                setDocCategoryCode(code);
                setDocCategoryObj(cat);
              }}
              placeholder='Select category for uploaded files'
            />
          </div>
          <Separator />
          <FileUploader
            patientId={patientId}
            encounterId={encounterId}
            detail={{
              upload_source: 'encounter_files',
              ...(docCategoryCode ? { document_type: docCategoryCode } : {}),
              ...(docCategoryObj?.id ? { category_id: docCategoryObj.id } : {})
            }}
            onUploadComplete={(file) => setFiles((prev) => [file, ...prev])}
          />
        </CardContent>
      </Card>

      <FileList
        files={files}
        loading={loading}
        onFileDeleted={(id) =>
          setFiles((prev) => prev.filter((f) => f.id !== id))
        }
        onFileRetried={(updated) =>
          setFiles((prev) =>
            prev.map((f) => (f.id === updated.id ? updated : f))
          )
        }
      />
    </>
  );
}

/* ── Encounter Vital detail display (matches patient page's VitalDetail) ────── */

function EncounterVitalDetail({ v }: { v: Vital }) {
  const bpSys = v.blood_pressure_sys ?? (v as any).systolic_bp;
  const bpDia = v.blood_pressure_dia ?? (v as any).diastolic_bp;
  const temp = v.body_temperature ?? v.temperature;
  const spo2 = v.SpO2 ?? v.oxygen_saturation;
  const bmiV = v.body_mass_index ?? v.bmi;
  const pain = v.pain_scale ?? v.pain_level;

  const bpCls = (() => {
    const sys = bpSys ?? 0,
      dia = bpDia ?? 0;
    if (!sys && !dia) return '';
    if (sys >= 140 || dia >= 90) return 'text-red-500 font-semibold';
    if (sys >= 130 || dia >= 85) return 'text-orange-500 font-semibold';
    return 'text-green-600 font-semibold';
  })();
  const spo2Cls = (spo2 ?? 100) < 95 ? 'text-red-500 font-semibold' : '';
  const bmiCls = (bmiV ?? 0) >= 30 ? 'text-orange-500 font-semibold' : '';
  const painCls =
    (pain ?? 0) >= 7
      ? 'text-red-500 font-semibold'
      : (pain ?? 0) >= 4
        ? 'text-orange-500'
        : '';
  const glucCls =
    (v.blood_glucose_levels ?? 0) >= 126 ? 'text-red-500 font-semibold' : '';

  const Stat = ({
    label,
    value,
    cls
  }: {
    label: string;
    value: string;
    cls?: string;
  }) => (
    <div>
      <span className='text-muted-foreground block text-xs'>{label}</span>
      <span className={`font-medium ${cls || ''}`}>{value}</span>
    </div>
  );

  return (
    <div className='space-y-5 text-sm'>
      {/* Vital Signs */}
      <div>
        <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
          Vital Signs
        </h4>
        <div className='grid grid-cols-3 gap-x-6 gap-y-3 sm:grid-cols-5 md:grid-cols-6'>
          <Stat
            label='BP'
            value={bpSys && bpDia ? `${bpSys}/${bpDia}` : '—'}
            cls={bpCls}
          />
          <Stat
            label='HR'
            value={v.heart_rate != null ? String(v.heart_rate) : '—'}
          />
          <Stat label='Temp' value={temp ? `${temp}°F` : '—'} />
          <Stat
            label='SpO2'
            value={spo2 != null ? `${spo2}%` : '—'}
            cls={spo2Cls}
          />
          <Stat
            label='RR'
            value={
              v.respiratory_rate != null ? String(v.respiratory_rate) : '—'
            }
          />
          <Stat label='Weight' value={v.weight ? `${v.weight} lbs` : '—'} />
          <Stat label='Height' value={v.height ? `${v.height} in` : '—'} />
          <Stat
            label='BMI'
            value={bmiV != null ? Number(bmiV).toFixed(1) : '—'}
            cls={bmiCls}
          />
          <Stat
            label='Pain'
            value={pain != null ? `${pain}/10` : '—'}
            cls={painCls}
          />
          <Stat
            label='Glucose'
            value={
              v.blood_glucose_levels != null
                ? String(v.blood_glucose_levels)
                : '—'
            }
            cls={glucCls}
          />
        </div>
      </div>
      {/* Body Composition */}
      <div>
        <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
          Body Composition
        </h4>
        <div className='grid grid-cols-3 gap-x-6 gap-y-3 sm:grid-cols-4 md:grid-cols-6'>
          <Stat label='Body Fat' value={v.fat != null ? `${v.fat}%` : '—'} />
          <Stat label='Water' value={v.water != null ? `${v.water}%` : '—'} />
          <Stat
            label='Muscle Mass'
            value={v.muscle_mass != null ? `${v.muscle_mass} lbs` : '—'}
          />
          <Stat
            label='Bone Mass'
            value={v.bone_mass != null ? `${v.bone_mass} lbs` : '—'}
          />
          <Stat
            label='Protein'
            value={v.protein != null ? `${v.protein}%` : '—'}
          />
          <Stat label='Body Type' value={v.body_type || '—'} />
          <Stat
            label='Metabolic Age'
            value={v.metabolic_age != null ? String(v.metabolic_age) : '—'}
          />
          <Stat
            label='Basal Met.'
            value={v.basal_metabolism ? `${v.basal_metabolism} kcal` : '—'}
          />
          <Stat
            label='Visceral Fat'
            value={v.visceral_fat != null ? String(v.visceral_fat) : '—'}
          />
          <Stat
            label='Impedance'
            value={v.impedance ? `${v.impedance} Ω` : '—'}
          />
          <Stat
            label='Waist'
            value={v.waist_circumference ? `${v.waist_circumference} in` : '—'}
          />
          <Stat
            label='Peak Flow'
            value={
              v.peak_flow_measurement ? `${v.peak_flow_measurement} L/min` : '—'
            }
          />
        </div>
      </div>
      {/* Additional */}
      {(v.vision_test_result ||
        v.hearing_test_result ||
        v.ecg_result ||
        v.note) && (
        <div>
          <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
            Additional
          </h4>
          <div className='grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4'>
            {v.vision_test_result && (
              <Stat label='Vision Test' value={v.vision_test_result} />
            )}
            {v.hearing_test_result && (
              <Stat label='Hearing Test' value={v.hearing_test_result} />
            )}
            {v.ecg_result && <Stat label='ECG' value={v.ecg_result} />}
            {v.note && <Stat label='Notes' value={v.note} />}
          </div>
        </div>
      )}
    </div>
  );
}
