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
import { Badge } from '@/components/ui/badge';
import { IconMicrophone } from '@tabler/icons-react';
import { useState } from 'react';

type SessionStatus = 'idle' | 'recording' | 'paused' | 'processing';

export default function LiveRecordingPage() {
  const [status, setStatus] = useState<SessionStatus>('idle');

  function handleToggle() {
    setStatus((prev) => (prev === 'idle' ? 'recording' : 'idle'));
  }

  return (
    <PageContainer scrollable pageTitle='Live Recording Session'>
      <div className='mx-auto max-w-2xl space-y-6'>
        <Card>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>AI Scribe — Live Session</CardTitle>
            <CardDescription>
              Record a patient encounter with ambient AI transcription
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col items-center gap-6'>
            {/* Status indicator */}
            <Badge
              variant={status === 'recording' ? 'destructive' : 'secondary'}
              className='text-sm'
            >
              {status === 'idle' && 'Ready'}
              {status === 'recording' && '● Recording'}
              {status === 'paused' && 'Paused'}
              {status === 'processing' && 'Processing…'}
            </Badge>

            {/* Microphone button */}
            <button
              onClick={handleToggle}
              className={`flex h-28 w-28 items-center justify-center rounded-full border-4 transition-colors ${
                status === 'recording'
                  ? 'animate-pulse border-red-500 bg-red-50 text-red-600 dark:bg-red-950'
                  : 'border-muted bg-muted/50 text-muted-foreground hover:border-primary hover:text-primary'
              }`}
              aria-label={
                status === 'recording' ? 'Stop recording' : 'Start recording'
              }
            >
              <IconMicrophone className='h-12 w-12' />
            </button>

            <Button size='lg' onClick={handleToggle}>
              {status === 'recording' ? 'Stop Recording' : 'Start Recording'}
            </Button>
          </CardContent>
        </Card>

        {/* Patient selector placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Patient</CardTitle>
            <CardDescription>
              Select the patient for this recording session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm'>
              Patient selector — coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
