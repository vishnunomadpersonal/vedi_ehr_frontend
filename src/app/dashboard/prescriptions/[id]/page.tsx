import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getOne } from '@/constants/mock-data';
import {
  IconArrowLeft,
  IconEdit,
  IconRefresh,
  IconAlertTriangle
} from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const metadata = { title: 'Prescription Details — Vedi EHR' };

type PageProps = { params: Promise<{ id: string }> };

export default async function PrescriptionDetailPage(props: PageProps) {
  const params = await props.params;
  const prescription = getOne('prescriptions', params.id);

  if (!prescription) {
    notFound();
  }

  const statusVariant =
    prescription.status === 'active'
      ? 'default'
      : prescription.status === 'expired'
        ? 'destructive'
        : prescription.status === 'on_hold'
          ? 'outline'
          : prescription.status === 'cancelled'
            ? 'destructive'
            : 'secondary';

  return (
    <PageContainer pageTitle='' pageDescription=''>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='icon' asChild>
              <Link href='/dashboard/prescriptions'>
                <IconArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                {prescription.medication.name}
              </h2>
              <p className='text-muted-foreground'>
                {prescription.patient_name} &middot;{' '}
                {prescription.prescriber_name}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant={statusVariant} className='capitalize'>
              {prescription.status.replace('_', ' ')}
            </Badge>
            <Button variant='outline' size='sm'>
              <IconEdit className='mr-2 h-4 w-4' /> Edit
            </Button>
            <Button variant='outline' size='sm'>
              <IconRefresh className='mr-2 h-4 w-4' /> Renew
            </Button>
          </div>
        </div>

        <Separator />

        <div className='grid gap-6 md:grid-cols-2'>
          {/* Medication Details */}
          <Card>
            <CardHeader>
              <CardTitle>Medication Details</CardTitle>
              <CardDescription>Prescription information</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Medication
                  </p>
                  <p className='font-bold'>{prescription.medication.name}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Generic Name
                  </p>
                  <p>{prescription.medication.generic_name}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Dosage
                  </p>
                  <p>
                    {prescription.medication.dose}{' '}
                    {prescription.medication.dose_unit}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Frequency
                  </p>
                  <p>{prescription.medication.frequency}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Route
                  </p>
                  <p className='capitalize'>{prescription.medication.route}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Form
                  </p>
                  <p className='capitalize'>{prescription.medication.form}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Quantity
                  </p>
                  <p>
                    {prescription.quantity} {prescription.quantity_unit}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Days Supply
                  </p>
                  <p>{prescription.days_supply} days</p>
                </div>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>
                  Directions (SIG)
                </p>
                <p>{prescription.sig}</p>
              </div>
            </CardContent>
          </Card>

          {/* Refills & Pharmacy */}
          <Card>
            <CardHeader>
              <CardTitle>Refills & Pharmacy</CardTitle>
              <CardDescription>
                Refill status and pharmacy details
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Refills Remaining
                  </p>
                  <p>
                    {prescription.refills_remaining} /{' '}
                    {prescription.refills_authorized}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Start Date
                  </p>
                  <p>
                    {new Date(prescription.start_date).toLocaleDateString()}
                  </p>
                </div>
                {prescription.end_date && (
                  <div>
                    <p className='text-muted-foreground text-sm font-medium'>
                      End Date
                    </p>
                    <p>
                      {new Date(prescription.end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Pharmacy
                  </p>
                  <p>{prescription.pharmacy_name}</p>
                </div>
              </div>
              {prescription.is_controlled && (
                <div className='flex items-center gap-2 rounded-md border p-3'>
                  <IconAlertTriangle className='h-4 w-4 text-yellow-600' />
                  <span className='text-sm'>
                    Controlled Substance — Schedule {prescription.dea_schedule}
                  </span>
                </div>
              )}
              {prescription.notes && (
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Notes
                  </p>
                  <p className='text-sm'>{prescription.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Drug Interactions */}
        <Card>
          <CardHeader>
            <CardTitle>Drug Interactions</CardTitle>
            <CardDescription>
              Known interactions with current medications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant='outline' asChild>
              <Link href='/dashboard/prescriptions/interactions'>
                <IconAlertTriangle className='mr-2 h-4 w-4' /> Check
                Interactions
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
