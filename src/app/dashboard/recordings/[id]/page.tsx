import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { getOne } from '@/constants/mock-data';
import { cn } from '@/lib/utils';
import type { Recording } from '@/types/ehr';
import { IconPlayerPlay, IconFileText, IconNotes } from '@tabler/icons-react';
import Link from 'next/link';

export const metadata = { title: 'Recording Detail — Vedi EHR' };

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

type PageProps = { params: Promise<{ id: string }> };

export default async function RecordingDetailPage(props: PageProps) {
  const { id } = await props.params;
  const recording = getOne('recordings', id) as Recording;

  return (
    <PageContainer scrollable pageTitle='Recording Detail'>
      <div className='space-y-6'>
        {/* Quick‑nav */}
        <div className='flex flex-wrap gap-2'>
          <Link
            href={`/dashboard/recordings/${id}/playback`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <IconPlayerPlay className='mr-2 h-4 w-4' /> Playback
          </Link>
          <Link
            href={`/dashboard/recordings/${id}/transcript`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <IconFileText className='mr-2 h-4 w-4' /> Full Transcript
          </Link>
          <Link
            href={`/dashboard/recordings/${id}/ai-notes`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <IconNotes className='mr-2 h-4 w-4' /> AI Notes
          </Link>
        </div>

        {/* Recording info */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Recording Information</CardTitle>
              <Badge
                variant={statusVariant(recording.status)}
                className='capitalize'
              >
                {recording.status}
              </Badge>
            </div>
            <CardDescription>Session #{recording.id}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className='grid gap-4 sm:grid-cols-2'>
              <div>
                <dt className='text-muted-foreground text-sm font-medium'>
                  Patient
                </dt>
                <dd className='text-sm'>{recording.patient_name}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-sm font-medium'>
                  Provider
                </dt>
                <dd className='text-sm'>{recording.provider_name}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-sm font-medium'>
                  Duration
                </dt>
                <dd className='text-sm'>
                  {formatDuration(recording.duration_seconds)}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-sm font-medium'>
                  Created
                </dt>
                <dd className='text-sm'>
                  {new Date(recording.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Transcript */}
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>
              AI-generated transcription of the recording
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='bg-muted/50 min-h-[120px] rounded-md border p-4 text-sm whitespace-pre-wrap'>
              {recording.transcript?.full_text ??
                'Transcript not yet available.'}
            </div>
          </CardContent>
        </Card>

        {/* AI SOAP Note */}
        <Card>
          <CardHeader>
            <CardTitle>AI-Generated SOAP Note</CardTitle>
            <CardDescription>
              Structured clinical note generated from the transcript
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {recording.ai_soap_note ? (
              <>
                <div>
                  <h4 className='mb-1 text-sm font-semibold'>Subjective</h4>
                  <p className='text-muted-foreground text-sm'>
                    {recording.ai_soap_note.subjective}
                  </p>
                </div>
                <div>
                  <h4 className='mb-1 text-sm font-semibold'>Objective</h4>
                  <p className='text-muted-foreground text-sm'>
                    {recording.ai_soap_note.objective}
                  </p>
                </div>
                <div>
                  <h4 className='mb-1 text-sm font-semibold'>Assessment</h4>
                  <p className='text-muted-foreground text-sm'>
                    {recording.ai_soap_note.assessment}
                  </p>
                </div>
                <div>
                  <h4 className='mb-1 text-sm font-semibold'>Plan</h4>
                  <p className='text-muted-foreground text-sm'>
                    {recording.ai_soap_note.plan}
                  </p>
                </div>
              </>
            ) : (
              <p className='text-muted-foreground text-sm'>
                SOAP note not yet generated.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
