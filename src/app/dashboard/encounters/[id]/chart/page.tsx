'use client';

import { useEhrShow, useEhrList, useEhrUpdate } from '@/hooks/use-ehr-data';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Pencil,
  Mic,
  CheckCircle2,
  Lock,
  Clock,
  User,
  Stethoscope,
  FileText,
  ClipboardList,
  AlertTriangle,
  Save,
  Sparkles,
  Loader2
} from 'lucide-react';
import type { Encounter, ClinicalImpression, Transcript } from '@/types';
import { PatientSummary } from '@/components/clinical/patient-summary';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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

export default function EncounterChartPage() {
  const params = useParams();
  const encounterId = params.id as string;
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [generatingSoap, setGeneratingSoap] = useState(false);
  const [editingSOAP, setEditingSOAP] = useState(false);

  // Editable SOAP state
  const [soapDraft, setSoapDraft] = useState({
    chief_complaint: '',
    subjective_notes: '',
    objective_notes: '',
    assessment_notes: '',
    plan_notes: ''
  });
  const [savingSOAP, setSavingSOAP] = useState(false);

  // Fetch encounter
  const { query } = useEhrShow<Encounter>({
    resource: 'encounters',
    id: encounterId
  });
  const { data, isLoading } = query;
  const encounter = data?.data;

  // Fetch patient data for sidebar
  const { query: patientQuery } = useEhrShow<Record<string, unknown>>({
    resource: 'patients',
    id: encounter?.patient_id || '',
    queryOptions: { enabled: !!encounter?.patient_id }
  });
  const patient = patientQuery.data?.data as
    | Record<string, unknown>
    | undefined;

  // Fetch clinical impression
  const { result: ciResult } = useEhrList<ClinicalImpression>({
    resource: 'clinical_impressions',
    pagination: { currentPage: 1, pageSize: 1 },
    filters: [{ field: 'encounter_id', operator: 'eq', value: encounterId }],
    enabled: !!encounterId
  });
  const clinicalImpression = (ciResult?.data?.[0] ||
    null) as ClinicalImpression | null;

  // Fetch transcript
  const { result: transcriptResult, query: transcriptQuery } =
    useEhrList<Transcript>({
      resource: 'transcripts',
      pagination: { currentPage: 1, pageSize: 1 },
      filters: [{ field: 'encounter_id', operator: 'eq', value: encounterId }],
      enabled: !!encounterId
    });
  const transcript = (transcriptResult?.data?.[0] || null) as Transcript | null;

  // Update mutation for sign/lock and SOAP saves
  const { mutate: updateEncounter } = useEhrUpdate();

  // Sync SOAP draft from encounter data
  useEffect(() => {
    if (encounter && !editingSOAP) {
      setSoapDraft({
        chief_complaint: encounter.chief_complaint || '',
        subjective_notes: encounter.subjective_notes || '',
        objective_notes: encounter.objective_notes || '',
        assessment_notes: encounter.assessment_notes || '',
        plan_notes: encounter.plan_notes || ''
      });
    }
  }, [encounter, editingSOAP]);

  // ── Generate SOAP via OpenAI ──────────────────────────────────────────────
  const handleGenerateSOAP = useCallback(async () => {
    if (!transcript) {
      toast.error('No transcript found for this encounter');
      return;
    }
    setGeneratingSoap(true);
    try {
      const res = await fetch(`${API_URL}/v1/soap/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token'
        },
        body: JSON.stringify({
          transcript_id: transcript.transcript_id ?? transcript.id,
          encounter_id: Number(encounterId)
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const result = await res.json();
      const soap = result.data;

      // Update local draft immediately
      setSoapDraft({
        chief_complaint: soap.chief_complaint || '',
        subjective_notes: soap.subjective || '',
        objective_notes: soap.objective || '',
        assessment_notes: soap.assessment || '',
        plan_notes: soap.plan || ''
      });

      // Refetch encounter to get the persisted SOAP notes + diagnosis codes
      query.refetch();
      transcriptQuery.refetch();

      // Show diagnosis codes if AI suggested them
      if (soap.diagnosis_codes && soap.diagnosis_codes.length > 0) {
        const codeList = soap.diagnosis_codes
          .map(
            (dx: { code?: string; display?: string }) =>
              `${dx.code} (${dx.display})`
          )
          .join(', ');
        toast.success(`AI SOAP notes generated — Diagnosis: ${codeList}`);
      } else {
        toast.success('AI SOAP notes generated successfully');
      }
    } catch (err: any) {
      console.error('[SOAP Generation Error]', err);
      toast.error(`Failed to generate SOAP notes: ${err.message}`);
    } finally {
      setGeneratingSoap(false);
    }
  }, [transcript, encounterId, query, transcriptQuery]);

  // ── Save edited SOAP notes ────────────────────────────────────────────────
  const handleSaveSOAP = useCallback(() => {
    setSavingSOAP(true);
    updateEncounter(
      {
        resource: 'encounters',
        id: encounterId,
        values: {
          chief_complaint: soapDraft.chief_complaint || undefined,
          subjective_notes: soapDraft.subjective_notes || undefined,
          objective_notes: soapDraft.objective_notes || undefined,
          assessment_notes: soapDraft.assessment_notes || undefined,
          plan_notes: soapDraft.plan_notes || undefined
        }
      },
      {
        onSuccess: () => {
          toast.success('SOAP notes saved');
          setEditingSOAP(false);
          setSavingSOAP(false);
          query.refetch();
        },
        onError: (err: any) => {
          toast.error(`Failed to save SOAP: ${err.message}`);
          setSavingSOAP(false);
        }
      }
    );
  }, [encounterId, soapDraft, updateEncounter, query]);

  // ── Sign & Lock ───────────────────────────────────────────────────────────
  const handleSignAndLock = () => {
    updateEncounter(
      {
        resource: 'encounters',
        id: encounterId,
        values: { status: 'completed', ended_at: new Date().toISOString() }
      },
      {
        onSuccess: () => {
          toast.success('Encounter signed and locked');
          setShowSignDialog(false);
          query.refetch();
        }
      }
    );
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

  const isSigned = encounter.status === 'completed';

  return (
    <div className='flex h-[calc(100vh-8rem)] gap-6'>
      {/* Left: Patient Summary Sidebar */}
      {patient && (
        <aside className='bg-card w-72 shrink-0 overflow-hidden rounded-lg border'>
          <PatientSummary patient={patient as any} />
        </aside>
      )}

      {/* Right: Chart Content */}
      <div className='scrollbar-hide min-w-0 flex-1 overflow-auto'>
        {/* Encounter Header */}
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Button asChild variant='ghost' size='icon'>
              <Link href='/dashboard/encounters'>
                <ArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-xl font-bold tracking-tight'>
                  {encounter.patient_name}
                </h1>
                <Badge
                  variant={statusColors[encounter.status] || 'secondary'}
                  className='text-[10px]'
                >
                  {isSigned && <Lock className='mr-1 h-3 w-3' />}
                  {encounter.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className='text-muted-foreground text-sm capitalize'>
                {encounter.encounter_type.replace(/_/g, ' ')} ·{' '}
                {encounter.scheduled_at
                  ? new Date(encounter.scheduled_at).toLocaleString()
                  : 'Not scheduled'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {!isSigned && (
              <>
                <Button asChild variant='outline' size='sm'>
                  <Link href={`/dashboard/sessions/${encounter.id}/record`}>
                    <Mic className='mr-1 h-3 w-3 text-red-500' />
                    Record
                  </Link>
                </Button>
                <Button asChild variant='outline' size='sm'>
                  <Link href={`/dashboard/encounters/${encounter.id}/edit`}>
                    <Pencil className='mr-1 h-3 w-3' />
                    Edit
                  </Link>
                </Button>
                <Button
                  size='sm'
                  onClick={() => setShowSignDialog(true)}
                  className='bg-green-600 text-white hover:bg-green-700'
                >
                  <CheckCircle2 className='mr-1 h-3 w-3' />
                  Sign & Lock
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Chart Tabs */}
        <Tabs defaultValue='chart' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='chart'>
              <ClipboardList className='mr-1 h-3 w-3' />
              Chart
            </TabsTrigger>
            <TabsTrigger value='visit'>
              <Stethoscope className='mr-1 h-3 w-3' />
              Visit Details
            </TabsTrigger>
            <TabsTrigger value='transcript'>
              <FileText className='mr-1 h-3 w-3' />
              Transcript
            </TabsTrigger>
          </TabsList>

          {/* Chart Tab — SOAP Notes (directly from encounter + ClinicalImpression fallback) */}
          <TabsContent value='chart' className='space-y-4'>
            {isSigned && (
              <div className='flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400'>
                <Lock className='h-4 w-4' />
                This encounter has been signed and locked.
                {clinicalImpression?.signed_at && (
                  <span className='text-xs'>
                    Signed{' '}
                    {new Date(clinicalImpression.signed_at).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* AI SOAP Generation + Edit Controls */}
            {!isSigned && (
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  {transcript && !generatingSoap && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleGenerateSOAP}
                      disabled={generatingSoap}
                    >
                      <Sparkles className='mr-1 h-3 w-3 text-purple-500' />
                      {encounter.subjective_notes || encounter.assessment_notes
                        ? 'Regenerate AI SOAP'
                        : 'Generate AI SOAP Notes'}
                    </Button>
                  )}
                  {generatingSoap && (
                    <Button variant='outline' size='sm' disabled>
                      <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                      Generating SOAP with AI...
                    </Button>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  {!editingSOAP ? (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setEditingSOAP(true)}
                      disabled={
                        !encounter.subjective_notes &&
                        !encounter.assessment_notes &&
                        !soapDraft.subjective_notes
                      }
                    >
                      <Pencil className='mr-1 h-3 w-3' />
                      Edit Notes
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setEditingSOAP(false);
                          // Reset to encounter values
                          setSoapDraft({
                            chief_complaint: encounter.chief_complaint || '',
                            subjective_notes: encounter.subjective_notes || '',
                            objective_notes: encounter.objective_notes || '',
                            assessment_notes: encounter.assessment_notes || '',
                            plan_notes: encounter.plan_notes || ''
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size='sm'
                        onClick={handleSaveSOAP}
                        disabled={savingSOAP}
                      >
                        {savingSOAP ? (
                          <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                        ) : (
                          <Save className='mr-1 h-3 w-3' />
                        )}
                        Save Notes
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* SOAP Notes Display / Edit */}
            {soapDraft.subjective_notes ||
            soapDraft.objective_notes ||
            soapDraft.assessment_notes ||
            soapDraft.plan_notes ||
            encounter.subjective_notes ||
            encounter.objective_notes ||
            encounter.assessment_notes ||
            encounter.plan_notes ||
            clinicalImpression ? (
              <>
                {/* Chief Complaint */}
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                      <AlertTriangle className='h-4 w-4 text-amber-500' />
                      Chief Complaint
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingSOAP ? (
                      <Textarea
                        value={soapDraft.chief_complaint}
                        onChange={(e) =>
                          setSoapDraft((d) => ({
                            ...d,
                            chief_complaint: e.target.value
                          }))
                        }
                        rows={2}
                        placeholder='Primary reason for visit...'
                      />
                    ) : (
                      <p className='text-sm'>
                        {soapDraft.chief_complaint ||
                          encounter.chief_complaint ||
                          'Not documented'}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Subjective */}
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                      <User className='h-4 w-4 text-blue-500' />
                      Subjective
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingSOAP ? (
                      <Textarea
                        value={soapDraft.subjective_notes}
                        onChange={(e) =>
                          setSoapDraft((d) => ({
                            ...d,
                            subjective_notes: e.target.value
                          }))
                        }
                        rows={6}
                        placeholder='Patient-reported symptoms, history...'
                      />
                    ) : (
                      <p className='text-sm whitespace-pre-wrap'>
                        {soapDraft.subjective_notes ||
                          encounter.subjective_notes ||
                          clinicalImpression?.finding ||
                          '—'}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Objective */}
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                      <Stethoscope className='h-4 w-4 text-purple-500' />
                      Objective
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingSOAP ? (
                      <Textarea
                        value={soapDraft.objective_notes}
                        onChange={(e) =>
                          setSoapDraft((d) => ({
                            ...d,
                            objective_notes: e.target.value
                          }))
                        }
                        rows={6}
                        placeholder='Physical exam findings, vitals, labs...'
                      />
                    ) : (
                      <p className='text-sm whitespace-pre-wrap'>
                        {soapDraft.objective_notes ||
                          encounter.objective_notes ||
                          '—'}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Assessment */}
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                      <ClipboardList className='h-4 w-4 text-orange-500' />
                      Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingSOAP ? (
                      <Textarea
                        value={soapDraft.assessment_notes}
                        onChange={(e) =>
                          setSoapDraft((d) => ({
                            ...d,
                            assessment_notes: e.target.value
                          }))
                        }
                        rows={6}
                        placeholder='Diagnoses, clinical impressions...'
                      />
                    ) : (
                      <p className='text-sm whitespace-pre-wrap'>
                        {soapDraft.assessment_notes ||
                          encounter.assessment_notes ||
                          clinicalImpression?.assessment ||
                          '—'}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Plan */}
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                      <FileText className='h-4 w-4 text-green-500' />
                      Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingSOAP ? (
                      <Textarea
                        value={soapDraft.plan_notes}
                        onChange={(e) =>
                          setSoapDraft((d) => ({
                            ...d,
                            plan_notes: e.target.value
                          }))
                        }
                        rows={6}
                        placeholder='Treatment plan, medications, follow-up...'
                      />
                    ) : (
                      <p className='text-sm whitespace-pre-wrap'>
                        {soapDraft.plan_notes ||
                          encounter.plan_notes ||
                          clinicalImpression?.plan ||
                          '—'}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Summary */}
                {(encounter.summary || clinicalImpression?.summary) && (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm'>Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm whitespace-pre-wrap'>
                        {encounter.summary || clinicalImpression?.summary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Diagnosis Codes */}
                {encounter.diagnosis && encounter.diagnosis.length > 0 && (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm'>Diagnosis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-1'>
                        {encounter.diagnosis.map((dx, i) => (
                          <div
                            key={i}
                            className='flex items-center gap-2 text-sm'
                          >
                            <Badge
                              variant='outline'
                              className='shrink-0 font-mono text-xs'
                            >
                              {dx.code}
                            </Badge>
                            <span>{dx.display}</span>
                            {dx.rank === 1 && (
                              <Badge
                                variant='secondary'
                                className='text-[10px]'
                              >
                                Primary
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className='text-muted-foreground py-8 text-center'>
                  <ClipboardList className='mx-auto mb-2 h-8 w-8 opacity-50' />
                  <p>No clinical notes for this encounter yet.</p>
                  {!isSigned && transcript && (
                    <div className='mt-3'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={handleGenerateSOAP}
                        disabled={generatingSoap}
                      >
                        {generatingSoap ? (
                          <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                        ) : (
                          <Sparkles className='mr-1 h-3 w-3 text-purple-500' />
                        )}
                        {generatingSoap
                          ? 'Generating...'
                          : 'Generate AI SOAP Notes from Transcript'}
                      </Button>
                    </div>
                  )}
                  {!isSigned && !transcript && (
                    <p className='mt-1 text-xs'>
                      Start a recording session or write notes manually.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Visit Details Tab */}
          <TabsContent value='visit' className='space-y-4'>
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
                  <div>
                    <span className='text-muted-foreground'>Patient ID: </span>
                    <span className='font-mono text-xs'>
                      {encounter.patient_id}
                    </span>
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
                  {encounter.service_type_display && (
                    <div>
                      <span className='text-muted-foreground'>Service: </span>
                      <span>{encounter.service_type_display}</span>
                    </div>
                  )}
                  {encounter.participants &&
                    encounter.participants.length > 1 && (
                      <div>
                        <span className='text-muted-foreground mb-1 block'>
                          Team:{' '}
                        </span>
                        {encounter.participants.map((p, i) => (
                          <div key={i} className='ml-2 text-xs'>
                            <span className='capitalize'>
                              {p.role.replace(/_/g, ' ')}
                            </span>
                            : {p.name}
                          </div>
                        ))}
                      </div>
                    )}
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
                      {encounter.encounter_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className='text-muted-foreground block'>Class</span>
                    <span className='font-medium'>
                      {encounter.fhir_class_display || 'Ambulatory'}
                    </span>
                  </div>
                  {encounter.priority_display && (
                    <div>
                      <span className='text-muted-foreground block'>
                        Priority
                      </span>
                      <Badge
                        variant={
                          encounter.priority_display === 'Urgent'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className='text-[10px]'
                      >
                        {encounter.priority_display}
                      </Badge>
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

                {encounter.reason_display && (
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
                        <span className='text-muted-foreground mb-2 block text-sm'>
                          Diagnosis Codes
                        </span>
                        <div className='flex flex-wrap gap-1'>
                          {encounter.diagnosis_codes.map((code) => (
                            <Badge
                              key={code}
                              variant='outline'
                              className='font-mono text-xs'
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
                                  className='text-muted-foreground flex items-center gap-2 text-xs'
                                >
                                  <span className='font-mono'>{dx.code}</span>
                                  <span>—</span>
                                  <span>{dx.display}</span>
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

          {/* Transcript Tab */}
          <TabsContent value='transcript'>
            {transcript ? (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center justify-between text-base'>
                    <span>Session Transcript</span>
                    <Badge variant='secondary' className='text-xs'>
                      {transcript.segments.length} segments
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className='h-[calc(100vh-22rem)]'>
                    <div className='space-y-3'>
                      {transcript.segments.map((seg) => (
                        <div
                          key={seg.id}
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
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className='text-muted-foreground py-8 text-center'>
                  <Mic className='mx-auto mb-2 h-8 w-8 opacity-50' />
                  <p>No transcript available for this encounter.</p>
                  {!isSigned && (
                    <Button asChild variant='link' className='mt-2'>
                      <Link href={`/dashboard/sessions/${encounter.id}/record`}>
                        Start a recording session
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Sign & Lock Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <CheckCircle2 className='h-5 w-5 text-green-600' />
              Sign & Lock Encounter
            </DialogTitle>
            <DialogDescription>
              By signing this encounter, you confirm that all documentation is
              accurate and complete. Once signed, the encounter will be locked
              and cannot be edited. An addendum can be added later if needed.
            </DialogDescription>
          </DialogHeader>
          <div className='bg-muted/50 space-y-2 rounded-lg border p-3 text-sm'>
            <div>
              <span className='text-muted-foreground'>Patient: </span>
              <span className='font-medium'>{encounter.patient_name}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>Type: </span>
              <span className='font-medium capitalize'>
                {encounter.encounter_type.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className='text-muted-foreground'>Provider: </span>
              <span className='font-medium'>{encounter.provider_name}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowSignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSignAndLock}
              className='bg-green-600 text-white hover:bg-green-700'
            >
              <Lock className='mr-1 h-4 w-4' />
              Sign & Lock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
