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
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

const CATEGORY_OPTIONS = [
  { value: 'clinical', label: 'Clinical' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'billing', label: 'Billing' },
  { value: 'patient_communication', label: 'Patient Communication' }
];

export default function ComposeMessagePage() {
  return (
    <PageContainer
      pageTitle='Compose Message'
      pageDescription='Send a new message'
    >
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/dashboard/messages'>
              <IconArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <h2 className='text-2xl font-bold'>Compose Message</h2>
        </div>

        <Card className='max-w-2xl'>
          <CardHeader>
            <CardTitle>New Message</CardTitle>
            <CardDescription>
              Compose and send a message to a recipient
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='to'>To</Label>
              <Input id='to' placeholder='Recipient name or search…' />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='subject'>Subject</Label>
              <Input id='subject' placeholder='Message subject' />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='category'>Category</Label>
              <Select>
                <SelectTrigger id='category'>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='body'>Message</Label>
              <Textarea id='body' placeholder='Type your message…' rows={8} />
            </div>

            <div className='flex gap-2 pt-4'>
              <Button type='submit'>Send Message</Button>
              <Button variant='outline' asChild>
                <Link href='/dashboard/messages'>Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
