import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  IconChartBar,
  IconCalendarStats,
  IconClockHour4,
  IconCalendarEvent
} from '@tabler/icons-react';

export const metadata = { title: 'Operational Reports — Vedi EHR' };

const reportTypes = [
  {
    title: 'Provider Productivity',
    description:
      'Measure provider throughput, patient volume, and RVU generation.',
    icon: IconChartBar
  },
  {
    title: 'Appointment Utilization',
    description:
      'Analyze slot utilization, no-show rates, and scheduling efficiency.',
    icon: IconCalendarStats
  },
  {
    title: 'Wait Time Analysis',
    description:
      'Patient wait time metrics from check-in to provider and overall visit duration.',
    icon: IconClockHour4
  },
  {
    title: 'Staff Schedule Reports',
    description:
      'Staff scheduling coverage, overtime tracking, and resource allocation.',
    icon: IconCalendarEvent
  }
];

export default function OperationalReportsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Operational Reports'
      pageDescription='Provider productivity, scheduling, and workflow analysis'
    >
      <div className='grid gap-4 md:grid-cols-2'>
        {reportTypes.map((report) => (
          <Card
            key={report.title}
            className='cursor-pointer transition-shadow hover:shadow-md'
          >
            <CardHeader>
              <div className='flex items-center gap-3'>
                <report.icon className='h-5 w-5 text-orange-600 dark:text-orange-400' />
                <div>
                  <CardTitle className='text-base'>{report.title}</CardTitle>
                  <CardDescription className='mt-1'>
                    {report.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
