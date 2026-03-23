import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  IconCurrencyDollar,
  IconFileInvoice,
  IconClock,
  IconTrendingUp
} from '@tabler/icons-react';

export const metadata = { title: 'Financial Reports — Vedi EHR' };

const reportTypes = [
  {
    title: 'Revenue Summary',
    description:
      'Monthly and yearly revenue breakdowns by department, provider, and payer.',
    icon: IconCurrencyDollar
  },
  {
    title: 'Claims Analysis',
    description:
      'Track claim submission rates, denial reasons, and resubmission success.',
    icon: IconFileInvoice
  },
  {
    title: 'AR Aging Report',
    description:
      'Accounts receivable aging buckets with payer-level detail and follow-up priorities.',
    icon: IconClock
  },
  {
    title: 'Payment Trends',
    description:
      'Payment collection trends, write-offs, and patient responsibility analysis.',
    icon: IconTrendingUp
  }
];

export default function FinancialReportsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Financial Reports'
      pageDescription='Revenue, claims, and billing analytics'
    >
      <div className='grid gap-4 md:grid-cols-2'>
        {reportTypes.map((report) => (
          <Card
            key={report.title}
            className='cursor-pointer transition-shadow hover:shadow-md'
          >
            <CardHeader>
              <div className='flex items-center gap-3'>
                <report.icon className='h-5 w-5 text-green-600 dark:text-green-400' />
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
