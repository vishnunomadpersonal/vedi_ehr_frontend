'use client';

import { useForm } from 'react-hook-form';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { useState, useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import * as api from '@/lib/ehr-api';
import type { Patient } from '@/types';

const patientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  medical_record_number: z.string().min(1, 'MRN is required'),
  status: z.enum(['active', 'inactive', 'deceased']),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  notes: z.string().optional()
});

type PatientFormValues = z.infer<typeof patientSchema>;

export default function EditPatientPage() {
  const params = useParams();
  const router = useRouter();
  const [formLoading, setFormLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema) as any
  });

  // Load patient data
  useEffect(() => {
    async function load() {
      try {
        const patient = await api.getOne<Patient>(
          'patients',
          params.id as string
        );
        reset({
          first_name: patient.first_name ?? '',
          last_name: patient.last_name ?? '',
          date_of_birth: patient.date_of_birth ?? patient.dob ?? '',
          gender: (patient.gender as PatientFormValues['gender']) ?? 'male',
          email: patient.email ?? '',
          phone: patient.phone ?? '',
          medical_record_number: patient.medical_record_number ?? '',
          status: (patient.status as PatientFormValues['status']) ?? 'active',
          allergies: Array.isArray(patient.allergies)
            ? patient.allergies.join(', ')
            : String(patient.allergies ?? ''),
          medications: Array.isArray(patient.medications)
            ? patient.medications.join(', ')
            : String(patient.medications ?? ''),
          notes: String(patient.notes ?? '')
        });
      } catch (err) {
        toast.error('Failed to load patient');
      } finally {
        setFormLoading(false);
      }
    }
    load();
  }, [params.id, reset]);

  const onSubmit = async (data: PatientFormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        allergies: data.allergies
          ? data.allergies.split(',').map((a: string) => a.trim())
          : [],
        medications: data.medications
          ? data.medications.split(',').map((m: string) => m.trim())
          : []
      };
      await api.update(
        'patients',
        params.id as string,
        payload as unknown as Record<string, unknown>
      );
      toast.success('Patient updated successfully');
      router.push(`/dashboard/patients/${params.id}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update patient'
      );
    } finally {
      setSaving(false);
    }
  };

  if (formLoading) {
    return (
      <div className='max-w-3xl space-y-4'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-64 w-full' />
      </div>
    );
  }

  return (
    <div className='max-w-3xl space-y-4'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button asChild variant='ghost' size='icon'>
          <Link href={`/dashboard/patients/${params.id}`}>
            <ArrowLeft className='h-4 w-4' />
          </Link>
        </Button>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Edit Patient</h1>
          <p className='text-muted-foreground'>Update patient information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue='demographics' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='demographics'>Demographics</TabsTrigger>
            <TabsTrigger value='clinical'>Clinical</TabsTrigger>
          </TabsList>

          {/* Demographics */}
          <TabsContent value='demographics'>
            <Card>
              <CardHeader>
                <CardTitle>Demographics</CardTitle>
                <CardDescription>Basic patient information</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='first_name'>First Name *</Label>
                    <Input id='first_name' {...register('first_name')} />
                    {errors.first_name && (
                      <p className='text-destructive text-sm'>
                        {String(errors.first_name.message)}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='last_name'>Last Name *</Label>
                    <Input id='last_name' {...register('last_name')} />
                    {errors.last_name && (
                      <p className='text-destructive text-sm'>
                        {String(errors.last_name.message)}
                      </p>
                    )}
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='date_of_birth'>Date of Birth *</Label>
                    <Input
                      id='date_of_birth'
                      type='date'
                      {...register('date_of_birth')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='gender'>Gender *</Label>
                    <Select
                      value={watch('gender')}
                      onValueChange={(v) =>
                        setValue('gender', v as PatientFormValues['gender'])
                      }
                    >
                      <SelectTrigger id='gender'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='male'>Male</SelectItem>
                        <SelectItem value='female'>Female</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                        <SelectItem value='prefer_not_to_say'>
                          Prefer not to say
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input id='email' type='email' {...register('email')} />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Phone</Label>
                    <Input id='phone' type='tel' {...register('phone')} />
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='medical_record_number'>MRN *</Label>
                    <Input
                      id='medical_record_number'
                      {...register('medical_record_number')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='status'>Status</Label>
                    <Select
                      value={watch('status')}
                      onValueChange={(v) =>
                        setValue('status', v as PatientFormValues['status'])
                      }
                    >
                      <SelectTrigger id='status'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='active'>Active</SelectItem>
                        <SelectItem value='inactive'>Inactive</SelectItem>
                        <SelectItem value='deceased'>Deceased</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clinical */}
          <TabsContent value='clinical'>
            <Card>
              <CardHeader>
                <CardTitle>Clinical Information</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='allergies'>Allergies</Label>
                  <Input
                    id='allergies'
                    placeholder='Comma-separated'
                    {...register('allergies')}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='medications'>Medications</Label>
                  <Input
                    id='medications'
                    placeholder='Comma-separated'
                    {...register('medications')}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='notes'>Notes</Label>
                  <Textarea id='notes' rows={4} {...register('notes')} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit */}
        <div className='mt-4 flex justify-end gap-3'>
          <Button asChild variant='outline'>
            <Link href={`/dashboard/patients/${params.id}`}>Cancel</Link>
          </Button>
          <Button type='submit' disabled={saving}>
            <Save className='mr-2 h-4 w-4' />
            {saving ? 'Saving...' : 'Update Patient'}
          </Button>
        </div>
      </form>
    </div>
  );
}
