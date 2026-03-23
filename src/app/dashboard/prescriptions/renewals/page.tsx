import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

export const metadata = { title: 'Renewal Queue — Vedi EHR' };

export default function RenewalsPage() {
  return (
    <PageContainer pageTitle='' pageDescription=''>
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/dashboard/prescriptions'>
              <IconArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Renewal Queue</h2>
            <p className='text-muted-foreground'>
              Pending prescription renewal requests
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Renewals</CardTitle>
            <CardDescription>
              Review and approve prescription renewal requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>
              Prescription renewal queue coming soon. This will display pending
              renewal requests with patient info, medication details, and
              one-click approve/deny actions.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
