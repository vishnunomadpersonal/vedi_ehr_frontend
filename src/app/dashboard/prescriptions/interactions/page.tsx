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

export const metadata = { title: 'Drug Interactions — Vedi EHR' };

export default function DrugInteractionsPage() {
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
            <h2 className='text-2xl font-bold tracking-tight'>
              Drug Interactions
            </h2>
            <p className='text-muted-foreground'>
              Check for potential drug-drug interactions
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interaction Checker</CardTitle>
            <CardDescription>
              Review potential interactions between patient medications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>
              Drug interaction checker coming soon. This will cross-reference
              all active medications and flag potential interactions by severity
              (minor, moderate, major, contraindicated).
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
