'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  StagedFileUploader,
  type StagedFileUploaderHandle
} from '@/components/files/staged-file-uploader';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

// ═══════════════════════════════════════════════════════════════════════════════
// Zod schemas — grouped by table
// ═══════════════════════════════════════════════════════════════════════════════

const patientFields = z.object({
  patient_id: z.string().min(1, 'Patient ID is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  phone: z.string().min(1, 'Phone number is required'),
  middle_name: z.string().optional(),
  name_prefix: z.string().optional(),
  name_suffix: z.string().optional(),
  marital_status: z.string().optional(),
  race: z.string().optional(),
  ethnicity: z.string().optional(),
  primary_language: z.string().optional(),
  birth_sex: z.string().optional(),
  occupation: z.string().optional(),
  employment_status: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  street: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
  emergency_contact_phone_number: z.string().optional(),
  ssn: z.string().optional(),
  driver_license_no: z.string().optional(),
  primary_care_physician: z.string().optional(),
  referring_physician: z.string().optional()
});

const insuranceFields = z.object({
  primary_insurance_provider: z.string().optional(),
  policy_number: z.string().optional(),
  group_number: z.string().optional(),
  plan_type: z.string().optional(),
  coverage_start_date: z.string().optional(),
  coverage_end_date: z.string().optional(),
  policy_holder_name: z.string().optional(),
  relationship_to_patient: z.string().optional(),
  secondary_insurance_provider: z.string().optional(),
  copay_amount: z.string().optional(),
  deductible_amount: z.string().optional()
});

const lifestyleFields = z.object({
  allergies_medications: z.string().optional(),
  allergies_food: z.string().optional(),
  allergies_environmental: z.string().optional(),
  allergies_other: z.string().optional(),
  smoking_status: z.string().optional(),
  alcohol_status: z.string().optional(),
  recreational_drugs: z.string().optional(),
  exercise_frequency: z.string().optional(),
  exercise_type: z.string().optional(),
  diet_type: z.string().optional(),
  dietary_restrictions: z.string().optional(),
  caffeine_use: z.string().optional(),
  sleep_hours_per_night: z.string().optional(),
  sleep_quality: z.string().optional(),
  social_history_notes: z.string().optional()
});

const medicalHistoryFields = z.object({
  // Chronic conditions
  chronic_conditions_hypertension: z.boolean().optional(),
  chronic_conditions_diabetes: z.boolean().optional(),
  chronic_conditions_asthma: z.boolean().optional(),
  chronic_conditions_heart_disease: z.boolean().optional(),
  chronic_conditions_other: z.boolean().optional(),
  chronic_conditions_other_detail: z.string().optional(),
  // Family history
  family_history_heart_disease: z.boolean().optional(),
  family_history_diabetes: z.boolean().optional(),
  family_history_cancer: z.boolean().optional(),
  family_history_stroke: z.boolean().optional(),
  family_history_hypertension: z.boolean().optional(),
  family_history_mental_illness: z.boolean().optional(),
  family_history_other: z.boolean().optional(),
  family_history_other_detail: z.string().optional(),
  // Symptoms – Cardiovascular
  cardiovascular_chest_pain: z.boolean().optional(),
  cardiovascular_palpitations: z.boolean().optional(),
  cardiovascular_swelling_of_extremities: z.boolean().optional(),
  // Constitutional
  constitutional_fever: z.boolean().optional(),
  constitutional_fatigue: z.boolean().optional(),
  constitutional_weight_loss: z.boolean().optional(),
  // Respiratory
  respiratory_cough: z.boolean().optional(),
  respiratory_shortness_of_breath: z.boolean().optional(),
  respiratory_wheezing: z.boolean().optional(),
  // Neurological
  neurological_headaches: z.boolean().optional(),
  neurological_dizziness: z.boolean().optional(),
  neurological_numbness_tingling: z.boolean().optional(),
  // Psychiatric
  psychiatric_depression: z.boolean().optional(),
  psychiatric_anxiety: z.boolean().optional(),
  psychiatric_sleep_disturbances: z.boolean().optional(),
  // Text
  current_medications: z.string().optional(),
  past_surgeries: z.string().optional(),
  vaccinations: z.string().optional(),
  clinical_notes: z.string().optional()
});

const fullSchema = patientFields
  .merge(insuranceFields)
  .merge(lifestyleFields)
  .merge(medicalHistoryFields);

type FormValues = z.infer<typeof fullSchema>;

// ═══════════════════════════════════════════════════════════════════════════════

function generatePatientId() {
  const yr = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 90000) + 10000);
  return `PT-${yr}-${rand}`;
}

