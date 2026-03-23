'use client';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
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
import { CLAIM_STATUS_OPTIONS } from '@/features/billing/components/claim-tables/options';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

export default function CreateClaimPage() {
  return (
    <PageContainer
      pageTitle='New Claim'
      pageDescription='Create a new insurance claim'
    >
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/dashboard/billing'>
              <IconArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <h2 className='text-2xl font-bold'>New Claim</h2>
        </div>

        <Card className='max-w-2xl'>
          <CardHeader>
            <CardTitle>Claim Details</CardTitle>
            <CardDescription>
              Fill in the details to create a new insurance claim
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='patient'>Patient</Label>
              <Input
                id='patient'
                placeholder='Search for a patient…'
                disabled
              />
              <p className='text-muted-foreground text-xs'>
                Patient search coming soon.
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='insurance'>Insurance Provider</Label>
              <Input id='insurance' placeholder='Enter insurance provider' />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='service_date'>Service Date</Label>
                <Input id='service_date' type='date' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='total_amount'>Total Amount</Label>
                <Input
                  id='total_amount'
                  type='number'
                  placeholder='0.00'
                  step='0.01'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes</Label>
              <Textarea id='notes' placeholder='Add any notes…' rows={3} />
            </div>

            <div className='flex gap-2 pt-4'>
              <Button type='submit'>Submit Claim</Button>
              <Button variant='outline' asChild>
                <Link href='/dashboard/billing'>Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
