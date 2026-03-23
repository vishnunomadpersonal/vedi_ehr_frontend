import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getList } from '@/constants/mock-data';
import type { AuditEntry } from '@/types/ehr';
import {
  IconClock,
  IconUser,
  IconNetwork,
  IconShieldLock
} from '@tabler/icons-react';

export const metadata = { title: 'Audit Log — Vedi EHR' };

const actionVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  create: 'default',
  read: 'outline',
  update: 'secondary',
  delete: 'destructive',
  export: 'secondary',
  print: 'outline',
  sign: 'default',
  lock: 'destructive'
};

export default async function AuditLogPage() {
  const { data: entries } = getList('audit_log');

  return (
    <PageContainer
      scrollable
      pageTitle='Audit Log'
      pageDescription='Track all system access, changes, and PHI access events'
    >
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {(entries as AuditEntry[]).map((entry) => (
              <div
                key={entry.id}
                className='border-muted flex items-start gap-4 border-l-2 pl-4'
              >
                <div className='flex-1 space-y-1'>
                  <div className='flex items-center gap-2'>
                    <IconUser className='text-muted-foreground h-3.5 w-3.5' />
                    <span className='text-sm font-medium'>
                      {entry.user_name}
                    </span>
                    <Badge
                      variant={actionVariant[entry.action] ?? 'outline'}
                      className='text-xs'
                    >
                      {entry.action}
                    </Badge>
                    {entry.phi_accessed && (
                      <Badge variant='destructive' className='text-xs'>
                        <IconShieldLock className='mr-1 h-3 w-3' />
                        PHI
                      </Badge>
                    )}
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    {entry.resource_type}{' '}
                    <span className='font-mono text-xs'>
                      {entry.resource_id}
                    </span>
                    {entry.resource_label && (
                      <span> — {entry.resource_label}</span>
                    )}
                  </p>
                  <div className='text-muted-foreground flex items-center gap-4 text-xs'>
                    <span className='flex items-center gap-1'>
                      <IconClock className='h-3 w-3' />
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    <span className='flex items-center gap-1'>
                      <IconNetwork className='h-3 w-3' />
                      {entry.ip_address}
                    </span>
                  </div>
                  {entry.details && (
                    <p className='text-muted-foreground text-xs'>
                      {entry.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
