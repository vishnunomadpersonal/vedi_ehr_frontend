import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getList } from '@/constants/mock-data';
import type { Report } from '@/types/ehr';
import {
  IconReportMedical,
  IconCurrencyDollar,
  IconChartBar,
  IconShieldCheck,
  IconClock
} from '@tabler/icons-react';
import Link from 'next/link';

export const metadata = { title: 'Reports & Analytics — Vedi EHR' };

const reportCategories = [
  {
    title: 'Clinical',
    description: 'Patient outcomes, diagnoses, and clinical quality metrics',
    href: '/dashboard/reports/clinical',
    icon: IconReportMedical,
    color: 'text-blue-600 dark:text-blue-400'
  },
  {
    title: 'Financial',
    description: 'Revenue, claims, payments, and billing analytics',
    href: '/dashboard/reports/financial',
    icon: IconCurrencyDollar,
    color: 'text-green-600 dark:text-green-400'
  },
  {
    title: 'Operational',
    description: 'Provider productivity, scheduling, and workflow analysis',
    href: '/dashboard/reports/operational',
    icon: IconChartBar,
    color: 'text-orange-600 dark:text-orange-400'
  },
  {
    title: 'Compliance',
    description: 'HIPAA audits, regulatory compliance, and security reports',
    href: '/dashboard/reports/compliance',
    icon: IconShieldCheck,
    color: 'text-purple-600 dark:text-purple-400'
  }
];

const typeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  clinical: 'default',
  financial: 'secondary',
  operational: 'outline',
  compliance: 'default'
};

export default async function ReportsPage() {
  const { data: reports } = getList('reports');

  return (
    <PageContainer
      scrollable
      pageTitle='Reports & Analytics'
      pageDescription='Generate and view clinical, financial, and operational reports'
    >
      <div className='space-y-8'>
        {/* Category Cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {reportCategories.map((cat) => (
            <Link key={cat.title} href={cat.href}>
              <Card className='transition-shadow hover:shadow-md'>
                <CardHeader className='pb-3'>
                  <div className='flex items-center gap-3'>
                    <cat.icon className={`h-6 w-6 ${cat.color}`} />
                    <CardTitle className='text-base'>{cat.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{cat.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <Link href='/dashboard/reports/builder'>
            <Card className='transition-shadow hover:shadow-md'>
              <CardHeader>
                <CardTitle className='text-base'>
                  Custom Report Builder
                </CardTitle>
                <CardDescription>
                  Build custom reports with drag-and-drop field selection
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Reports */}
        <div>
          <h2 className='mb-4 text-lg font-semibold'>Recent Reports</h2>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {reports.map((report: Report) => (
              <Card key={report.id}>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-sm font-medium'>
                      {report.name}
                    </CardTitle>
                    <Badge variant={typeVariant[report.type] ?? 'outline'}>
                      {report.type}
                    </Badge>
                  </div>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                    <IconClock className='h-3 w-3' />
                    <span>
                      {report.last_run_at
                        ? `Last run: ${new Date(report.last_run_at).toLocaleDateString()}`
                        : 'Never run'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
