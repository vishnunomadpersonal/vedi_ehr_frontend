import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  IconUsers,
  IconStethoscope,
  IconChartLine,
  IconTestPipe
} from '@tabler/icons-react';

export const metadata = { title: 'Clinical Reports — Vedi EHR' };

const reportTypes = [
  {
    title: 'Patient Demographics',
    description:
      'Analyze patient population by age, gender, ethnicity, and insurance status.',
    icon: IconUsers
  },
  {
    title: 'Encounter Summary',
    description:
      'Summary of patient encounters including visit types, durations, and outcomes.',
    icon: IconStethoscope
  },
  {
    title: 'Diagnosis Trends',
    description:
      'Track ICD-10 diagnosis code trends over time across your patient population.',
    icon: IconChartLine
  },
  {
    title: 'Lab Results Summary',
    description:
      'Aggregate lab result analysis with abnormal value tracking and trends.',
    icon: IconTestPipe
  }
];

export default function ClinicalReportsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Clinical Reports'
      pageDescription='Clinical quality metrics and patient outcome reports'
    >
      <div className='grid gap-4 md:grid-cols-2'>
        {reportTypes.map((report) => (
          <Card
            key={report.title}
            className='cursor-pointer transition-shadow hover:shadow-md'
          >
            <CardHeader>
              <div className='flex items-center gap-3'>
                <report.icon className='h-5 w-5 text-blue-600 dark:text-blue-400' />
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
