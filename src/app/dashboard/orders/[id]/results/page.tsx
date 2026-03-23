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

export const metadata = { title: 'Lab Results — Vedi EHR' };

type PageProps = { params: Promise<{ id: string }> };

export default async function LabResultsPage(props: PageProps) {
  const params = await props.params;
  const orderId = params.id;

  return (
    <PageContainer pageTitle='' pageDescription=''>
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href={`/dashboard/orders/${orderId}`}>
              <IconArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Lab Results</h2>
            <p className='text-muted-foreground'>Order #{orderId}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lab Results</CardTitle>
            <CardDescription>
              Test results, reference ranges, and flags
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>
              Lab results display coming soon. This will show test values with
              reference ranges, abnormal flags, and trend visualizations.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
