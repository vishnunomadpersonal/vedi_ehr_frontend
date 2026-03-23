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
import {
  IconVideo,
  IconMicrophone,
  IconScreenShare,
  IconPhoneOff,
  IconUser,
  IconWifi
} from '@tabler/icons-react';
import { useState } from 'react';

export default function WaitingRoomPage() {
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');

  // Simulate connection after mount
  useState(() => {
    const timer = setTimeout(() => setConnectionStatus('connected'), 2000);
    return () => clearTimeout(timer);
  });

  const statusColor =
    connectionStatus === 'connected'
      ? 'bg-green-500'
      : connectionStatus === 'connecting'
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <PageContainer
      scrollable
      pageTitle='Waiting Room'
      pageDescription='Prepare to join your telehealth session'
    >
      <div className='mx-auto max-w-3xl space-y-6'>
        {/* Connection Status */}
        <div className='flex items-center gap-2 text-sm'>
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${statusColor}`}
          />
          <span className='capitalize'>{connectionStatus}</span>
          <IconWifi className='text-muted-foreground ml-1 h-4 w-4' />
        </div>

        {/* Video Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Video Preview</CardTitle>
            <CardDescription>
              Your camera preview will appear below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='bg-muted flex aspect-video items-center justify-center rounded-lg'>
              <div className='text-muted-foreground flex flex-col items-center gap-3'>
                <IconVideo className='h-16 w-16' />
                <p className='text-sm'>Camera preview</p>
              </div>
            </div>

            {/* Controls */}
            <div className='mt-4 flex items-center justify-center gap-3'>
              <Button variant='outline' size='icon'>
                <IconMicrophone className='h-5 w-5' />
              </Button>
              <Button variant='outline' size='icon'>
                <IconVideo className='h-5 w-5' />
              </Button>
              <Button variant='outline' size='icon'>
                <IconScreenShare className='h-5 w-5' />
              </Button>
              <Button variant='destructive' size='icon'>
                <IconPhoneOff className='h-5 w-5' />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Patient Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-full'>
                <IconUser className='text-muted-foreground h-5 w-5' />
              </div>
              <div>
                <p className='font-medium'>Patient will appear here</p>
                <p className='text-muted-foreground text-sm'>
                  Waiting for patient to connect...
                </p>
              </div>
              <Badge
                variant='outline'
                className='ml-auto border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
              >
                Waiting
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Join Button */}
        <div className='flex justify-center'>
          <Button
            size='lg'
            className='min-w-48'
            disabled={connectionStatus !== 'connected'}
          >
            <IconVideo className='mr-2 h-5 w-5' />
            Join Session
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
