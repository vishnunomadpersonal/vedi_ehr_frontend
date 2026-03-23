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
  IconApi,
  IconDatabase,
  IconMessage,
  IconServer,
  IconUsers
} from '@tabler/icons-react';

export const metadata = { title: 'System Health — Vedi EHR' };

const services = [
  {
    title: 'API Status',
    description: 'REST & GraphQL API endpoints',
    icon: IconApi,
    status: 'Operational',
    healthy: true,
    latency: '45ms'
  },
  {
    title: 'Database Status',
    description: 'PostgreSQL primary & replicas',
    icon: IconDatabase,
    status: 'Operational',
    healthy: true,
    latency: '12ms'
  },
  {
    title: 'Message Queue',
    description: 'RabbitMQ message broker',
    icon: IconMessage,
    status: 'Operational',
    healthy: true,
    latency: '8ms'
  },
  {
    title: 'Storage Usage',
    description: 'Document and media storage',
    icon: IconServer,
    status: '45%',
    healthy: true,
    latency: null
  },
  {
    title: 'Active Sessions',
    description: 'Currently active user sessions',
    icon: IconUsers,
    status: '23',
    healthy: true,
    latency: null
  }
];

export default function SystemHealthPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='System Health'
      pageDescription='Monitor service status, uptime, and system performance'
    >
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {services.map((service) => (
          <Card key={service.title}>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='bg-muted flex h-9 w-9 items-center justify-center rounded-lg'>
                    <service.icon className='text-muted-foreground h-5 w-5' />
                  </div>
                  <div>
                    <CardTitle className='text-base'>{service.title}</CardTitle>
                    <CardDescription className='text-xs'>
                      {service.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-between'>
                <Badge
                  variant={service.healthy ? 'default' : 'destructive'}
                  className={
                    service.healthy
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
                      : ''
                  }
                >
                  <span className='mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500' />
                  {service.status}
                </Badge>
                {service.latency && (
                  <span className='text-muted-foreground text-xs'>
                    {service.latency}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
