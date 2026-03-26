'use client';

import { useEhrList as useList } from '@/hooks/use-ehr-data';
import {
  AlertTriangle,
  Pill,
  Activity,
  Heart,
  ShieldCheck,
  FileWarning,
  Thermometer,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { Patient, Vital } from '@/types';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface PatientSummaryProps {
  patient: Patient;
}

function CollapsibleSection({
  title,
  icon: Icon,
  iconColor,
  defaultOpen = true,
  count,
  children
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className='hover:bg-muted/50 flex w-full items-center gap-2 rounded-md px-1 py-2 text-left transition-colors'
      >
        {open ? (
          <ChevronDown className='text-muted-foreground h-3 w-3 shrink-0' />
        ) : (
          <ChevronRight className='text-muted-foreground h-3 w-3 shrink-0' />
        )}
        <Icon
          className={`h-4 w-4 shrink-0 ${iconColor || 'text-muted-foreground'}`}
        />
        <span className='text-muted-foreground flex-1 text-xs font-semibold tracking-wider uppercase'>
          {title}
        </span>
        {count !== undefined && count > 0 && (
          <Badge variant='secondary' className='h-4 px-1.5 text-[10px]'>
            {count}
          </Badge>
        )}
      </button>
      {open && <div className='pb-2 pl-6'>{children}</div>}
    </div>
  );
}

function AllergiesSection({ patientId }: { patientId: string }) {
  const [lifestyle, setLifestyle] = useState<Record<string, unknown> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    apiClient
      .get<{ success: boolean; data: Record<string, unknown> | null }>(
        `/v1/lifestyle/patient/${patientId}/latest`
      )
      .then((res) => setLifestyle(res.data))
      .catch(() => setLifestyle(null))
      .finally(() => setLoading(false));
  }, [patientId]);

  const allergyItems: { label: string; items: string[] }[] = [];

  if (lifestyle) {
    const lh = lifestyle as Record<string, string | boolean>;
    if (lh.allergies_medications) {
      String(lh.allergies_medications)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((a) => allergyItems.push({ label: 'med', items: [a] }));
    }
    if (lh.allergies_food) {
      String(lh.allergies_food)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((a) => allergyItems.push({ label: 'food', items: [a] }));
    }
    if (lh.allergies_environmental) {
      String(lh.allergies_environmental)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((a) => allergyItems.push({ label: 'env', items: [a] }));
    }
    if (lh.allergies_other) {
      String(lh.allergies_other)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((a) => allergyItems.push({ label: 'other', items: [a] }));
    }
  }

  const isNKA = lifestyle?.no_known_allergies === true;
  const totalCount = allergyItems.length;

  if (loading) {
    return (
      <CollapsibleSection
        title='Allergies'
        icon={AlertTriangle}
        iconColor='text-amber-500'
      >
        <Skeleton className='h-4 w-full' />
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection
      title='Allergies'
      icon={AlertTriangle}
      iconColor='text-amber-500'
      count={totalCount}
    >
      {totalCount > 0 ? (
        <div className='flex flex-wrap gap-1'>
          {allergyItems.map((a, i) => (
            <Badge
              key={`${a.items[0]}-${i}`}
              variant='destructive'
              className='text-[10px]'
            >
              {a.items[0]}
            </Badge>
          ))}
        </div>
      ) : isNKA ? (
        <p className='text-muted-foreground text-xs'>
          No known allergies (NKA)
        </p>
      ) : (
        <p className='text-muted-foreground text-xs'>No allergy data on file</p>
      )}
    </CollapsibleSection>
  );
}

