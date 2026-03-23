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

export const metadata = { title: 'Imaging Results — Vedi EHR' };

type PageProps = { params: Promise<{ id: string }> };

export default async function ImagingResultsPage(props: PageProps) {
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
            <h2 className='text-2xl font-bold tracking-tight'>
              Imaging Results
            </h2>
            <p className='text-muted-foreground'>Order #{orderId}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Imaging Results</CardTitle>
            <CardDescription>
              Radiology reports, images, and impressions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>
              Imaging results viewer coming soon. This will display radiology
              reports with findings, impressions, and image thumbnails.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
