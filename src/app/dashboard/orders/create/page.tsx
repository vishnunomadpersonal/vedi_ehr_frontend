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

export const metadata = { title: 'New Order — Vedi EHR' };

export default function CreateOrderPage() {
  return (
    <PageContainer pageTitle='' pageDescription=''>
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/dashboard/orders'>
              <IconArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <h2 className='text-2xl font-bold tracking-tight'>New Order</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Order</CardTitle>
            <CardDescription>
              Enter order details for lab, imaging, procedure, or referral.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>
              Order creation form coming soon. This will support lab orders,
              imaging requests, procedures, and referrals with ICD-10 code
              lookup.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
