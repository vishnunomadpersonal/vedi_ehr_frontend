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
import { getList } from '@/constants/mock-data';
import type { TelehealthSession } from '@/types/ehr';
import { cn } from '@/lib/utils';
import {
  IconVideo,
  IconPlus,
  IconClock,
  IconUser,
  IconStethoscope
} from '@tabler/icons-react';
import Link from 'next/link';

export const metadata = { title: 'Telehealth Sessions — Vedi EHR' };

const statusConfig: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  waiting: { label: 'Waiting', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'destructive' }
};

export default async function TelehealthPage() {
  const { data: sessions } = getList('telehealth_sessions');

  return (
    <PageContainer
      scrollable
      pageTitle='Telehealth Sessions'
      pageDescription='Manage virtual visits and video consultations'
      pageHeaderAction={
        <Link
          href='/dashboard/telehealth/waiting-room'
          className={cn(buttonVariants(), 'text-xs md:text-sm')}
        >
          <IconPlus className='mr-2 h-4 w-4' /> New Session
        </Link>
      }
    >
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {sessions.map((session: TelehealthSession) => {
          const config = statusConfig[session.status] ?? statusConfig.waiting;
          const scheduledDate = new Date(session.scheduled_start);

          return (
            <Card key={session.id} className='flex flex-col'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base'>
                    {session.room_name}
                  </CardTitle>
                  <Badge
                    variant={config.variant}
                    className={cn(
                      session.status === 'waiting' &&
                        'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
                      session.status === 'in_progress' &&
                        'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
                      session.status === 'completed' &&
                        'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                    )}
                  >
                    {config.label}
                  </Badge>
                </div>
                <CardDescription>Session #{session.id}</CardDescription>
              </CardHeader>
              <CardContent className='flex flex-1 flex-col gap-3'>
                <div className='flex items-center gap-2 text-sm'>
                  <IconUser className='text-muted-foreground h-4 w-4' />
                  <span className='font-medium'>{session.patient_name}</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <IconStethoscope className='text-muted-foreground h-4 w-4' />
                  <span>{session.provider_name}</span>
                </div>
                <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <IconClock className='h-4 w-4' />
                  <span>
                    {scheduledDate.toLocaleDateString()}{' '}
                    {scheduledDate.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className='mt-auto pt-3'>
                  <Link
                    href={
                      session.room_url || '/dashboard/telehealth/waiting-room'
                    }
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'w-full'
                    )}
                  >
                    <IconVideo className='mr-2 h-4 w-4' />
                    {session.status === 'waiting'
                      ? 'Join Room'
                      : session.status === 'in_progress'
                        ? 'Rejoin'
                        : 'View Details'}
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