function MedicationsSection({ patientId }: { patientId: string }) {
  const [meds, setMeds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    apiClient
      .get<{ success: boolean; data: Record<string, unknown>[] }>(
        `/v1/medical-history`,
        {
          patient_id: patientId,
          _end: '1',
          _sort: 'medical_history_id',
          _order: 'desc'
        }
      )
      .then((res) => {
        const record = res.data?.[0];
        if (record?.current_medications) {
          const parsed = String(record.current_medications)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          setMeds(parsed);
        }
      })
      .catch(() => setMeds([]))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <CollapsibleSection
        title='Medications'
        icon={Pill}
        iconColor='text-blue-500'
      >
        <Skeleton className='h-4 w-full' />
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection
      title='Medications'
      icon={Pill}
      iconColor='text-blue-500'
      count={meds.length}
    >
      {meds.length > 0 ? (
        <ul className='space-y-1'>
          {meds.map((m, i) => (
            <li key={`${m}-${i}`} className='flex items-center gap-1.5 text-xs'>
              <span className='h-1 w-1 shrink-0 rounded-full bg-blue-500' />
              {m}
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-muted-foreground text-xs'>No current medications</p>
      )}
    </CollapsibleSection>
  );
}

function ProblemListSection({ patientId }: { patientId: string }) {
  // Derive conditions from medical_history API
  const [conditions, setConditions] = useState<
    {
      id: string;
      display: string;
      code?: string;
      severity?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    apiClient
      .get<{ success: boolean; data: Record<string, unknown>[] }>(
        `/v1/medical-history`,
        {
          patient_id: patientId,
          _end: '1',
          _sort: 'medical_history_id',
          _order: 'desc'
        }
      )
      .then((res) => {
        const mh = res.data?.[0];
        if (!mh) return;
        const items: typeof conditions = [];

        // Use coded conditions if available
        if (
          mh.chronic_conditions_coded &&
          Array.isArray(mh.chronic_conditions_coded)
        ) {
          (
            mh.chronic_conditions_coded as Array<{
              display: string;
              code: string;
              status?: string;
            }>
          ).forEach((c, i) => {
            items.push({
              id: `coded-${i}`,
              display: c.display,
              code: c.code,
              severity: c.status === 'active' ? undefined : c.status
            });
          });
        }

        // Fallback to boolean flags
        if (items.length === 0) {
          const booleanConditions: [string, string][] = [
            ['chronic_conditions_hypertension', 'Hypertension'],
            ['chronic_conditions_diabetes', 'Diabetes'],
            ['chronic_conditions_asthma', 'Asthma'],
            ['chronic_conditions_heart_disease', 'Heart Disease']
          ];
          booleanConditions.forEach(([key, label]) => {
            if (mh[key] === true) {
              items.push({ id: key, display: label });
            }
          });
          if (
            mh.chronic_conditions_other &&
            mh.chronic_conditions_other_detail
          ) {
            items.push({
              id: 'other',
              display: String(mh.chronic_conditions_other_detail)
            });
          }
        }
        setConditions(items);
      })
      .catch(() => setConditions([]))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <CollapsibleSection
        title='Problem List'
        icon={FileWarning}
        iconColor='text-orange-500'
      >
        <Skeleton className='h-4 w-full' />
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection
      title='Problem List'
      icon={FileWarning}
      iconColor='text-orange-500'
      count={conditions.length}
    >
      {conditions.length > 0 ? (
        <ul className='space-y-1.5'>
          {conditions.map((c) => (
            <li key={c.id} className='text-xs'>
              <div className='flex items-start justify-between gap-1'>
                <span className='font-medium'>{c.display}</span>
                {c.severity && (
                  <Badge
                    variant='outline'
                    className={`shrink-0 text-[9px] ${
                      c.severity === 'severe'
                        ? 'border-red-300 text-red-600'
                        : c.severity === 'moderate'
                          ? 'border-amber-300 text-amber-600'
                          : 'border-green-300 text-green-600'
                    }`}
                  >
                    {c.severity}
                  </Badge>
                )}
              </div>
              {c.code && (
                <span className='text-muted-foreground font-mono text-[10px]'>
                  {c.code}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-muted-foreground text-xs'>No active problems</p>
      )}
    </CollapsibleSection>
  );
}

function VitalsSection({ patientId }: { patientId: string }) {
  const { result, query } = useList<Vital>({
    resource: 'vitals',
    pagination: { currentPage: 1, pageSize: 1 },
    filters: [{ field: 'patient_id', operator: 'eq', value: patientId }],
    sorters: [{ field: 'recorded_at', order: 'desc' }]
  });

  const latest = (result?.data?.[0] || null) as Vital | null;

  if (query.isLoading) {
    return (
      <CollapsibleSection
        title='Latest Vitals'
        icon={Activity}
        iconColor='text-green-500'
      >
        <Skeleton className='h-16 w-full' />
      </CollapsibleSection>
    );
  }

  if (!latest) {
    return (
      <CollapsibleSection
        title='Latest Vitals'
        icon={Activity}
        iconColor='text-green-500'
      >
        <p className='text-muted-foreground text-xs'>No vitals recorded</p>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection
      title='Latest Vitals'
      icon={Activity}
      iconColor='text-green-500'
    >
      <div className='grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs'>
        {latest.systolic_bp && latest.diastolic_bp && (
          <div>
            <span className='text-muted-foreground'>BP</span>
            <p className='font-medium'>
              {latest.systolic_bp}/{latest.diastolic_bp}
            </p>
          </div>
        )}
        {latest.heart_rate && (
          <div>
            <span className='text-muted-foreground'>HR</span>
            <p className='font-medium'>{latest.heart_rate} bpm</p>
          </div>
        )}
        {latest.temperature && (
          <div>
            <span className='text-muted-foreground'>Temp</span>
            <p className='font-medium'>
              {latest.temperature}°{latest.temperature_unit || 'F'}
            </p>
          </div>
        )}
        {latest.oxygen_saturation && (
          <div>
            <span className='text-muted-foreground'>SpO2</span>
            <p className='font-medium'>{latest.oxygen_saturation}%</p>
          </div>
        )}
        {latest.respiratory_rate && (
          <div>
            <span className='text-muted-foreground'>RR</span>
            <p className='font-medium'>{latest.respiratory_rate}/min</p>
          </div>
        )}
        {latest.weight && (
          <div>
            <span className='text-muted-foreground'>Weight</span>
            <p className='font-medium'>{latest.weight} lbs</p>
          </div>
        )}
        {latest.bmi && (
          <div>
            <span className='text-muted-foreground'>BMI</span>
            <p className='font-medium'>{latest.bmi.toFixed(1)}</p>
          </div>
        )}
        {latest.pain_level !== undefined && (
          <div>
            <span className='text-muted-foreground'>Pain</span>
            <p className='font-medium'>{latest.pain_level}/10</p>
          </div>
        )}
      </div>
      <p className='text-muted-foreground mt-2 text-[10px]'>
        Recorded{' '}
        {latest.recorded_at
          ? new Date(latest.recorded_at).toLocaleDateString()
          : '—'}
      </p>
    </CollapsibleSection>
  );
}

function InsuranceSection({ patientId }: { patientId: string }) {
  const [ins, setIns] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    apiClient
      .get<{ success: boolean; data: Record<string, unknown> | null }>(
        `/v1/insurance/patient/${patientId}/latest`
      )
      .then((res) => setIns(res.data))
      .catch(() => setIns(null))
      .finally(() => setLoading(false));
  }, [patientId]);

  const provider = ins?.primary_insurance_provider as string | undefined;
  const policyNum = ins?.policy_number as string | undefined;
  const groupNum = ins?.group_number as string | undefined;
  const planType = ins?.plan_type as string | undefined;
  const insStatus = ins?.status as string | undefined;
  const hasData = !!(provider || policyNum);

  if (loading) {
    return (
      <CollapsibleSection
        title='Insurance'
        icon={ShieldCheck}
        iconColor='text-indigo-500'
        defaultOpen={true}
      >
        <Skeleton className='h-4 w-full' />
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection
      title='Insurance'
      icon={ShieldCheck}
      iconColor='text-indigo-500'
      defaultOpen={true}
    >
      {hasData ? (
        <div className='space-y-1 text-xs'>
          {provider && (
            <div>
              <span className='text-muted-foreground'>Provider: </span>
              <span className='font-medium'>{provider}</span>
            </div>
          )}
          {policyNum && (
            <div>
              <span className='text-muted-foreground'>Policy: </span>
              <span className='font-mono'>{policyNum}</span>
            </div>
          )}
          {groupNum && (
            <div>
              <span className='text-muted-foreground'>Group: </span>
              <span className='font-mono'>{groupNum}</span>
            </div>
          )}
          {planType && (
            <div>
              <span className='text-muted-foreground'>Plan: </span>
              <span className='font-medium'>{planType}</span>
            </div>
          )}
          {insStatus && (
            <div>
              <span className='text-muted-foreground'>Status: </span>
              <span className='font-medium capitalize'>{insStatus}</span>
            </div>
          )}
        </div>
      ) : (
        <p className='text-muted-foreground text-xs'>No insurance on file</p>
      )}
    </CollapsibleSection>
  );
}

export function PatientSummary({ patient }: PatientSummaryProps) {
  const age = Math.floor(
    (Date.now() - new Date(patient.date_of_birth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <ScrollArea className='h-full'>
      <div className='space-y-1 p-4'>
        {/* Patient Header */}
        <div className='space-y-1 pb-2'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold'>
              {patient.first_name[0]}
              {patient.last_name[0]}
            </div>
            <div className='min-w-0'>
              <h3 className='truncate text-sm font-semibold'>
                {patient.first_name} {patient.last_name}
              </h3>
              <p className='text-muted-foreground text-xs'>
                {age}yo · <span className='capitalize'>{patient.gender}</span> ·{' '}
                {patient.medical_record_number}
              </p>
            </div>
          </div>
          <Badge
            variant={
              patient.status === 'active'
                ? 'default'
                : patient.status === 'deceased'
                  ? 'destructive'
                  : 'secondary'
            }
            className='text-[10px]'
          >
            {patient.status}
          </Badge>
        </div>

        <Separator />

        {/* Clinical Sections */}
        <AllergiesSection patientId={patient.id} />
        <Separator />
        <ProblemListSection patientId={patient.id} />
        <Separator />
        <MedicationsSection patientId={patient.id} />
        <Separator />
        <VitalsSection patientId={patient.id} />
        <Separator />
        <InsuranceSection patientId={patient.id} />
      </div>
    </ScrollArea>
  );
}