/** Strip empty strings → null for optional fields */
function clean(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === '' ? null : v;
  }
  return out;
}

/** Split flat form data into per-table payloads */
function partition(data: FormValues) {
  const patientKeys = Object.keys(patientFields.shape);
  const insuranceKeys = Object.keys(insuranceFields.shape);
  const lifestyleKeys = Object.keys(lifestyleFields.shape);
  const medHistKeys = Object.keys(medicalHistoryFields.shape);

  const patient: Record<string, unknown> = {};
  const insurance: Record<string, unknown> = {};
  const lifestyle: Record<string, unknown> = {};
  const medHist: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(data)) {
    if (patientKeys.includes(k)) patient[k] = v;
    else if (insuranceKeys.includes(k)) insurance[k] = v;
    else if (lifestyleKeys.includes(k)) lifestyle[k] = v;
    else if (medHistKeys.includes(k)) medHist[k] = v;
  }

  return {
    patient: clean(patient),
    insurance: clean(insurance),
    lifestyle: clean(lifestyle),
    medicalHistory: clean(medHist)
  };
}

function hasAnyValue(obj: Record<string, unknown>) {
  return Object.values(obj).some(
    (v) => v !== null && v !== undefined && v !== false
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function CreatePatientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const uploaderRef = useRef<StagedFileUploaderHandle>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(fullSchema) as any,
    defaultValues: {
      patient_id: generatePatientId(),
      gender: 'male',
      primary_language: 'English',
      country: 'US'
    }
  });

  // ── Multi-table submit ─────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      const { patient, insurance, lifestyle, medicalHistory } = partition(data);

      // 1. Create patient first
      const patientRes = await fetch(`${API}/v1/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient)
      });
      const patientJson = await patientRes.json();
      if (!patientRes.ok || !patientJson.success) {
        throw new Error(
          patientJson?.error?.message ?? 'Failed to create patient'
        );
      }

      const pid = patient.patient_id as string;

      // 2. Create related records in parallel (only if user filled something)
      const promises: Promise<any>[] = [];

      if (hasAnyValue(insurance)) {
        const insPayload: Record<string, unknown> = {
          ...insurance,
          patient_id: pid
        };
        // Convert string amounts → float
        if (insPayload.copay_amount)
          insPayload.copay_amount = parseFloat(
            insPayload.copay_amount as string
          );
        if (insPayload.deductible_amount)
          insPayload.deductible_amount = parseFloat(
            insPayload.deductible_amount as string
          );
        promises.push(
          fetch(`${API}/v1/insurance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(insPayload)
          })
        );
      }

      if (hasAnyValue(lifestyle)) {
        promises.push(
          fetch(`${API}/v1/lifestyle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...lifestyle, patient_id: pid })
          })
        );
      }

      if (hasAnyValue(medicalHistory)) {
        promises.push(
          fetch(`${API}/v1/medical-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...medicalHistory, patient_id: pid })
          })
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      // 3. Upload staged files (if any)
      if (uploaderRef.current && uploaderRef.current.stagedCount > 0) {
        try {
          // Use patient_id as both patientId and encounterId (no encounter yet)
          const uploaded = await uploaderRef.current.uploadAll(pid, pid);
          if (uploaded.length > 0) {
            toast.success(
              `${uploaded.length} file${uploaded.length > 1 ? 's' : ''} uploaded`
            );
          }
        } catch {
          toast.error('Patient saved but some files failed to upload');
        }
      }

      toast.success('Patient created successfully');
      router.push('/dashboard/patients');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create patient');
    } finally {
      setSaving(false);
    }
  };

  // ── Checkbox helper ────────────────────────────────────────────────────
  const CheckField = ({
    name,
    label
  }: {
    name: keyof FormValues;
    label: string;
  }) => (
    <div className='flex items-center space-x-2'>
      <Checkbox
        id={name}
        checked={!!watch(name)}
        onCheckedChange={(v) => setValue(name, !!v)}
      />
      <Label htmlFor={name} className='cursor-pointer text-sm font-normal'>
        {label}
      </Label>
    </div>
  );

  // ── Section divider helper ────────────────────────────────────────────
  const SectionHeader = ({
    title,
    description
  }: {
    title: string;
    description?: string;
  }) => (
    <div className='border-b pb-2'>
      <h3 className='text-base font-semibold'>{title}</h3>
      {description && (
        <p className='text-muted-foreground text-xs'>{description}</p>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button asChild variant='ghost' size='icon'>
          <Link href='/dashboard/patients'>
            <ArrowLeft className='h-4 w-4' />
          </Link>
        </Button>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>New Patient</h1>
          <p className='text-muted-foreground'>
            Complete patient intake — fill required (*) fields, then save.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)}>
        <Tabs defaultValue='patient' className='space-y-4'>
          <TabsList className='flex h-auto flex-wrap gap-1'>
            <TabsTrigger value='patient'>Patient Information</TabsTrigger>
            <TabsTrigger value='insurance'>Insurance</TabsTrigger>
            <TabsTrigger value='lifestyle'>Lifestyle & Habits</TabsTrigger>
            <TabsTrigger value='medical'>Medical History</TabsTrigger>
            <TabsTrigger
              value='documents'
              className='flex items-center gap-1.5'
            >
              <FolderOpen className='h-3.5 w-3.5' />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* ═══ TAB 1: Patient Information (full page) ════════════════════ */}
          <TabsContent value='patient' className='space-y-6'>
            {/* ── Section: Demographics ─────────────────────────────────── */}
            <Card>
              <CardHeader className='pb-4'>
                <CardTitle>Demographics</CardTitle>
                <CardDescription>
                  Basic patient information. Fields marked * are required.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Patient ID */}
                <div className='grid grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <Label>Patient ID *</Label>
                    <Input {...register('patient_id')} />
                    {errors.patient_id && (
                      <p className='text-destructive text-sm'>
                        {String(errors.patient_id.message)}
                      </p>
                    )}
                  </div>
                </div>
                {/* Name */}
                <div className='grid grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <Label>First Name *</Label>
                    <Input {...register('first_name')} />
                    {errors.first_name && (
                      <p className='text-destructive text-sm'>
                        {String(errors.first_name.message)}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label>Middle Name</Label>
                    <Input {...register('middle_name')} />
                  </div>
                  <div className='space-y-2'>
                    <Label>Last Name *</Label>
                    <Input {...register('last_name')} />
                    {errors.last_name && (
                      <p className='text-destructive text-sm'>
                        {String(errors.last_name.message)}
                      </p>
                    )}
                  </div>
                </div>
                {/* Prefix / Suffix */}
                <div className='grid grid-cols-4 gap-4'>
                  <div className='space-y-2'>
                    <Label>Prefix</Label>
                    <Select onValueChange={(v) => setValue('name_prefix', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder='None' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Mr.'>Mr.</SelectItem>
                        <SelectItem value='Mrs.'>Mrs.</SelectItem>
                        <SelectItem value='Ms.'>Ms.</SelectItem>
                        <SelectItem value='Dr.'>Dr.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Suffix</Label>
                    <Input
                      placeholder='Jr., Sr., III'
                      {...register('name_suffix')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Date of Birth *</Label>
                    <Input type='date' {...register('dob')} />
                    {errors.dob && (
                      <p className='text-destructive text-sm'>
                        {String(errors.dob.message)}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label>Gender *</Label>
                    <Select
                      defaultValue='male'
                      onValueChange={(v) => setValue('gender', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='male'>Male</SelectItem>
                        <SelectItem value='female'>Female</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                        <SelectItem value='unknown'>Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Birth Sex / Marital / Race / Ethnicity */}
                <div className='grid grid-cols-4 gap-4'>
                  <div className='space-y-2'>
                    <Label>Birth Sex</Label>
                    <Select onValueChange={(v) => setValue('birth_sex', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='M'>Male</SelectItem>
                        <SelectItem value='F'>Female</SelectItem>
                        <SelectItem value='UNK'>Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Marital Status</Label>
                    <Select
                      onValueChange={(v) => setValue('marital_status', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Single'>Single</SelectItem>
                        <SelectItem value='Married'>Married</SelectItem>
                        <SelectItem value='Divorced'>Divorced</SelectItem>
                        <SelectItem value='Widowed'>Widowed</SelectItem>
                        <SelectItem value='Separated'>Separated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Race</Label>
                    <Select onValueChange={(v) => setValue('race', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='White'>White</SelectItem>
                        <SelectItem value='Black or African American'>
                          Black or African American
                        </SelectItem>
                        <SelectItem value='Asian'>Asian</SelectItem>
                        <SelectItem value='Native Hawaiian or Pacific Islander'>
                          Native Hawaiian / Pacific Islander
                        </SelectItem>
                        <SelectItem value='American Indian or Alaska Native'>
                          American Indian / Alaska Native
                        </SelectItem>
                        <SelectItem value='Other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Ethnicity</Label>
                    <Select onValueChange={(v) => setValue('ethnicity', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Hispanic or Latino'>
                          Hispanic or Latino
                        </SelectItem>
                        <SelectItem value='Not Hispanic or Latino'>
                          Not Hispanic or Latino
                        </SelectItem>
                        <SelectItem value='Unknown'>Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Occupation / Employment / Language */}
                <div className='grid grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <Label>Primary Language</Label>
                    <Input
                      placeholder='English'
                      {...register('primary_language')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Occupation</Label>
                    <Input {...register('occupation')} />
                  </div>
                  <div className='space-y-2'>
                    <Label>Employment Status</Label>
                    <Select
                      onValueChange={(v) => setValue('employment_status', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Employed'>Employed</SelectItem>
                        <SelectItem value='Unemployed'>Unemployed</SelectItem>
                        <SelectItem value='Retired'>Retired</SelectItem>
                        <SelectItem value='Student'>Student</SelectItem>
                        <SelectItem value='Self-Employed'>
                          Self-Employed
                        </SelectItem>
                        <SelectItem value='Disabled'>Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Section: Contact & Address ────────────────────────────── */}
            <Card>
              <CardHeader className='pb-4'>
                <CardTitle>Contact & Address</CardTitle>
                <CardDescription>
                  Phone, email, and mailing address
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Phone *</Label>
                    <Input
                      type='tel'
                      placeholder='(555) 123-4567'
                      {...register('phone')}
                    />
                    {errors.phone && (
                      <p className='text-destructive text-sm'>
                        {String(errors.phone.message)}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label>Email</Label>
                    <Input
                      type='email'
                      placeholder='patient@example.com'
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className='text-destructive text-sm'>
                        {String(errors.email.message)}
                      </p>
                    )}
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Street Address</Label>
                    <Input
                      placeholder='123 Main Street'
                      {...register('street')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Address Line 2</Label>
                    <Input
                      placeholder='Apt, Suite, Unit'
                      {...register('address_line2')}
                    />
                  </div>
                </div>
                <div className='grid grid-cols-4 gap-4'>
                  <div className='space-y-2'>
                    <Label>City</Label>
                    <Input {...register('city')} />
                  </div>
                  <div className='space-y-2'>
                    <Label>State</Label>
                    <Input placeholder='CA' {...register('state')} />
                  </div>
                  <div className='space-y-2'>
                    <Label>ZIP Code</Label>
                    <Input placeholder='90210' {...register('zip_code')} />
                  </div>
                  <div className='space-y-2'>
                    <Label>Country</Label>
                    <Input placeholder='US' {...register('country')} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Section: Emergency Contact ────────────────────────────── */}
            <Card>
              <CardHeader className='pb-4'>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>
                  Person to contact in case of emergency
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <Label>Contact Name</Label>
                    <Input
                      placeholder='Full name'
                      {...register('emergency_contact_name')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Relationship</Label>
                    <Select
                      onValueChange={(v) =>
                        setValue('emergency_contact_relation', v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Spouse'>Spouse</SelectItem>
                        <SelectItem value='Parent'>Parent</SelectItem>
                        <SelectItem value='Sibling'>Sibling</SelectItem>
                        <SelectItem value='Child'>Child</SelectItem>
                        <SelectItem value='Friend'>Friend</SelectItem>
                        <SelectItem value='Other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Contact Phone</Label>
                    <Input
                      type='tel'
                      placeholder='(555) 987-6543'
                      {...register('emergency_contact_phone_number')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Section: Clinical & IDs ───────────────────────────────── */}
            <Card>
              <CardHeader className='pb-4'>
                <CardTitle>Clinical & Identification</CardTitle>
                <CardDescription>Physicians and government IDs</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Primary Care Physician</Label>
                    <Input
                      placeholder='Dr. Smith'
                      {...register('primary_care_physician')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Referring Physician</Label>
                    <Input
                      placeholder='Dr. Jones'
                      {...register('referring_physician')}
                    />
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>SSN</Label>
                    <Input
                      placeholder='XXX-XX-XXXX'
                      maxLength={11}
                      {...register('ssn')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Driver License No.</Label>
                    <Input {...register('driver_license_no')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ TAB 2: Insurance ═══════════════════════════════════════════ */}
          <TabsContent value='insurance'>
            <Card>
              <CardHeader>
                <CardTitle>Insurance Information</CardTitle>
                <CardDescription>
                  Primary insurance details — skip if uninsured
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Provider & Plan */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Primary Insurance Provider</Label>
                    <Input
                      placeholder='Aetna, Blue Cross, etc.'
                      {...register('primary_insurance_provider')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Plan Type</Label>
                    <Select onValueChange={(v) => setValue('plan_type', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='HMO'>HMO</SelectItem>
                        <SelectItem value='PPO'>PPO</SelectItem>
                        <SelectItem value='EPO'>EPO</SelectItem>
                        <SelectItem value='POS'>POS</SelectItem>
                        <SelectItem value='Medicare'>Medicare</SelectItem>
                        <SelectItem value='Medicaid'>Medicaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Policy & Group */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Policy Number</Label>
                    <Input {...register('policy_number')} />
                  </div>
                  <div className='space-y-2'>
                    <Label>Group Number</Label>
                    <Input {...register('group_number')} />
                  </div>
                </div>
                {/* Coverage dates */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Coverage Start</Label>
                    <Input type='date' {...register('coverage_start_date')} />
                  </div>
                  <div className='space-y-2'>
                    <Label>Coverage End</Label>
                    <Input type='date' {...register('coverage_end_date')} />
                  </div>
                </div>
                {/* Policy holder */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Policy Holder Name</Label>
                    <Input
                      placeholder='If not the patient'
                      {...register('policy_holder_name')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Relationship to Patient</Label>
                    <Select
                      onValueChange={(v) =>
                        setValue('relationship_to_patient', v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Self'>Self</SelectItem>
                        <SelectItem value='Spouse'>Spouse</SelectItem>
                        <SelectItem value='Parent'>Parent</SelectItem>
                        <SelectItem value='Child'>Child</SelectItem>
                        <SelectItem value='Other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Costs */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Copay ($)</Label>
                    <Input
                      type='number'
                      step='0.01'
                      placeholder='25.00'
                      {...register('copay_amount')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Deductible ($)</Label>
                    <Input
                      type='number'
                      step='0.01'
                      placeholder='1500.00'
                      {...register('deductible_amount')}
                    />
                  </div>
                </div>
                {/* Secondary */}
                <div className='space-y-2'>
                  <Label>Secondary Insurance Provider</Label>
                  <Input {...register('secondary_insurance_provider')} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ TAB 3: Lifestyle & Habits ═════════════════════════════════ */}
          <TabsContent value='lifestyle'>
            <Card>
              <CardHeader>
                <CardTitle>Lifestyle & Habits</CardTitle>
                <CardDescription>
                  Allergies, substance use, exercise, diet, and sleep
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Allergies */}
                <div>
                  <h3 className='mb-3 text-sm font-semibold'>Allergies</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Medication Allergies</Label>
                      <Input
                        placeholder='Penicillin, Sulfa drugs'
                        {...register('allergies_medications')}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Food Allergies</Label>
                      <Input
                        placeholder='Peanuts, Shellfish'
                        {...register('allergies_food')}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Environmental Allergies</Label>
                      <Input
                        placeholder='Pollen, Dust mites'
                        {...register('allergies_environmental')}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Other Allergies</Label>
                      <Input
                        placeholder='Latex, etc.'
                        {...register('allergies_other')}
                      />
                    </div>
                  </div>
                </div>

                {/* Substance use */}
                <div>
                  <h3 className='mb-3 text-sm font-semibold'>Substance Use</h3>
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='space-y-2'>
                      <Label>Smoking Status</Label>
                      <Select
                        onValueChange={(v) => setValue('smoking_status', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='Never'>Never</SelectItem>
                          <SelectItem value='Former'>Former</SelectItem>
                          <SelectItem value='Current'>Current</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label>Alcohol Status</Label>
                      <Select
                        onValueChange={(v) => setValue('alcohol_status', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='None'>None</SelectItem>
                          <SelectItem value='Social'>Social</SelectItem>
                          <SelectItem value='Moderate'>Moderate</SelectItem>
                          <SelectItem value='Heavy'>Heavy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label>Recreational Drugs</Label>
                      <Select
                        onValueChange={(v) => setValue('recreational_drugs', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='None'>None</SelectItem>
                          <SelectItem value='Former'>Former</SelectItem>
                          <SelectItem value='Current'>Current</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Exercise */}
                <div>
                  <h3 className='mb-3 text-sm font-semibold'>
                    Exercise & Diet
                  </h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Exercise Frequency</Label>
                      <Select
                        onValueChange={(v) => setValue('exercise_frequency', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='Sedentary'>Sedentary</SelectItem>
                          <SelectItem value='1-2x/week'>1-2x/week</SelectItem>
                          <SelectItem value='3-4x/week'>3-4x/week</SelectItem>
                          <SelectItem value='5+/week'>5+/week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label>Exercise Type</Label>
                      <Input
                        placeholder='Running, Weight training'
                        {...register('exercise_type')}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Diet Type</Label>
                      <Input
                        placeholder='Regular, Vegetarian, Keto'
                        {...register('diet_type')}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Dietary Restrictions</Label>
                      <Input
                        placeholder='Gluten-free, Dairy-free'
                        {...register('dietary_restrictions')}
                      />
                    </div>
                  </div>
                </div>

                {/* Caffeine */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Caffeine Use</Label>
                    <Input
                      placeholder='2 cups/day'
                      {...register('caffeine_use')}
                    />
                  </div>
                </div>

                {/* Sleep */}
                <div>
                  <h3 className='mb-3 text-sm font-semibold'>Sleep</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Hours per Night</Label>
                      <Input
                        placeholder='7-8'
                        {...register('sleep_hours_per_night')}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Sleep Quality</Label>
                      <Select
                        onValueChange={(v) => setValue('sleep_quality', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='Good'>Good</SelectItem>
                          <SelectItem value='Fair'>Fair</SelectItem>
                          <SelectItem value='Poor'>Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Social notes */}
                <div className='space-y-2'>
                  <Label>Social History Notes</Label>
                  <Textarea
                    rows={3}
                    placeholder='Additional notes...'
                    {...register('social_history_notes')}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ TAB 4: Medical History ════════════════════════════════════ */}
          <TabsContent value='medical'>
            <Card>
              <CardHeader>
                <CardTitle>Medical History</CardTitle>
                <CardDescription>
                  Chronic conditions, family history, review of systems,
                  medications & surgeries
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Chronic */}
                <div>
                  <h3 className='mb-3 text-sm font-semibold'>
                    Chronic Conditions
                  </h3>
                  <div className='grid grid-cols-3 gap-3'>
                    <CheckField
                      name='chronic_conditions_hypertension'
                      label='Hypertension'
                    />
                    <CheckField
                      name='chronic_conditions_diabetes'
                      label='Diabetes'
                    />
                    <CheckField
                      name='chronic_conditions_asthma'
                      label='Asthma'
                    />
                    <CheckField
                      name='chronic_conditions_heart_disease'
                      label='Heart Disease'
                    />
                    <CheckField name='chronic_conditions_other' label='Other' />
                  </div>
                  {watch('chronic_conditions_other') && (
                    <div className='mt-2 space-y-2'>
                      <Label>Specify Other</Label>
                      <Input {...register('chronic_conditions_other_detail')} />
                    </div>
                  )}
                </div>

                {/* Family history */}
                <div>
                  <h3 className='mb-3 text-sm font-semibold'>Family History</h3>
                  <div className='grid grid-cols-3 gap-3'>
                    <CheckField
                      name='family_history_heart_disease'
                      label='Heart Disease'
                    />
                    <CheckField
                      name='family_history_diabetes'
                      label='Diabetes'
                    />
                    <CheckField name='family_history_cancer' label='Cancer' />
                    <CheckField name='family_history_stroke' label='Stroke' />
                    <CheckField
                      name='family_history_hypertension'
                      label='Hypertension'
                    />
                    <CheckField
                      name='family_history_mental_illness'
                      label='Mental Illness'
                    />
                    <CheckField name='family_history_other' label='Other' />
                  </div>
                  {watch('family_history_other') && (
                    <div className='mt-2 space-y-2'>
                      <Label>Specify Other</Label>
                      <Input {...register('family_history_other_detail')} />
                    </div>
                  )}
                </div>

                {/* Review of Systems */}
                <div>
                  <h3 className='mb-3 text-sm font-semibold'>
                    Review of Systems
                  </h3>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    {/* Cardiovascular */}
                    <div>
                      <p className='text-muted-foreground mb-2 text-xs font-medium'>
                        Cardiovascular
                      </p>
                      <div className='space-y-2'>
                        <CheckField
                          name='cardiovascular_chest_pain'
                          label='Chest Pain'
                        />
                        <CheckField
                          name='cardiovascular_palpitations'
                          label='Palpitations'
                        />
                        <CheckField
                          name='cardiovascular_swelling_of_extremities'
                          label='Swelling of Extremities'
                        />
                      </div>
                    </div>
                    {/* Constitutional */}
                    <div>
                      <p className='text-muted-foreground mb-2 text-xs font-medium'>
                        Constitutional
                      </p>
                      <div className='space-y-2'>
                        <CheckField name='constitutional_fever' label='Fever' />
                        <CheckField
                          name='constitutional_fatigue'
                          label='Fatigue'
                        />
                        <CheckField
                          name='constitutional_weight_loss'
                          label='Weight Loss'
                        />
                      </div>
                    </div>
                    {/* Respiratory */}
                    <div>
                      <p className='text-muted-foreground mb-2 text-xs font-medium'>
                        Respiratory
                      </p>
                      <div className='space-y-2'>
                        <CheckField name='respiratory_cough' label='Cough' />
                        <CheckField
                          name='respiratory_shortness_of_breath'
                          label='Shortness of Breath'
                        />
                        <CheckField
                          name='respiratory_wheezing'
                          label='Wheezing'
                        />
                      </div>
                    </div>
                    {/* Neurological */}
                    <div>
                      <p className='text-muted-foreground mb-2 text-xs font-medium'>
                        Neurological
                      </p>
                      <div className='space-y-2'>
                        <CheckField
                          name='neurological_headaches'
                          label='Headaches'
                        />
                        <CheckField
                          name='neurological_dizziness'
                          label='Dizziness'
                        />
                        <CheckField
                          name='neurological_numbness_tingling'
                          label='Numbness / Tingling'
                        />
                      </div>
                    </div>
                    {/* Psychiatric */}
                    <div>
                      <p className='text-muted-foreground mb-2 text-xs font-medium'>
                        Psychiatric
                      </p>
                      <div className='space-y-2'>
                        <CheckField
                          name='psychiatric_depression'
                          label='Depression'
                        />
                        <CheckField
                          name='psychiatric_anxiety'
                          label='Anxiety'
                        />
                        <CheckField
                          name='psychiatric_sleep_disturbances'
                          label='Sleep Disturbances'
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Free text */}
                <div>
                  <h3 className='mb-3 text-sm font-semibold'>
                    Medications & Surgeries
                  </h3>
                  <div className='grid grid-cols-1 gap-4'>
                    <div className='space-y-2'>
                      <Label>Current Medications</Label>
                      <Textarea
                        rows={2}
                        placeholder='Lisinopril 10mg, Metformin 500mg'
                        {...register('current_medications')}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Past Surgeries</Label>
                      <Textarea
                        rows={2}
                        placeholder='Appendectomy (2015)'
                        {...register('past_surgeries')}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Vaccinations</Label>
                      <Input
                        placeholder='COVID-19, Flu 2025, Tetanus'
                        {...register('vaccinations')}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Clinical Notes</Label>
                      <Textarea
                        rows={3}
                        placeholder='Additional clinical notes...'
                        {...register('clinical_notes')}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* ═══ TAB 5: Documents ═════════════════════════════════════ */}
          <TabsContent value='documents'>
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Attach intake documents, ID copies, insurance cards, referral
                  letters, etc. Files are staged locally and will be uploaded
                  automatically when you save.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StagedFileUploader ref={uploaderRef} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit */}
        <div className='mt-4 flex justify-end gap-3'>
          <Button asChild variant='outline'>
            <Link href='/dashboard/patients'>Cancel</Link>
          </Button>
          <Button type='submit' disabled={saving}>
            {saving ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Save className='mr-2 h-4 w-4' />
            )}
            {saving ? 'Saving...' : 'Save Patient'}
          </Button>
        </div>
      </form>
    </div>
  );
}
