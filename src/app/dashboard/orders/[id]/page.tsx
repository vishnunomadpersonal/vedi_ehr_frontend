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
  IconFlask,
  IconPhoto,
  IconEdit
} from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const metadata = { title: 'Order Details — Vedi EHR' };

type PageProps = { params: Promise<{ id: string }> };

export default async function OrderDetailPage(props: PageProps) {
  const params = await props.params;
  const order = getOne('orders', params.id);

  if (!order) {
    notFound();
  }

  const priorityVariant =
    order.priority === 'stat'
      ? 'destructive'
      : order.priority === 'urgent'
        ? 'outline'
        : 'secondary';

  const statusVariant =
    order.status === 'completed'
      ? 'default'
      : order.status === 'cancelled'
        ? 'destructive'
        : order.status === 'in_progress'
          ? 'secondary'
          : 'outline';

  return (
    <PageContainer pageTitle='' pageDescription=''>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='icon' asChild>
              <Link href='/dashboard/orders'>
                <IconArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                Order #{order.id}
              </h2>
              <p className='text-muted-foreground'>
                {order.patient_name} &middot; {order.ordering_provider_name}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant={priorityVariant} className='capitalize'>
              {order.priority}
            </Badge>
            <Badge variant={statusVariant} className='capitalize'>
              {order.status.replace('_', ' ')}
            </Badge>
            <Button variant='outline' size='sm' asChild>
              <Link href={`/dashboard/orders/${order.id}`}>
                <IconEdit className='mr-2 h-4 w-4' /> Edit
              </Link>
            </Button>
          </div>
        </div>

        <Separator />

        <div className='grid gap-6 md:grid-cols-2'>
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>General order information</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Order Type
                  </p>
                  <p className='capitalize'>{order.type}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Code
                  </p>
                  <p>{order.code || '—'}</p>
                </div>
                <div className='col-span-2'>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Description
                  </p>
                  <p>{order.description}</p>
                </div>
                <div className='col-span-2'>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Clinical Indication
                  </p>
                  <p>{order.clinical_indication || '—'}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Diagnosis Codes
                  </p>
                  <div className='flex flex-wrap gap-1'>
                    {order.diagnosis_codes?.length ? (
                      order.diagnosis_codes.map((code) => (
                        <Badge key={code} variant='outline'>
                          {code}
                        </Badge>
                      ))
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Ordered Date
                  </p>
                  <p>
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>
              {order.notes && (
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>
                    Notes
                  </p>
                  <p className='text-sm'>{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
              <CardDescription>Order progress tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Status timeline visualization coming soon. This will show the
                full lifecycle of the order from creation through completion.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Lab results, imaging reports, and procedure outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex gap-4'>
              <Button variant='outline' asChild>
                <Link href={`/dashboard/orders/${order.id}/results`}>
                  <IconFlask className='mr-2 h-4 w-4' /> Lab Results
                </Link>
              </Button>
              <Button variant='outline' asChild>
                <Link href={`/dashboard/orders/${order.id}/imaging`}>
                  <IconPhoto className='mr-2 h-4 w-4' /> Imaging Results
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
