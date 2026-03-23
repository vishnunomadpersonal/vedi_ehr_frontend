import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';

export const metadata = { title: 'New Prescription — Vedi EHR' };

export default function CreatePrescriptionPage() {
  return (
    <PageContainer pageTitle='' pageDescription=''>
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/dashboard/prescriptions'>
              <IconArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <h2 className='text-2xl font-bold tracking-tight'>
            New Prescription
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Prescription</CardTitle>
            <CardDescription>
              Enter medication details, dosage, and pharmacy information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>
              Prescription creation form coming soon. This will support
              medication search, dosage calculation, drug interaction checks,
              and e-prescribing.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
