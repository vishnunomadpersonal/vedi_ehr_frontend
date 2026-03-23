import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getList } from '@/constants/mock-data';
import { cn } from '@/lib/utils';
import type { Recording } from '@/types/ehr';
import { IconMicrophone, IconPlus } from '@tabler/icons-react';
import Link from 'next/link';

export const metadata = { title: 'AI Scribe — Recordings — Vedi EHR' };

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function statusVariant(
  status: Recording['status']
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'recording':
      return 'destructive';
    case 'processing':
    case 'transcribing':
      return 'secondary';
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default async function RecordingsPage() {
  const result = getList('recordings', {
    pagination: { current: 1, pageSize: 50 }
  });

  const recordings = result.data as Recording[];

  return (
    <PageContainer
      scrollable
      pageTitle='AI Scribe — Recordings'
      pageDescription='Ambient AI scribe recordings and transcriptions'
      pageHeaderAction={
        <Link
          href='/dashboard/recordings/live'
          className={cn(buttonVariants(), 'text-xs md:text-sm')}
        >
          <IconMicrophone className='mr-2 h-4 w-4' /> New Recording
        </Link>
      }
    >
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {recordings.map((recording) => (
          <Link
            key={recording.id}
            href={`/dashboard/recordings/${recording.id}`}
            className='block transition-shadow hover:shadow-md'
          >
            <Card>
              <CardHeader className='pb-2'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base'>
                    {recording.patient_name}
                  </CardTitle>
                  <Badge
                    variant={statusVariant(recording.status)}
                    className='capitalize'
                  >
                    {recording.status}
                  </Badge>
                </div>
                <CardDescription>{recording.provider_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='text-muted-foreground flex items-center justify-between text-sm'>
                  <span>{formatDuration(recording.duration_seconds)}</span>
                  <span>
                    {new Date(recording.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {recordings.length === 0 && (
          <div className='text-muted-foreground col-span-full py-12 text-center'>
            <IconPlus className='mx-auto mb-2 h-8 w-8' />
            <p>No recordings yet. Start a new session.</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
