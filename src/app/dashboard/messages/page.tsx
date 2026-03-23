import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getList } from '@/constants/mock-data';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/ehr';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';

export const metadata = { title: 'Messages — Vedi EHR' };

export default async function MessagesPage() {
  const result = getList('messages', {
    pagination: { current: 1, pageSize: 50 }
  });

  const messages = result.data as Message[];

  return (
    <PageContainer
      scrollable
      pageTitle='Messages'
      pageDescription='View and manage your inbox'
      pageHeaderAction={
        <Link
          href='/dashboard/messages/compose'
          className={cn(buttonVariants(), 'text-xs md:text-sm')}
        >
          <IconPlus className='mr-2 h-4 w-4' /> Compose
        </Link>
      }
    >
      <div className='space-y-3'>
        {messages.length === 0 ? (
          <Card>
            <CardContent className='py-8 text-center'>
              <p className='text-muted-foreground text-sm'>
                No messages in your inbox.
              </p>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Link
              key={message.id}
              href={`/dashboard/messages/${message.id}`}
              className='block'
            >
              <Card className='hover:bg-muted/50 transition-colors'>
                <CardContent className='flex items-start justify-between gap-4 py-4'>
                  <div className='min-w-0 flex-1 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium'>
                        {message.from_user_name}
                      </span>
                      {message.priority === 'urgent' && (
                        <Badge variant='destructive' className='text-xs'>
                          Urgent
                        </Badge>
                      )}
                      <Badge variant='outline' className='text-xs capitalize'>
                        {message.type}
                      </Badge>
                    </div>
                    <p
                      className={cn(
                        'truncate text-sm',
                        !message.is_read
                          ? 'text-foreground font-bold'
                          : 'text-muted-foreground'
                      )}
                    >
                      {message.subject}
                    </p>
                  </div>
                  <span className='text-muted-foreground shrink-0 text-xs'>
                    {new Date(message.created_at).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </PageContainer>
  );
}
