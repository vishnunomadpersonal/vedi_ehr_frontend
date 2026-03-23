import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getList } from '@/constants/mock-data';
import type { Notification } from '@/types/ehr';

export const metadata = { title: 'Notifications — Vedi EHR' };

export default async function NotificationsPage() {
  const result = getList('notifications', {
    pagination: { current: 1, pageSize: 50 }
  });

  const notifications = result.data as Notification[];

  return (
    <PageContainer
      scrollable
      pageTitle='Notifications'
      pageDescription='View your notifications'
    >
      <div className='space-y-3'>
        {notifications.length === 0 ? (
          <Card>
            <CardContent className='py-8 text-center'>
              <p className='text-muted-foreground text-sm'>No notifications.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id}>
              <CardContent className='flex items-start justify-between gap-4 py-4'>
                <div className='min-w-0 flex-1 space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>
                      {notification.title}
                    </span>
                    <Badge variant='outline' className='text-xs capitalize'>
                      {notification.type}
                    </Badge>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    {notification.body}
                  </p>
                </div>
                <span className='text-muted-foreground shrink-0 text-xs'>
                  {new Date(notification.created_at).toLocaleDateString()}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  );
}
