import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  IconUsers,
  IconShield,
  IconStethoscope,
  IconSettings,
  IconFileText,
  IconHeartbeat
} from '@tabler/icons-react';
import Link from 'next/link';

export const metadata = { title: 'Administration — Vedi EHR' };

const adminFeatures = [
  {
    title: 'Users',
    description: 'Manage user accounts, roles, and access permissions',
    href: '/dashboard/admin/users',
    icon: IconUsers,
    count: 12
  },
  {
    title: 'Roles',
    description: 'Configure role-based access control and permissions',
    href: '/dashboard/admin/roles',
    icon: IconShield,
    count: 5
  },
  {
    title: 'Providers',
    description: 'Provider directory, credentials, and scheduling templates',
    href: '/dashboard/admin/providers',
    icon: IconStethoscope,
    count: 8
  },
  {
    title: 'Settings',
    description: 'System-wide configuration and feature toggles',
    href: '/dashboard/admin/settings',
    icon: IconSettings,
    count: 24
  },
  {
    title: 'Audit Log',
    description: 'Track all system access, changes, and PHI access events',
    href: '/dashboard/admin/audit-log',
    icon: IconFileText,
    count: 156
  },
  {
    title: 'System Health',
    description: 'Monitor service status, uptime, and system performance',
    href: '/dashboard/admin/health',
    icon: IconHeartbeat,
    count: undefined
  }
];

export default async function AdminPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Administration'
      pageDescription='Manage system settings, users, and configuration'
    >
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {adminFeatures.map((feature) => (
          <Link key={feature.title} href={feature.href}>
            <Card className='h-full transition-shadow hover:shadow-md'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-muted flex h-9 w-9 items-center justify-center rounded-lg'>
                      <feature.icon className='text-muted-foreground h-5 w-5' />
                    </div>
                    <CardTitle className='text-base'>{feature.title}</CardTitle>
                  </div>
                  {feature.count !== undefined && (
                    <Badge variant='secondary'>{feature.count}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
