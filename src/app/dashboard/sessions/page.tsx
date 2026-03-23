'use client';

import { useEhrList } from '@/hooks/use-ehr-data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Clock, ArrowRight } from 'lucide-react';
import type { Encounter } from '@/types';
import PageContainer from '@/components/layout/page-container';

export default function SessionsPage() {
  // Show encounters that are in_progress (recordable)
  const { result: activeResult } = useEhrList<Encounter>({
    resource: 'encounters',
    pagination: { currentPage: 1, pageSize: 25 },
    filters: [
      { field: 'status', operator: 'in', value: ['in_progress', 'scheduled'] }
    ]
  });

  const { result: completedResult } = useEhrList<Encounter>({
    resource: 'encounters',
    pagination: { currentPage: 1, pageSize: 10 },
    filters: [{ field: 'status', operator: 'eq', value: 'completed' }]
  });

  const activeEncounters = activeResult?.data || [];
  const completedEncounters = completedResult?.data || [];

  return (
    <PageContainer scrollable>
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Audio Sessions</h1>
          <p className='text-muted-foreground text-sm'>
            Record doctor-patient sessions and view transcripts
          </p>
        </div>

        {/* Active / Recordable Encounters */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Mic className='h-5 w-5 text-red-500' />
              Ready to Record
            </CardTitle>
            <CardDescription>
              Active encounters available for recording
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeEncounters.length === 0 ? (
              <div className='text-muted-foreground py-8 text-center'>
                <Mic className='mx-auto mb-2 h-8 w-8 opacity-50' />
                <p>No active encounters to record.</p>
                <Button asChild variant='link' className='mt-1'>
                  <Link href='/dashboard/encounters/create'>
                    Create an encounter first
                  </Link>
                </Button>
              </div>
            ) : (
              <div className='space-y-3'>
                {activeEncounters.map((encounter) => (
                  <div
                    key={encounter.id}
                    className='hover:bg-accent/50 flex items-center justify-between rounded-lg border p-4 transition-colors'
                  >
                    <div>
                      <p className='font-medium'>{encounter.patient_name}</p>
                      <p className='text-muted-foreground text-sm'>
                        {encounter.chief_complaint || 'No complaint noted'}{' '}
                        &middot;{' '}
                        <span className='capitalize'>
                          {encounter.encounter_type.replace('_', ' ')}
                        </span>
                      </p>
                      {encounter.scheduled_at && (
                        <p className='text-muted-foreground mt-1 flex items-center gap-1 text-xs'>
                          <Clock className='h-3 w-3' />
                          {new Date(encounter.scheduled_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className='flex items-center gap-3'>
                      <Badge
                        variant={
                          encounter.status === 'in_progress'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {encounter.status.replace('_', ' ')}
                      </Badge>
                      <Button asChild>
                        <Link
                          href={`/dashboard/sessions/${encounter.id}/record`}
                        >
                          <Mic className='mr-2 h-4 w-4' />
                          Record
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed with Recordings */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Completed Sessions</CardTitle>
                <CardDescription>
                  Past encounters with recordings
                </CardDescription>
              </div>
              <Button asChild variant='ghost' size='sm'>
                <Link href='/dashboard/encounters'>
                  All encounters <ArrowRight className='ml-1 h-4 w-4' />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {completedEncounters.length === 0 ? (
              <p className='text-muted-foreground py-4 text-center text-sm'>
                No completed sessions yet.
              </p>
            ) : (
              <div className='space-y-3'>
                {completedEncounters.map((encounter) => (
                  <Link
                    key={encounter.id}
                    href={`/dashboard/encounters/${encounter.id}`}
                    className='hover:bg-accent flex items-center justify-between rounded-lg border p-3 transition-colors'
                  >
                    <div>
                      <p className='text-sm font-medium'>
                        {encounter.patient_name}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        {encounter.chief_complaint}
                      </p>
                    </div>
                    <Badge variant='default'>completed</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
